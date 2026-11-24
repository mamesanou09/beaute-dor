import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { asyncHandler, validate, HttpError } from '../utils/http.js';
import { signToken, setAuthCookie, requireAuth, COOKIE_NAME, PERMISSIONS } from '../middleware/auth.js';
import { config } from '../config.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isProd ? 20 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
});

const phoneRegex = /^(\+?221)?\s?(7[0-8])\s?\d{3}\s?\d{2}\s?\d{2}$/;

const registerSchema = z.object({
  full_name: z.string().trim().min(2, 'Nom trop court').max(120),
  email: z.string().trim().toLowerCase().email('Email invalide'),
  phone: z.string().trim().regex(phoneRegex, 'Numéro sénégalais invalide (ex : 77 000 00 00)'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Za-z]/, 'Le mot de passe doit contenir une lettre')
    .regex(/\d/, 'Le mot de passe doit contenir un chiffre'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(phoneRegex, 'Numéro sénégalais invalide'),
  address: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8, 'Au moins 8 caractères').regex(/[A-Za-z]/).regex(/\d/, 'Doit contenir un chiffre'),
});

const publicUser = (u) => ({
  id: u.id, full_name: u.full_name, email: u.email, phone: u.phone, role: u.role,
  address: u.address, city: u.city, created_at: u.created_at, permissions: PERMISSIONS[u.role] || [],
});

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  const exists = await query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (exists.rowCount) throw new HttpError(409, 'Un compte existe déjà avec cet email.');
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `INSERT INTO users (full_name, email, phone, password_hash) VALUES ($1,$2,$3,$4)
     RETURNING id, full_name, email, phone, role, address, city, created_at`,
    [full_name, email, phone, hash]
  );
  setAuthCookie(res, signToken(rows[0]));
  res.status(201).json({ user: publicUser(rows[0]) });
}));

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  // Comparaison même si l'utilisateur n'existe pas (limite l'énumération par timing)
  const ok = await bcrypt.compare(password, user?.password_hash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
  if (!user || !ok) throw new HttpError(401, 'Email ou mot de passe incorrect.');
  setAuthCookie(res, signToken(user));
  res.json({ user: publicUser(user) });
}));

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

router.put('/me', requireAuth, validate(profileSchema), asyncHandler(async (req, res) => {
  const { full_name, phone, address, city } = req.body;
  const { rows } = await query(
    `UPDATE users SET full_name=$1, phone=$2, address=$3, city=$4, updated_at=now() WHERE id=$5
     RETURNING id, full_name, email, phone, role, address, city, created_at`,
    [full_name, phone, address || null, city || null, req.user.id]
  );
  res.json({ user: publicUser(rows[0]) });
}));

router.put('/me/password', requireAuth, validate(passwordSchema), asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
  if (!(await bcrypt.compare(req.body.current_password, rows[0].password_hash))) {
    throw new HttpError(400, 'Mot de passe actuel incorrect.');
  }
  const hash = await bcrypt.hash(req.body.new_password, 12);
  await query('UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2', [hash, req.user.id]);
  res.json({ ok: true });
}));

export default router;
