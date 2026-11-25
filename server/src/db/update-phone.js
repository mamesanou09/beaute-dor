// Met à jour le numéro de la boutique dans une base déjà initialisée.
// Usage : npm run db:update-phone --prefix server
import { pool } from './pool.js';

const values = {
  whatsapp_number: '221783676372',
  shop_phone: '+221 78 367 63 72',
  wave_number: '+221 78 367 63 72',
  orange_money_number: '+221 78 367 63 72',
};
for (const [k, v] of Object.entries(values)) {
  await pool.query('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [k, v]);
}
console.log('✅ Numéro mis à jour : +221 78 367 63 72 (appel + WhatsApp)');
await pool.end();
