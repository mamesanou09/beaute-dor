import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config.js';
import { loadUser } from './middleware/auth.js';
import { HttpError } from './utils/http.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import orderRoutes from './routes/orders.js';
import adminRoutes, { UPLOAD_DIR } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.join(__dirname, '../../client/dist');

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'blob:'],
        'connect-src': ["'self'"],
        'upgrade-insecure-requests': config.secureCookies ? [] : null,
      },
    },
  }));
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan(config.isProd ? 'combined' : 'dev'));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());

  // Protection CSRF : toute requête qui modifie des données doit porter l'en-tête
  // personnalisé X-Requested-With (ajouté par le client). Un site tiers ne peut pas
  // l'envoyer sans pré-vérification CORS, refusée pour une origine non autorisée.
  app.use('/api', (req, _res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.headers['x-requested-with'] !== 'fetch') {
      return next(new HttpError(403, 'Requête refusée (en-tête manquant).'));
    }
    next();
  });

  app.use(loadUser);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Route API introuvable.')));

  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

  // En production, le serveur sert aussi le frontend compilé
  if (fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST, { maxAge: '1h', index: false }));
    app.get(/^(?!\/api|\/uploads).*/, (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
  }

  // Gestion centralisée des erreurs
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.code === 'LIMIT_FILE_SIZE') err = new HttpError(400, 'Image trop lourde (3 Mo maximum).');
    if (err.code === '23505') err = new HttpError(409, 'Cet élément existe déjà.');
    if (err.code === '23503') err = new HttpError(409, 'Élément lié à d\'autres données.');
    if (err.type === 'entity.parse.failed') err = new HttpError(400, 'JSON invalide.');
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Erreur interne du serveur.' : err.message, details: err.details });
  });

  return app;
}
