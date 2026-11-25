import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import { asyncHandler, validate, HttpError } from '../utils/http.js';
import { requirePermission } from '../middleware/auth.js';
import { PRODUCT_SELECT } from './catalog.js';
import { slugify } from '../utils/slugify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const router = Router();

// ---------- Upload d'images ----------
// Les images sont stockées dans PostgreSQL (table "images") : elles survivent aux
// redémarrages des hébergeurs à disque éphémère (Render gratuit, Railway…).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, 'Format d\'image non supporté (JPG, PNG ou WEBP).'));
  },
});

router.post('/upload', requirePermission('products.write'), upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Aucune image reçue.');
  const { rows } = await query('INSERT INTO images (mime, data) VALUES ($1, $2) RETURNING id', [req.file.mimetype, req.file.buffer]);
  res.status(201).json({ url: `/api/images/${rows[0].id}` });
}));

// ---------- Tableau de bord ----------
router.get('/stats', requirePermission('orders.read'), asyncHandler(async (_req, res) => {
  const [orders, revenue, customers, products, byStatus, recent, lowStock] = await Promise.all([
    query('SELECT COUNT(*)::int AS n FROM orders'),
    query("SELECT COALESCE(SUM(total),0)::int AS n FROM orders WHERE status IN ('confirmee','en_preparation','expediee','livree')"),
    query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'customer'"),
    query('SELECT COUNT(*)::int AS n FROM products WHERE is_active'),
    query('SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status'),
    query('SELECT id, reference, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 6'),
    query('SELECT id, name, stock FROM products WHERE is_active AND stock <= 5 ORDER BY stock ASC LIMIT 6'),
  ]);
  res.json({
    orders: orders.rows[0].n, revenue: revenue.rows[0].n, customers: customers.rows[0].n, products: products.rows[0].n,
    by_status: Object.fromEntries(byStatus.rows.map((r) => [r.status, r.n])),
    recent_orders: recent.rows, low_stock: lowStock.rows,
  });
}));

// ---------- Produits ----------
const productSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis').max(160),
  brand_id: z.coerce.number().int().positive().nullable().optional(),
  category_id: z.coerce.number().int().positive().nullable().optional(),
  description: z.string().trim().max(4000).optional().default(''),
  format: z.string().trim().max(40).optional().default(''),
  price: z.coerce.number().int().min(0, 'Prix invalide'),
  old_price: z.coerce.number().int().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  image_url: z.string().trim().max(500).nullable().optional(),
  is_featured: z.coerce.boolean().default(false),
  is_new: z.coerce.boolean().default(false),
  is_active: z.coerce.boolean().default(true),
}).refine((p) => !p.old_price || p.old_price > p.price, {
  message: 'L\'ancien prix doit être supérieur au prix promotionnel.', path: ['old_price'],
});

router.get('/products', requirePermission('products.read'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`${PRODUCT_SELECT} ORDER BY p.id DESC`);
  res.json(rows);
}));

