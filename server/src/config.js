import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.ADMIN_PASSWORD && process.argv.some((a) => a.includes('seed'))) {
  throw new Error('ADMIN_PASSWORD manquant en production.');
}
if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET manquant ou trop court (32 caractères minimum) en production.');
}

export const config = {
  isProd,
  // HTTPS requis pour les cookies sécurisés ; COOKIE_SECURE=false pour tester en HTTP local
  secureCookies: isProd && process.env.COOKIE_SECURE !== 'false',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || 'postgres://beautedor:beautedor@localhost:5432/beautedor',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-a-changer-absolument-en-production-0123456789',
  jwtExpiresIn: '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@beautedor.sn',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@2026',
};
