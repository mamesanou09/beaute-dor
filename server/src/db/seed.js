import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
import { migrate } from './migrate.js';
import { config } from '../config.js';
import { slugify } from '../utils/slugify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_IMG = path.join(__dirname, '../../seed-images');
const UPLOADS = path.join(__dirname, '../../uploads');

/** Copie une image de seed vers /uploads et renvoie son URL publique. */
function img(file) {
  fs.mkdirSync(UPLOADS, { recursive: true });
  fs.copyFileSync(path.join(SEED_IMG, file), path.join(UPLOADS, file));
  return `/uploads/${file}`;
}

const categories = [
  ['Soins du visage', 'cat-soins-visage.jpg'],
  ['Soins corporels', 'cat-soins-corporels.jpg'],
  ['Maquillage', 'cat-maquillage.jpg'],
  ['Cheveux', 'cat-cheveux.jpg'],
  ['Parfums', 'cat-parfums.jpg'],
  ['Accessoires beauté', 'cat-accessoires.jpg'],
];

const brands = [
  ['NIVEA', 'Soins hydratants et nourrissants pour toute la famille.'],
  ['GARNIER', 'Des soins efficaces aux ingrédients d\'origine naturelle.'],
  ['CeraVe', 'Soins développés avec des dermatologues, aux 3 céramides essentiels.'],
  ['Yara', 'Eaux de parfum orientales aux notes gourmandes et florales.'],
  ['Dabur Amla', 'Huiles capillaires à l\'amla pour des cheveux forts et brillants.'],
  ['LA ROCHE-POSAY', 'Dermo-cosmétique pour peaux sensibles et protection solaire.'],
  ['Dove', 'Soins doux et hydratants pour le corps.'],
  ["L'Oréal Paris", 'Soins capillaires et beauté accessibles.'],
  ["Beauté d'Or", 'La sélection maison : accessoires et essentiels beauté.'],
];

// Les 6 produits populaires de la maquette (is_featured = true) + compléments de catalogue.
const products = [
  { name: 'Lait Corps Nourrissant', brand: 'NIVEA', cat: 'Soins corporels', format: '400 ml', price: 3800, old: 4500, img: 'p-nivea-lait-corps.jpg', featured: true, stock: 40,
    desc: 'Lait corporel à la texture riche qui nourrit intensément la peau sèche pendant 48h. Enrichi en huile d\'amande, il laisse la peau douce et souple sans effet gras.' },
  { name: 'Sérum Hydramine C Anti-taches', brand: 'GARNIER', cat: 'Soins du visage', format: '30 ml', price: 8500, img: 'p-garnier-serum-c.jpg', featured: true, stock: 25,
    desc: 'Sérum à la vitamine C qui atténue les taches brunes et ravive l\'éclat du teint. Texture légère, pénètre rapidement. À appliquer matin et soir sur peau propre.' },
  { name: 'Crème Hydratante Visage et Corps', brand: 'CeraVe', cat: 'Soins du visage', format: '340 g', price: 7900, img: 'p-cerave-creme.jpg', featured: true, stock: 30,
    desc: 'Crème hydratante aux 3 céramides essentiels et à l\'acide hyaluronique. Restaure la barrière cutanée et hydrate durablement les peaux sèches à très sèches.' },
  { name: 'Eau de Parfum', brand: 'Yara', cat: 'Parfums', format: '100 ml', price: 14000, old: 17500, img: 'p-yara-parfum.jpg', featured: true, stock: 15,
    desc: 'Un parfum féminin oriental aux notes d\'orchidée, d\'héliotrope et de vanille gourmande. Sillage doux et tenue longue durée.' },
  { name: 'Huile Capillaire', brand: 'Dabur Amla', cat: 'Cheveux', format: '200 ml', price: 3500, img: 'p-dabur-amla.jpg', featured: true, stock: 50,
    desc: 'Huile à l\'amla qui fortifie les cheveux de la racine aux pointes, réduit la casse et apporte brillance. Idéale en bain d\'huile avant shampoing.' },
  { name: 'Anthelios SPF 50+ Crème Solaire', brand: 'LA ROCHE-POSAY', cat: 'Soins du visage', format: '50 ml', price: 12900, img: 'p-lrp-anthelios.jpg', featured: true, stock: 20,
    desc: 'Protection solaire très haute UVA/UVB pour peaux sensibles. Texture fondante, résistante à l\'eau et à la transpiration, adaptée au climat sénégalais.' },

  { name: 'Gel Nettoyant Moussant', brand: 'CeraVe', cat: 'Soins du visage', format: '236 ml', price: 6230, old: 8900, img: 'p-cerave-gel.jpg', isNew: true, stock: 20,
    desc: 'Gel nettoyant moussant pour peaux normales à grasses. Élimine l\'excès de sébum sans dessécher grâce aux céramides et au niacinamide.' },
  { name: 'Shampoing Hydra Hyaluronic', brand: "L'Oréal Paris", cat: 'Cheveux', format: '250 ml', price: 3850, old: 5500, img: 'p-elseve-hydra.jpg', isNew: true, stock: 35,
    desc: 'Shampoing Elseve Hydra Hyaluronic qui hydrate les cheveux déshydratés et leur redonne rebond et brillance.' },
  { name: 'Soin de Nuit Régénérant', brand: 'NIVEA', cat: 'Soins du visage', format: '50 ml', price: 5600, old: 7500, img: 'p-nivea-soin-nuit.jpg', isNew: true, stock: 18,
    desc: 'Crème de nuit qui régénère la peau pendant le sommeil. Au réveil, la peau est reposée, lisse et éclatante.' },
  { name: 'Lait Corps Hydratant', brand: 'Dove', cat: 'Soins corporels', format: '400 ml', price: 4200, img: 'p-dove-lait-corps.jpg', isNew: true, stock: 30,
    desc: 'Lait corporel au ¼ de crème hydratante Dove pour une peau douce et nourrie toute la journée.' },
  { name: 'Crème Visage Hydratante 24H', brand: 'NIVEA', cat: 'Soins du visage', format: '50 ml', price: 4500, img: 'p-nivea-creme-visage.jpg', stock: 25,
    desc: 'Crème de jour hydratante 24H pour tous types de peaux. Texture légère, non grasse.' },
  { name: 'Kit Pinceaux Maquillage', brand: "Beauté d'Or", cat: 'Maquillage', format: '5 pièces', price: 6500, img: 'p-kit-pinceaux.jpg', stock: 12,
    desc: 'Set de pinceaux à poils synthétiques ultra-doux : teint, poudre, blush, fard et estompeur. Manches dorés élégants.' },
  { name: 'Rouge à Lèvres Mat', brand: "Beauté d'Or", cat: 'Maquillage', format: '3,5 g', price: 3000, img: 'p-rouge-levres.jpg', stock: 40,
    desc: 'Rouge à lèvres au fini mat velours, longue tenue et confortable. Teinte rouge intense qui sublime toutes les carnations.' },
  { name: 'Brosse Démêlante Massante', brand: "Beauté d'Or", cat: 'Accessoires beauté', format: '1 pièce', price: 2500, img: 'p-brosse.jpg', stock: 30,
    desc: 'Brosse à picots souples qui démêle sans casser et masse le cuir chevelu. Convient aux cheveux crépus, bouclés et défrisés.' },
];

