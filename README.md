# Beauté d’Or – Cosmétiques & Soins de Beauté

Boutique e-commerce complète pour **Beauté d’Or** (Rufisque, Sénégal) : catalogue, panier persistant, comptes clients,
**commande via WhatsApp**, livraison par zone (Dakar, Rufisque, régions) et tableau de bord administrateur.

| Couche | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router 7, Lucide React |
| Backend | Node.js 20+, Express 5, Zod (validation), Multer (images) |
| Base de données | PostgreSQL 14+ |
| Sécurité | bcrypt (12 tours), JWT en cookie `httpOnly` + `SameSite=Lax`, Helmet (CSP), rate limiting, en-tête anti-CSRF, rôles & permissions |

---

## 1. Installation

Prérequis : **Node.js ≥ 20** et **PostgreSQL** (local ou via Docker).

```bash
# 1. Dépendances (racine + serveur + client)
npm run install:all

# 2. Base de données
#    Option A — Docker :
docker compose up -d db
#    Option B — PostgreSQL local :
#    psql -U postgres -c "CREATE USER beautedor WITH PASSWORD 'beautedor' CREATEDB;"
#    psql -U postgres -c "CREATE DATABASE beautedor OWNER beautedor;"

# 3. Configuration
cp server/.env.example server/.env      # puis modifiez JWT_SECRET et ADMIN_PASSWORD

# 4. Tables + données initiales (6 catégories, 14 produits, zones, admin)
npm run db:seed
```

## 2. Lancer en développement

```bash
npm run dev
```

- Site : http://localhost:5173
- API : http://localhost:4000/api
- Administration : http://localhost:5173/admin — `admin@beautedor.sn` / `Admin@2026` (valeurs de `.env`, **à changer**)

## 3. Tester

```bash
npm test          # tests d'intégration de l'API (catalogue, commande WhatsApp, auth, admin, CSRF)
```

Parcours manuel conseillé :
1. Ajouter des produits au panier → actualiser la page : le panier est conservé.
2. Panier → **Commander via WhatsApp** → remplir le formulaire → WhatsApp s’ouvre avec le récapitulatif.
3. Se connecter en admin → **Commandes** : la commande apparaît « En attente » ; changer son statut.
4. Sur téléphone : ouvrir `http://<IP-de-votre-PC>:5173` (lancer `npm run dev --prefix client -- --host`).

## 4. Fonctionnement de la commande WhatsApp

1. Le client remplit le formulaire de validation (nom, téléphone, adresse, quartier/ville, zone, paiement).
2. Le serveur **recalcule les prix depuis la base** (le client ne peut pas les modifier), ajoute les frais de la zone,
   enregistre la commande avec le statut **`en_attente`** et réserve le stock.
3. Il renvoie le message prérempli, encodé avec `encodeURIComponent`, et le lien `https://wa.me/221783676372?text=…`.
4. WhatsApp s’ouvre (nouvel onglet sur ordinateur, application sur mobile). La page de confirmation indique clairement
   que la commande **n’est transmise qu’après avoir appuyé sur « Envoyer »** dans WhatsApp, et permet de rouvrir le lien.
5. La boutique confirme ensuite la commande depuis l’administration (une annulation remet le stock).

Le numéro WhatsApp se modifie dans **Admin → Livraison & paramètres**.

## 5. Paiements

Wave, Orange Money et paiement à la livraison sont proposés comme **mode de paiement souhaité**. Aucune transaction
n’est simulée : le statut de paiement est mis à jour manuellement par l’équipe (« Non payé » → « Payé »).
Pour encaisser en ligne, il faudra intégrer les API marchandes officielles (Wave Business API, Orange Money Web Payment)
— à brancher sur `POST /api/orders` avec un webhook de confirmation.

## 6. Rôles

