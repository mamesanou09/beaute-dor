import { Router } from 'express';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import { asyncHandler, validate, HttpError } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';
import { buildOrderMessage, whatsappUrl } from '../utils/whatsapp.js';
import { config } from '../config.js';

const router = Router();

const orderLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: config.isProd ? 15 : 500, message: { error: 'Trop de commandes en peu de temps. Réessayez plus tard.' } });

const phoneRegex = /^(\+?221)?\s?(7[0-8]|3[0-9])\s?\d{3}\s?\d{2}\s?\d{2}$/;

const orderSchema = z.object({
  items: z.array(z.object({
    product_id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(50),
  })).min(1, 'Votre panier est vide.').max(50),
  customer_name: z.string().trim().min(3, 'Nom complet requis').max(120),
  phone: z.string().trim().regex(phoneRegex, 'Numéro de téléphone invalide (ex : 7X XXX XX XX)'),
  address: z.string().trim().min(5, 'Adresse de livraison requise').max(300),
  district_city: z.string().trim().min(2, 'Quartier / ville requis').max(120),
  zone_id: z.coerce.number().int().positive('Choisissez une zone de livraison'),
  payment_method: z.enum(['wave', 'orange_money', 'cash'], { message: 'Choisissez un mode de paiement' }),
  notes: z.string().trim().max(500).optional().default(''),
});

const newReference = () => {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `BDO-${ymd}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
};

async function loadOrder(id) {
  const o = await query('SELECT * FROM orders WHERE id = $1', [id]);
  if (!o.rows[0]) return null;
  const items = await query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [id]);
  return { ...o.rows[0], items: items.rows };
}

async function shopWhatsapp() {
  const { rows } = await query("SELECT value FROM settings WHERE key = 'whatsapp_number'");
  return rows[0]?.value || '221783676372';
}

/**
 * Enregistre la commande (statut « en_attente ») avec les prix de la base,
 * puis renvoie le message WhatsApp prérempli. La commande n'est PAS considérée
 * comme envoyée : c'est le client qui l'envoie depuis WhatsApp.
 */
router.post('/', orderLimiter, validate(orderSchema), asyncHandler(async (req, res) => {
  const b = req.body;

  // Fusionne les doublons éventuels
  const qty = new Map();
  for (const it of b.items) qty.set(it.product_id, (qty.get(it.product_id) || 0) + it.quantity);
  const ids = [...qty.keys()];

  const orderId = await withTransaction(async (c) => {
    const zone = await c.query('SELECT * FROM delivery_zones WHERE id = $1 AND is_active', [b.zone_id]);
    if (!zone.rows[0]) throw new HttpError(400, 'Zone de livraison invalide.');

    const prods = await c.query(
      `SELECT p.id, p.name, p.format, p.price, p.stock, b.name AS brand FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id WHERE p.id = ANY($1) AND p.is_active FOR UPDATE OF p`, [ids]);
    if (prods.rowCount !== ids.length) throw new HttpError(400, 'Un produit de votre panier n\'est plus disponible.');

    let subtotal = 0;
    const lines = prods.rows.map((p) => {
      const q = qty.get(p.id);
      if (p.stock < q) throw new HttpError(409, `Stock insuffisant pour « ${p.name} » (reste ${p.stock}).`);
      subtotal += p.price * q;
      return { ...p, quantity: q, line_total: p.price * q };
    });
    const fee = zone.rows[0].fee;

    let reference;
    for (let i = 0; i < 5; i++) {
      reference = newReference();
      const dup = await c.query('SELECT 1 FROM orders WHERE reference = $1', [reference]);
      if (!dup.rowCount) break;
    }

    const o = await c.query(
      `INSERT INTO orders (reference, user_id, customer_name, phone, address, district_city, zone_id, zone_name,
         delivery_fee, payment_method, subtotal, total, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [reference, req.user?.id || null, b.customer_name, b.phone, b.address, b.district_city, zone.rows[0].id,
        zone.rows[0].name, fee, b.payment_method, subtotal, subtotal + fee, b.notes || null]
    );
    const id = o.rows[0].id;
    for (const l of lines) {
      await c.query(
        `INSERT INTO order_items (order_id, product_id, product_name, brand, format, unit_price, quantity, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, l.id, l.name, l.brand, l.format, l.price, l.quantity, l.line_total]
      );
      await c.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [l.quantity, l.id]);
    }
    return id;
  });

  const order = await loadOrder(orderId);
  const message = buildOrderMessage(order, order.items);
  res.status(201).json({ order, whatsapp_message: message, whatsapp_url: whatsappUrl(await shopWhatsapp(), message) });
}));

// Historique du client connecté
router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT o.*, COALESCE(json_agg(oi ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`, [req.user.id]);
  res.json(rows);
}));

// Détail d'une commande du client (permet de régénérer le lien WhatsApp)
router.get('/mine/:reference', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT id FROM orders WHERE reference = $1 AND user_id = $2', [req.params.reference, req.user.id]);
  if (!rows[0]) throw new HttpError(404, 'Commande introuvable.');
  const order = await loadOrder(rows[0].id);
  const message = buildOrderMessage(order, order.items);
  res.json({ order, whatsapp_message: message, whatsapp_url: whatsappUrl(await shopWhatsapp(), message) });
}));

export default router;
