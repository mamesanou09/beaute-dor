// Tests d'intégration de l'API (nécessite PostgreSQL et `npm run db:seed`).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { config } from '../src/config.js';

process.env.NODE_ENV = 'test';
const app = createApp();
const H = { 'X-Requested-With': 'fetch' };
after(() => pool.end());

test('catalogue : liste, recherche, filtres et tri', async () => {
  const all = await request(app).get('/api/products?limit=60');
  assert.equal(all.status, 200);
  assert.ok(all.body.total >= 6);

  const featured = await request(app).get('/api/products?featured=1');
  assert.equal(featured.body.items.length, 6);
  const nivea = featured.body.items.find((p) => p.brand === 'NIVEA');
  assert.equal(nivea.price, 3800);
  assert.equal(nivea.discount, 15);

  const byBrand = await request(app).get('/api/products?q=garnier');
  assert.ok(byBrand.body.items.every((p) => p.brand === 'GARNIER'));

  const accent = await request(app).get('/api/products?q=serum');
  assert.ok(accent.body.items.some((p) => p.name.includes('Sérum')));

  const cat = await request(app).get('/api/products?category=parfums');
  assert.ok(cat.body.items.every((p) => p.category_slug === 'parfums'));

  const asc = await request(app).get('/api/products?sort=price_asc&limit=60');
  const prices = asc.body.items.map((p) => p.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
});

test('CSRF : une mutation sans en-tête est refusée', async () => {
  const r = await request(app).post('/api/auth/login').send({ email: 'x@y.sn', password: 'x' });
  assert.equal(r.status, 403);
});

test('commande : prix recalculés côté serveur + message WhatsApp', async () => {
  const zones = await request(app).get('/api/delivery-zones');
  const dakar = zones.body.find((z) => z.name === 'Dakar');
  const { body } = await request(app).get('/api/products?featured=1');
  const nivea = body.items.find((p) => p.brand === 'NIVEA');

  const r = await request(app).post('/api/orders').set(H).send({
    items: [{ product_id: nivea.id, quantity: 2, price: 1 /* ignoré */ }],
    customer_name: 'Awa Ndiaye', phone: '78 367 63 72', address: 'Cité Keur Gorgui, villa 12',
    district_city: 'Dakar', zone_id: dakar.id, payment_method: 'wave',
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.order.subtotal, 7600);
  assert.equal(r.body.order.total, 7600 + dakar.fee);
  assert.equal(r.body.order.status, 'en_attente');
  assert.match(r.body.whatsapp_message, /Produit : Lait Corps Nourrissant NIVEA/);
  assert.match(r.body.whatsapp_message, /Sous-total : 7 600 FCFA/);
  assert.ok(r.body.whatsapp_url.startsWith('https://wa.me/221783676372?text='));
  assert.equal(decodeURIComponent(r.body.whatsapp_url.split('text=')[1]), r.body.whatsapp_message);
});

test('commande : validation des champs', async () => {
  const r = await request(app).post('/api/orders').set(H).send({ items: [], customer_name: '' });
  assert.equal(r.status, 400);
});

test('auth : inscription, profil, historique, déconnexion', async () => {
  const agent = request.agent(app);
  const email = `test${Date.now()}@mail.sn`;
  const reg = await agent.post('/api/auth/register').set(H)
    .send({ full_name: 'Fatou Diop', email, phone: '78 367 63 72', password: 'motdepasse1' });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.user.role, 'customer');
  assert.equal((await agent.get('/api/auth/me')).body.user.email, email);
  assert.equal((await agent.get('/api/orders/mine')).status, 200);
  assert.equal((await agent.get('/api/admin/stats')).status, 403);
  await agent.post('/api/auth/logout').set(H);
  assert.equal((await agent.get('/api/auth/me')).body.user, null);
});

test('admin : accès protégé et gestion produit', async () => {
  assert.equal((await request(app).get('/api/admin/products')).status, 401);
  const agent = request.agent(app);
  const login = await agent.post('/api/auth/login').set(H).send({ email: config.adminEmail, password: config.adminPassword });
  assert.equal(login.status, 200);
  const created = await agent.post('/api/admin/products').set(H)
    .send({ name: 'Produit Test', price: 1000, old_price: 2000, stock: 3 });
  assert.equal(created.status, 201);
  const bad = await agent.put(`/api/admin/products/${created.body.id}`).set(H).send({ name: 'Produit Test', price: 3000, old_price: 2000 });
  assert.equal(bad.status, 400);
  assert.equal((await agent.delete(`/api/admin/products/${created.body.id}`).set(H)).status, 200);
  const stats = await agent.get('/api/admin/stats');
  assert.equal(stats.status, 200);
});

test('admin : upload d\'image stockée en base', async () => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').set(H).send({ email: config.adminEmail, password: config.adminPassword });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const up = await agent.post('/api/admin/upload').set(H).attach('image', png, { filename: 'p.png', contentType: 'image/png' });
  assert.equal(up.status, 201, JSON.stringify(up.body));
  const img = await request(app).get(up.body.url);
  assert.equal(img.status, 200);
  assert.equal(img.headers['content-type'], 'image/png');
});
