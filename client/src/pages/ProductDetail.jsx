import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingCart, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import ProductCard, { Stars } from '../components/ProductCard';
import { WhatsAppIcon } from '../components/Icons';
import { useAuth, useCart, useFavorites, useShop, useToast } from '../context/AppContext';
import { api } from '../lib/api';
import { date, fcfa, imgUrl, waLink } from '../lib/format';

function ReviewForm({ productId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/api/products/${productId}/reviews`, { rating, comment });
      notify('Merci pour votre avis !');
      setComment('');
      onDone();
    } catch (err) { notify(err.message, { type: 'error' }); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <p className="font-semibold text-choco-800">Donner votre avis</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} role="radio" aria-checked={rating === n}
            className={`text-2xl ${n <= rating ? 'text-gold-400' : 'text-stone-300'}`} aria-label={`${n} étoile(s)`}>★</button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={1000}
        className="input" placeholder="Partagez votre expérience avec ce produit (facultatif)" />
      <button disabled={busy} className="btn-primary">{busy ? 'Envoi…' : 'Publier mon avis'}</button>
    </form>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('desc');
  const { add } = useCart();
  const fav = useFavorites();
  const { user } = useAuth();
  const { settings } = useShop();

  const load = () => api.get(`/api/products/${slug}`).then((d) => { setData(d); document.title = `${d.product.brand} ${d.product.name} | Beauté d'Or`; }).catch((e) => setError(e.message));
  useEffect(() => { setData(null); setQty(1); load(); /* eslint-disable-next-line */ }, [slug]);

  if (error) return (
    <div className="container-bdo py-20 text-center">
      <p className="font-serif text-2xl text-choco-800">{error}</p>
      <Link to="/boutique" className="btn-primary mt-6">Retour à la boutique</Link>
    </div>
  );
  if (!data) return <div className="container-bdo py-20"><div className="h-96 animate-pulse rounded-2xl bg-rose-100" /></div>;

  const { product: p, reviews, related } = data;
  const liked = fav.has(p.id);
  const out = p.stock <= 0;
  const waText = `Bonjour Beauté d'Or ! Je suis intéressé(e) par : ${p.name} ${p.brand} (${p.format || ''}) à ${fcfa(p.price)}. Est-il disponible ?`;

  return (
    <div className="container-bdo py-6 sm:py-10">
      <nav className="mb-5 text-xs text-stone-500">
        <Link to="/">Accueil</Link> / <Link to="/boutique">Boutique</Link>
        {p.category && <> / <Link to={`/boutique?category=${p.category_slug}`}>{p.category}</Link></>} / <span className="text-choco-800">{p.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="relative flex aspect-square items-center justify-center rounded-2xl bg-white p-8 shadow-card">
          {p.discount > 0 && <span className="badge absolute left-4 top-4 bg-promo !px-3 !py-1 !text-sm text-white">-{p.discount}%</span>}
          <img src={imgUrl(p.image_url)} alt={`${p.brand} ${p.name}`} className="max-h-[380px] max-w-full object-contain mix-blend-multiply" />
        </div>

        <div>
          <Link to={`/boutique?brand=${p.brand_slug}`} className="text-sm font-bold uppercase tracking-wider text-gold-600 hover:underline">{p.brand}</Link>
          <h1 className="mt-1 font-serif text-3xl font-bold leading-tight text-choco-800 sm:text-4xl">{p.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-600">
            <Stars rating={p.rating} count={p.review_count} size="h-4 w-4" />
            {p.format && <span>• Format : <strong>{p.format}</strong></span>}
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-choco-800">{fcfa(p.price)}</span>
            {p.old_price > p.price && <span className="text-lg text-stone-500 line-through">{fcfa(p.old_price)}</span>}
          </div>
          <p className={`mt-2 text-sm font-semibold ${out ? 'text-red-600' : p.stock <= 5 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {out ? 'Rupture de stock' : p.stock <= 5 ? `Plus que ${p.stock} en stock` : 'En stock'}
          </p>
          <p className="mt-5 leading-relaxed text-stone-700">{p.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-rose-300 bg-white">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3" aria-label="Diminuer"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-semibold" aria-live="polite">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(p.stock || 1, q + 1))} className="p-3" aria-label="Augmenter"><Plus className="h-4 w-4" /></button>
            </div>
            <button disabled={out} onClick={() => add(p, qty)} className="btn-primary flex-1 !py-3 sm:flex-none sm:!px-8">
              <ShoppingCart className="h-5 w-5" /> Ajouter au panier
            </button>
            <button onClick={() => fav.toggle(p)} className={`btn-outline !p-3 ${liked ? '!text-promo' : ''}`} aria-label="Favoris" aria-pressed={liked}>
              <Heart className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>
          <a href={waLink(settings.whatsapp_number, waText)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-3 w-full !py-3 sm:w-auto">
            <WhatsAppIcon /> Poser une question sur WhatsApp
          </a>

          <ul className="mt-7 grid gap-3 rounded-xl bg-rose-50 p-4 text-sm sm:grid-cols-3">
            <li className="flex items-center gap-2"><Truck className="h-5 w-5 text-choco-800" />Livraison partout au Sénégal</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-choco-800" />Produit 100 % authentique</li>
            <li className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-choco-800" />Échange sous 48h si défaut</li>
          </ul>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex gap-6 border-b border-rose-200">
          {[['desc', 'Description'], ['reviews', `Avis (${p.review_count})`]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 pb-3 font-semibold ${tab === k ? 'border-choco-800 text-choco-800' : 'border-transparent text-stone-500'}`}>{l}</button>
          ))}
        </div>
        {tab === 'desc' ? (
          <div className="max-w-3xl py-6 leading-relaxed text-stone-700">
            <p>{p.description}</p>
            <dl className="mt-5 grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <dt className="font-semibold">Marque</dt><dd>{p.brand}</dd>
              <dt className="font-semibold">Catégorie</dt><dd>{p.category}</dd>
              {p.format && <><dt className="font-semibold">Format</dt><dd>{p.format}</dd></>}
            </dl>
          </div>
        ) : (
          <div className="grid gap-6 py-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {reviews.length === 0 && <p className="text-stone-600">Aucun avis pour le moment. Soyez la première personne à donner votre avis !</p>}
              {reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.author.split(' ')[0]}</span>
                    <span className="text-xs text-stone-500">{date(r.created_at)}</span>
                  </div>
                  <Stars rating={r.rating} />
                  {r.comment && <p className="mt-2 text-sm text-stone-700">{r.comment}</p>}
                </div>
              ))}
            </div>
            {user ? <ReviewForm productId={p.id} onDone={load} />
              : <div className="card p-5 text-sm">
                  <Link to="/connexion" state={{ from: `/produit/${p.slug}` }} className="font-semibold text-choco-800 underline">Connectez-vous</Link> pour laisser un avis.
                </div>}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title !justify-start">Vous aimerez aussi</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