const zones = [
  ['Dakar', 1500, '24h', 1],
  ['Rufisque', 1000, 'Le jour même', 2],
  ['Autres régions du Sénégal', 3500, '48h à 72h', 3],
];

export async function seed() {
  await migrate();
  const c = await pool.connect();
  try {
    await c.query('BEGIN');

    const catIds = {};
    for (const [i, [name, file]] of categories.entries()) {
      const { rows } = await c.query(
        `INSERT INTO categories (name, slug, image_url, position) VALUES ($1,$2,$3,$4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [name, slugify(name), img(file), i + 1]
      );
      catIds[name] = rows[0].id;
    }

    const brandIds = {};
    for (const [name, description] of brands) {
      const { rows } = await c.query(
        `INSERT INTO brands (name, slug, description) VALUES ($1,$2,$3)
         ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description RETURNING id`,
        [name, slugify(name), description]
      );
      brandIds[name] = rows[0].id;
    }

    for (const p of products) {
      await c.query(
        `INSERT INTO products (name, slug, brand_id, category_id, description, format, price, old_price, stock, image_url, is_featured, is_new)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (slug) DO NOTHING`,
        [p.name, slugify(`${p.brand} ${p.name}`), brandIds[p.brand], catIds[p.cat], p.desc, p.format,
          p.price, p.old || null, p.stock, img(p.img), !!p.featured, !!p.isNew]
      );
    }

    for (const [name, fee, delay, position] of zones) {
      await c.query(
        `INSERT INTO delivery_zones (name, fee, delay, position) VALUES ($1,$2,$3,$4) ON CONFLICT (name) DO NOTHING`,
        [name, fee, delay, position]
      );
    }

    const settings = {
      whatsapp_number: '221783676372',
      shop_phone: '+221 78 367 63 72',
      shop_email: 'contact@beautedor.sn',
      shop_address: 'Rufisque, Sénégal',
      wave_number: '+221 78 367 63 72',
      orange_money_number: '+221 78 367 63 72',
    };
    for (const [k, v] of Object.entries(settings)) {
      await c.query('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING', [k, v]);
    }

    const hash = await bcrypt.hash(config.adminPassword, 12);
    await c.query(
      `INSERT INTO users (full_name, email, password_hash, role, phone, city)
       VALUES ('Administrateur Beauté d''Or', $1, $2, 'admin', '+221 78 367 63 72', 'Rufisque')
       ON CONFLICT (email) DO NOTHING`,
      [config.adminEmail.toLowerCase(), hash]
    );

    await c.query('COMMIT');
    console.log(`✅ Données initiales insérées (admin : ${config.adminEmail})`);
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().then(() => pool.end()).catch((e) => { console.error(e); process.exit(1); });
}