router.get('/products/:id', requirePermission('products.read'), asyncHandler(async (req, res) => {
  const { rows } = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [Number(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, 'Produit introuvable.');
  res.json(rows[0]);
}));

async function uniqueSlug(base, excludeId = 0) {
  let slug = slugify(base) || 'produit';
  for (let i = 2; ; i++) {
    const { rowCount } = await query('SELECT 1 FROM products WHERE slug = $1 AND id <> $2', [slug, excludeId]);
    if (!rowCount) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

async function brandName(id) {
  if (!id) return '';
  const { rows } = await query('SELECT name FROM brands WHERE id = $1', [id]);
  return rows[0]?.name || '';
}

router.post('/products', requirePermission('products.write'), validate(productSchema), asyncHandler(async (req, res) => {
  const p = req.body;
  const slug = await uniqueSlug(`${await brandName(p.brand_id)} ${p.name}`);
  const { rows } = await query(
    `INSERT INTO products (name, slug, brand_id, category_id, description, format, price, old_price, stock, image_url, is_featured, is_new, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [p.name, slug, p.brand_id || null, p.category_id || null, p.description, p.format, p.price, p.old_price || null,
      p.stock, p.image_url || null, p.is_featured, p.is_new, p.is_active]
  );
  res.status(201).json({ id: rows[0].id, slug });
}));

router.put('/products/:id', requirePermission('products.write'), validate(productSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const p = req.body;
  const slug = await uniqueSlug(`${await brandName(p.brand_id)} ${p.name}`, id);
  const { rowCount } = await query(
    `UPDATE products SET name=$1, slug=$2, brand_id=$3, category_id=$4, description=$5, format=$6, price=$7, old_price=$8,
       stock=$9, image_url=$10, is_featured=$11, is_new=$12, is_active=$13, updated_at=now() WHERE id=$14`,
    [p.name, slug, p.brand_id || null, p.category_id || null, p.description, p.format, p.price, p.old_price || null,
      p.stock, p.image_url || null, p.is_featured, p.is_new, p.is_active, id]
  );
  if (!rowCount) throw new HttpError(404, 'Produit introuvable.');
  res.json({ ok: true, slug });
}));

// Gestion rapide des promotions
const promoSchema = z.object({
  price: z.coerce.number().int().min(0),
  old_price: z.coerce.number().int().min(0).nullable(),
}).refine((p) => !p.old_price || p.old_price > p.price, { message: 'L\'ancien prix doit être supérieur au prix.' });

router.patch('/products/:id/promo', requirePermission('products.write'), validate(promoSchema), asyncHandler(async (req, res) => {
  const { rowCount } = await query('UPDATE products SET price=$1, old_price=$2, updated_at=now() WHERE id=$3',
    [req.body.price, req.body.old_price || null, Number(req.params.id)]);
  if (!rowCount) throw new HttpError(404, 'Produit introuvable.');
  res.json({ ok: true });
}));

router.delete('/products/:id', requirePermission('products.write'), asyncHandler(async (req, res) => {
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [Number(req.params.id)]);
  if (!rowCount) throw new HttpError(404, 'Produit introuvable.');
  res.json({ ok: true });
}));

// ---------- Catégories & marques ----------
const catSchema = z.object({
  name: z.string().trim().min(2).max(80),
  image_url: z.string().trim().max(500).nullable().optional(),
  position: z.coerce.number().int().min(0).default(0),
});

router.post('/categories', requirePermission('categories.write'), validate(catSchema), asyncHandler(async (req, res) => {
  const { rows } = await query('INSERT INTO categories (name, slug, image_url, position) VALUES ($1,$2,$3,$4) RETURNING *',
    [req.body.name, slugify(req.body.name), req.body.image_url || null, req.body.position]);
  res.status(201).json(rows[0]);
}));
router.put('/categories/:id', requirePermission('categories.write'), validate(catSchema), asyncHandler(async (req, res) => {
  const { rows } = await query('UPDATE categories SET name=$1, slug=$2, image_url=$3, position=$4 WHERE id=$5 RETURNING *',
    [req.body.name, slugify(req.body.name), req.body.image_url || null, req.body.position, Number(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, 'Catégorie introuvable.');
  res.json(rows[0]);
}));
router.delete('/categories/:id', requirePermission('categories.write'), asyncHandler(async (req, res) => {
  await query('DELETE FROM categories WHERE id = $1', [Number(req.params.id)]);
  res.json({ ok: true });
}));

const brandSchema = z.object({ name: z.string().trim().min(1).max(80), description: z.string().trim().max(500).optional().default('') });
router.post('/brands', requirePermission('categories.write'), validate(brandSchema), asyncHandler(async (req, res) => {
  const { rows } = await query('INSERT INTO brands (name, slug, description) VALUES ($1,$2,$3) RETURNING *',
    [req.body.name, slugify(req.body.name), req.body.description]);
  res.status(201).json(rows[0]);
}));
router.put('/brands/:id', requirePermission('categories.write'), validate(brandSchema), asyncHandler(async (req, res) => {
  const { rows } = await query('UPDATE brands SET name=$1, slug=$2, description=$3 WHERE id=$4 RETURNING *',
    [req.body.name, slugify(req.body.name), req.body.description, Number(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, 'Marque introuvable.');
  res.json(rows[0]);
}));
router.delete('/brands/:id', requirePermission('categories.write'), asyncHandler(async (req, res) => {
  await query('DELETE FROM brands WHERE id = $1', [Number(req.params.id)]);
  res.json({ ok: true });
}));

// ---------- Commandes ----------
const STATUSES = ['en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee'];

router.get('/orders', requirePermission('orders.read'), asyncHandler(async (req, res) => {
  const params = [];
  const where = [];
  if (STATUSES.includes(req.query.status)) { params.push(req.query.status); where.push(`o.status = $${params.length}`); }
  if (req.query.q) {
    params.push(`%${String(req.query.q).slice(0, 80)}%`);
    where.push(`(o.reference ILIKE $${params.length} OR o.customer_name ILIKE $${params.length} OR o.phone ILIKE $${params.length})`);
  }
  const { rows } = await query(
    `SELECT o.*, COALESCE(json_agg(oi ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200`, params);
  res.json(rows);
}));

const statusSchema = z.object({
  status: z.enum(STATUSES).optional(),
  payment_status: z.enum(['non_paye', 'paye', 'rembourse']).optional(),
});

router.patch('/orders/:id', requirePermission('orders.update'), validate(statusSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await withTransaction(async (c) => {
    const cur = await c.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (!cur.rows[0]) throw new HttpError(404, 'Commande introuvable.');
    const from = cur.rows[0].status;
    const to = req.body.status;
    if (to && to !== from) {
      // Restitution / réservation du stock lors d'une annulation / réactivation
      if (to === 'annulee' || from === 'annulee') {
        const sign = to === 'annulee' ? '+' : '-';
        await c.query(
          `UPDATE products p SET stock = GREATEST(0, p.stock ${sign} oi.quantity)
           FROM order_items oi WHERE oi.order_id = $1 AND oi.product_id = p.id`, [id]);
      }
      await c.query('UPDATE orders SET status = $1, updated_at = now() WHERE id = $2', [to, id]);
    }
    if (req.body.payment_status) {
      await c.query('UPDATE orders SET payment_status = $1, updated_at = now() WHERE id = $2', [req.body.payment_status, id]);
    }
  });
  res.json({ ok: true });
}));

// ---------- Clients ----------
router.get('/customers', requirePermission('customers.read'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`
    SELECT u.id, u.full_name, u.email, u.phone, u.role, u.address, u.city, u.created_at,
           COUNT(o.id)::int AS order_count, COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'annulee'), 0)::int AS total_spent
    FROM users u LEFT JOIN orders o ON o.user_id = u.id
    GROUP BY u.id ORDER BY u.created_at DESC`);
  res.json(rows);
}));

router.patch('/customers/:id/role', requirePermission('customers.update'), validate(z.object({ role: z.enum(['customer', 'staff', 'admin']) })),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (id === req.user.id) throw new HttpError(400, 'Vous ne pouvez pas modifier votre propre rôle.');
    const { rowCount } = await query('UPDATE users SET role = $1 WHERE id = $2', [req.body.role, id]);
    if (!rowCount) throw new HttpError(404, 'Utilisateur introuvable.');
    res.json({ ok: true });
  }));

// ---------- Livraison & paramètres ----------
router.get('/delivery-zones', requirePermission('orders.read'), asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT * FROM delivery_zones ORDER BY position, name');
  res.json(rows);
}));

const zoneSchema = z.object({
  name: z.string().trim().min(2).max(80),
  fee: z.coerce.number().int().min(0, 'Frais invalides'),
  delay: z.string().trim().max(80).optional().default(''),
  position: z.coerce.number().int().min(0).default(0),
  is_active: z.coerce.boolean().default(true),
});
router.post('/delivery-zones', requirePermission('settings.write'), validate(zoneSchema), asyncHandler(async (req, res) => {
  const z1 = req.body;
  const { rows } = await query('INSERT INTO delivery_zones (name, fee, delay, position, is_active) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [z1.name, z1.fee, z1.delay, z1.position, z1.is_active]);
  res.status(201).json(rows[0]);
}));
router.put('/delivery-zones/:id', requirePermission('settings.write'), validate(zoneSchema), asyncHandler(async (req, res) => {
  const z1 = req.body;
  const { rows } = await query('UPDATE delivery_zones SET name=$1, fee=$2, delay=$3, position=$4, is_active=$5 WHERE id=$6 RETURNING *',
    [z1.name, z1.fee, z1.delay, z1.position, z1.is_active, Number(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, 'Zone introuvable.');
  res.json(rows[0]);
}));
router.delete('/delivery-zones/:id', requirePermission('settings.write'), asyncHandler(async (req, res) => {
  await query('DELETE FROM delivery_zones WHERE id = $1', [Number(req.params.id)]);
  res.json({ ok: true });
}));

const settingsSchema = z.object({
  whatsapp_number: z.string().trim().regex(/^\d{11,15}$/, 'Numéro WhatsApp au format international sans + (ex : 221783676372)'),
  shop_phone: z.string().trim().max(30),
  shop_email: z.string().trim().email(),
  shop_address: z.string().trim().max(200),
  wave_number: z.string().trim().max(30),
  orange_money_number: z.string().trim().max(30),
}).partial();

router.get('/settings', requirePermission('settings.write'), asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT key, value FROM settings');
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));
router.put('/settings', requirePermission('settings.write'), validate(settingsSchema), asyncHandler(async (req, res) => {
  for (const [k, v] of Object.entries(req.body)) {
    await query('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [k, v]);
  }
  res.json({ ok: true });
}));

// ---------- Messages de contact ----------
router.get('/messages', requirePermission('messages.read'), asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200');
  res.json(rows);
}));
router.patch('/messages/:id/read', requirePermission('messages.read'), asyncHandler(async (req, res) => {
  await query('UPDATE contact_messages SET is_read = true WHERE id = $1', [Number(req.params.id)]);
  res.json({ ok: true });
}));

export default router;
