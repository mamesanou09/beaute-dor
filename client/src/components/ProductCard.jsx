import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useCart, useFavorites } from '../context/AppContext';
import { fcfa, imgUrl } from '../lib/format';

export function Stars({ rating = 0, count, size = 'h-3.5 w-3.5' }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={count ? `${rating.toFixed(1)}/5 — ${count} avis` : 'Pas encore d’avis'}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, rating - i + 1));
          return (
            <span key={i} className={`relative ${size}`}>
              <Star className={`absolute inset-0 ${size} text-gold-400/35`} fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${size} text-gold-400`} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          );
        })}
      </span>
      {count !== undefined && <span className="text-[11.5px] text-stone-600">({count})</span>}
    </span>
  );
}

export default function ProductCard({ product: p }) {
  const { add } = useCart();
  const fav = useFavorites();
  const liked = fav.has(p.id);
  const out = p.stock <= 0;

  return (
    <article className="group relative flex h-full flex-col rounded-xl bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover sm:p-4">
      {p.discount > 0 && (
        <span className="badge absolute left-3 top-3 z-10 bg-promo text-white">-{p.discount}%</span>
      )}
      {!p.discount && p.is_new && (
        <span className="badge absolute left-3 top-3 z-10 bg-gold-500 text-white">Nouveau</span>
      )}
      <button
        onClick={() => fav.toggle(p)}
        className={`absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-full transition hover:bg-rose-50 ${liked ? 'text-promo' : 'text-choco-800'}`}
        aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        aria-pressed={liked}
      >
        <Heart className="h-[18px] w-[18px]" fill={liked ? 'currentColor' : 'none'} strokeWidth={1.8} />
      </button>

      <Link to={`/produit/${p.slug}`} className="block">
        <div className="mx-auto flex aspect-[4/3] w-full items-center justify-center overflow-hidden">
          <img src={imgUrl(p.image_url)} alt={`${p.brand} ${p.name}`} loading="lazy"
            className="h-full w-full object-contain mix-blend-multiply transition duration-300 group-hover:scale-105" />
        </div>
      </Link>

      <div className="mt-2 flex flex-1 flex-col">
        <Link to={`/produit/${p.slug}`} className="text-[13px] leading-snug hover:text-gold-600">
          <span className="block font-bold text-ink">{p.brand}</span>
          <span className="line-clamp-2 block text-ink/90">{p.name}{p.format ? ` – ${p.format}` : ''}</span>
        </Link>
        <div className="mt-1"><Stars rating={p.rating} count={p.review_count} /></div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5">
          {p.old_price > p.price && <span className="text-[12.5px] text-stone-500 line-through">{fcfa(p.old_price)}</span>}
          <span className="text-[15px] font-bold text-choco-800">{fcfa(p.price)}</span>
        </div>
        <button onClick={() => add(p)} disabled={out}
          className="btn-primary mt-auto w-full !gap-2 !rounded-md !px-2 !py-2 !text-[12.5px] !font-semibold !shadow-none sm:!text-[13px] [margin-top:max(0.6rem,auto)]">
          <ShoppingCart className="h-4 w-4" strokeWidth={2} />
          {out ? 'Rupture de stock' : 'Ajouter au panier'}
        </button>
      </div>
    </article>
  );
}

export function ProductSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-4 shadow-card">
      <div className="aspect-[4/3] rounded-lg bg-rose-100" />
      <div className="mt-3 h-3 w-1/2 rounded bg-rose-100" />
      <div className="mt-2 h-3 w-4/5 rounded bg-rose-100" />
      <div className="mt-4 h-9 rounded bg-rose-100" />
    </div>
  );
}
