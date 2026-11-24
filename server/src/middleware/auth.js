import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { HttpError } from '../utils/http.js';

export const COOKIE_NAME = 'bdo_token';

/** Rôles et permissions. */
export const PERMISSIONS = {
  customer: [],
  staff: ['orders.read', 'orders.update', 'customers.read', 'products.read', 'messages.read'],
  admin: ['orders.read', 'orders.update', 'customers.read', 'customers.update', 'products.read', 'products.write',
    'categories.write', 'settings.write', 'messages.read', 'stats.read'],
};
export const can = (role, perm) => (PERMISSIONS[role] || []).includes(perm);

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600 * 1000,
    path: '/',
  });
}

/** Charge l'utilisateur si un token valide est présent (sans l'exiger). */
export async function loadUser(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const { rows } = await query(
      'SELECT id, full_name, email, phone, role, address, city, created_at FROM users WHERE id = $1',
      [payload.sub]
    );
    if (rows[0]) req.user = rows[0];
  } catch {
    /* token invalide ou expiré : on ignore */
  }
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Veuillez vous connecter.'));
  next();
}

export const requirePermission = (perm) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Veuillez vous connecter.'));
  if (!can(req.user.role, perm)) return next(new HttpError(403, 'Accès refusé.'));
  next();
};
