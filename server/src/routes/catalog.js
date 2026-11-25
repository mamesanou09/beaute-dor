import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { asyncHandler, validate, HttpError } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

export const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.slug, p.description, p.format, p.price, p.old_price, p.stock, p.image_url,
         p.is_featured, p.is_new, p.is_active, p.created_at, p.updated_at,
         p.brand_id, b.name AS brand, b.slug AS brand_slug,
         p.category_id, c.name AS category, c.slug AS category_slug,
         COALESCE(r.avg_rating, 0)::float AS rating, COALESCE(r.review_count, 0)::int AS review_count,
         CASE WHEN p.old_price > p.price THEN FLOOR((1 - p.price::numeric / p.old_price) * 100)::int ELSE 0 END AS discount
  FROM products p
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN (SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count FROM reviews GROUP BY product_id) r
    ON r.product_id = p.id`;

const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  ids: z.string().trim().regex(/^\d+(,\d+)*$/).max(400).optional(),
  category: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(200).optional(),          // slugs séparés par des virgules
  min: z.coerce.number().int().min(0).optional(),
  max: z.coerce.number().int().min(0).optional(),
  promo: z.enum(['1', 'true']).optional(),
  featured: z.enum(['1', 'true']).optional(),
  new: z.enum(['1', 'true']).optional(),
  sort: z.enum(['recent', 'price_asc', 'price_desc', 'name', 'popular', 'discount']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
});

const SORTS = {
  recent: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  name: 'p.name ASC',
  popular: 'p.is_featured DESC, review_count DESC, p.id ASC',
  discount: 'discount DESC, p.id ASC',
};

router.get('/products', validate(listSchema, 'query'), asyncHandler(async (req, res) => {
  const f = req.validatedQuery;
  const where = ['p.is_active = true'];
  const params = [];
  const add = (v) => { params.push(v); return `$${params.length}`; };

  if (f.q) {
    const term = add(`%${f.q}%`);
    where.push(`(unaccent_lower(p.name) LIKE unaccent_lower(${term}) OR unaccent_lower(b.name) LIKE unaccent_lower(${term})
                 OR unaccent_lower(c.name) LIKE unaccent_lower(${term}))`);
  }
  if (f.ids) where.push(`p.id = ANY(${add(f.ids.split(',').map(Number))})`);
  if (f.category) where.push(`c.slug = ${add(f.category)}`);
  if (f.brand) where.push(`b.slug = ANY(${add(f.brand.split(',').filter(Boolean))})`);
  if (f.min !== undefined) where.push(`p.price >= ${add(f.min)}`);
  if (f.max !== undefined) where.push(`p.price <= ${add(f.max)}`);
  if (f.promo) where.push('p.old_price > p.price');
  if (f.featured) where.push('p.is_featured = true');
  if (f.new) where.push('p.is_new = true');

  const base = `${PRODUCT_SELECT} WHERE ${where.join(' AND ')}`;
  const count = await query(`SELECT COUNT(*)::int AS n FROM (${base}) t`, params);
  const order = SORTS[f.sort || 'popular'];
  const offset = (f.page - 1) * f.limit;
  const { rows } = await query(`${base} ORDER BY ${order} LIMIT ${f.limit} OFFSET ${offset}`, params);

  res.json({ items: rows, total: count.rows[0].n, page: f.page, pages: Math.max(1, Math.ceil(count.rows[0].n / f.limit)) });
}));

router.get('/products/:slug', asyncHandler(async (req, res) => {
  const { rows } = await query(`${PRODUCT_SELECT} WHERE p.slug = $1 AND p.is_active = true`, [req.params.slug]);
  if (!rows[0]) throw new HttpError(404, 'Produit introuvable.');
  const product = rows[0];
  const [reviews, related] = await Promise.all([
    query(`SELECT r.id, r.rating, r.comment, r.created_at, u.full_name AS author
           FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = $1 ORDER BY r.created_at DESC LIMIT 50`, [product.id]),
    query(`${PRODUCT_SELECT} WHERE p.is_active = true AND p.category_id = $1 AND p.id <> $2 ORDER BY p.is_featured DESC LIMIT 4`,
      [product.category_id, product.id]),
  ]);
  res.json({ product, reviews: reviews.rows, related: related.rows });
}));

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().default(''),
});

// Avis réels : seul un client connecté peut noter, un avis par produit (modifiable).
router.post('/products/:id/reviews', requireAuth, validate(reviewSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const p = await query('SELECT 1 FROM products WHERE id = $1', [id]);
  if (!p.rowCount) throw new HttpError(404, 'Produit introuvable.');
  await query(
    `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1,$2,$3,$4)
     ON CONFLICT (product_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()`,
    [id, req.user.id, req.body.rating, req.body.comment]
  );
  res.status(201).json({ ok: true });
}));

// Images envoyées depuis l'administration (stockées en base)
router.get('/images/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(404, 'Image introuvable.');
  const { rows } = await query('SELECT mime, data FROM images WHERE id = $1', [id]);
  if (!rows[0]) throw new HttpError(404, 'Image introuvable.');
  res.set('Content-Type', rows[0].mime);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(rows[0].data);
}));

router.get('/categories', asyncHandler(async (_req, res) => {
  const { rows } = await query(`
    SELECT c.*, COUNT(p.id) FILTER (WHERE p.is_active)::int AS product_count
    FROM categories c LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id ORDER BY c.position, c.name`);
  res.json(rows);
}));

router.get('/brands', asyncHandler(async (_req, res) => {
  const { rows } = await query(`
    SELECT b.*, COUNT(p.id) FILTER (WHERE p.is_active)::int AS product_count
    FROM brands b LEFT JOIN products p ON p.brand_id = b.id
    GROUP BY b.id ORDER BY b.name`);
  res.json(rows);
}));

router.get('/delivery-zones', asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT id, name, fee, delay FROM delivery_zones WHERE is_active ORDER BY position, name');
  res.json(rows);
}));

const PUBLIC_SETTINGS = ['whatsapp_number', 'shop_phone', 'shop_email', 'shop_address', 'wave_number', 'orange_money_number'];
router.get('/settings', asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT key, value FROM settings WHERE key = ANY($1)', [PUBLIC_SETTINGS]);
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));

// Favoris (compte client)
router.get('/favorites', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `${PRODUCT_SELECT} JOIN favorites f ON f.product_id = p.id WHERE f.user_id = $1 ORDER BY f.created_at DESC`, [req.user.id]);
  res.json(rows);
}));
router.post('/favorites/:id', requireAuth, asyncHandler(async (req, res) => {
  await query('INSERT INTO favorites (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, Number(req.params.id)]);
  res.status(201).json({ ok: true });
}));
router.delete('/favorites/:id', requireAuth, asyncHandler(async (req, res) => {
  await query('DELETE FROM favorites WHERE user_id = $1 AND product_id = $2', [req.user.id, Number(req.params.id)]);
  res.json({ ok: true });
}));

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis').max(120),
  email: z.string().trim().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Message trop court (10 caractères min.)').max(2000),
});
router.post('/contact', validate(contactSchema), asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;
  await query('INSERT INTO contact_messages (name, email, phone, message) VALUES ($1,$2,$3,$4)',
    [name, email || null, phone || null, message]);
  res.status(201).json({ ok: true });
}));

export default router;
