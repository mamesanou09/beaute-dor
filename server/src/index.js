import { createApp } from './app.js';
import { config } from './config.js';
import { migrate } from './db/migrate.js';

await migrate(); // applique le schéma (idempotent) au démarrage

createApp().listen(config.port, () => {
  console.log(`🌸 API Beauté d'Or sur http://localhost:${config.port}`);
});