| Rôle | Accès |
|---|---|
| `customer` | Son compte, ses commandes, ses favoris, ses avis |
| `staff` | Commandes (lecture + statuts), clients (lecture), produits (lecture), messages |
| `admin` | Tout : produits, prix/promotions, images, catégories, marques, zones de livraison, paramètres, rôles |

Les rôles se changent dans **Admin → Clients**.

## 7. Déploiement

### Option A — Docker (VPS, ex. serveur au Sénégal ou à l’étranger)

```bash
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
export ADMIN_PASSWORD='un-mot-de-passe-solide'
export CLIENT_ORIGIN=https://www.beautedor.sn
docker compose up -d --build
```

Placez ensuite un reverse-proxy HTTPS (Caddy ou Nginx + Let’s Encrypt) devant le port 4000.
Les images envoyées par l’admin sont conservées dans le volume `uploads`.

### Option B — Gratuit : Render (site) + Neon (base PostgreSQL)

1. Créer une base sur https://neon.tech (région Europe) et copier la *connection string*.
2. Pousser le projet sur GitHub.
3. Sur https://render.com → **New → Blueprint** → choisir le dépôt : `render.yaml` configure tout.
   Renseigner `DATABASE_URL` (Neon) et `ADMIN_PASSWORD`. `JWT_SECRET` est généré automatiquement.
4. Les images envoyées depuis l'admin sont stockées dans PostgreSQL (table `images`) : elles ne sont pas
   perdues quand Render redémarre le service.

Limite du plan gratuit Render : le site se met en veille après 15 min sans visite ; la visite suivante
prend environ une minute à charger.

En production, Express sert à la fois l’API et le frontend compilé (`client/dist`), sur une seule URL.

## 8. Structure

```
beaute-dor/
├── client/                    # React + Vite + Tailwind
│   ├── public/images/         # Visuels du hero et de la bannière promo
│   └── src/
│       ├── components/        # Header, Layout (footer, WhatsApp flottant, toasts), ProductCard, Icons
│       ├── context/           # Auth, panier (localStorage), favoris, paramètres, notifications
│       ├── lib/               # Client API, formatage FCFA
│       └── pages/             # Accueil, Boutique, Produit, Panier, Commande, Compte, pages info, admin/
├── server/
│   ├── seed-images/           # Images initiales des produits et catégories
│   ├── src/
│   │   ├── db/                # schema.sql, migrate.js, seed.js
│   │   ├── middleware/auth.js # JWT, rôles, permissions
│   │   ├── routes/            # auth, catalog, orders, admin
│   │   └── utils/whatsapp.js  # Génération du message de commande
│   └── tests/api.test.js
├── Dockerfile
└── docker-compose.yml
```

## 9. API (résumé)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/products?q=&category=&brand=&min=&max=&promo=1&sort=price_asc&page=` | Catalogue filtré |
| GET | `/api/products/:slug` | Fiche produit + avis + produits liés |
| POST | `/api/products/:id/reviews` | Avis (client connecté) |
| GET | `/api/categories`, `/api/brands`, `/api/delivery-zones`, `/api/settings` | Référentiels |
| POST | `/api/orders` | Crée la commande et renvoie le lien WhatsApp |
| GET | `/api/orders/mine` | Historique du client |
| POST | `/api/auth/register` · `/login` · `/logout` | Authentification |
| * | `/api/admin/...` | Produits, promotions, upload, catégories, marques, commandes, clients, zones, paramètres, messages |

Toute requête `POST/PUT/PATCH/DELETE` doit contenir l’en-tête `X-Requested-With: fetch` (protection CSRF).

## 10. À faire avant la mise en ligne

- Remplacer les images produits par des **photos HD officielles** (Admin → Produits → Modifier → Image) : les images
  fournies ont été extraites de la maquette et restent en basse définition.
- Changer `ADMIN_PASSWORD` et `JWT_SECRET`, renseigner le vrai numéro WhatsApp et les liens réseaux sociaux (footer).
- Faire relire les CGV et la politique de confidentialité (loi sénégalaise n° 2008-12, CDP).
