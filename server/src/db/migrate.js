import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function migrate({ reset = false } = {}) {
  if (reset) {
    await pool.query(`DROP TABLE IF EXISTS contact_messages, settings, order_items, orders, delivery_zones,
      favorites, reviews, products, brands, categories, users CASCADE`);
    console.log('🗑️  Tables supprimées');
  }
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ Schéma appliqué');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate({ reset: process.argv.includes('--reset') })
    .then(() => pool.end())
    .catch((e) => { console.error(e); process.exit(1); });
}
