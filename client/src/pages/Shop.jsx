import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import ProductCard, { ProductSkeleton } from '../components/ProductCard';
import { PageHeader } from '../components/Layout';
import { useShop } from '../context/AppContext';
import { api, qs } from '../lib/api';

const SORTS = [
  ['popular', 'Popularité'],
  ['recent', 'Nouveautés'],
  ['price_asc', 'Prix croissant'],
  ['price_desc', 'Prix décroissant'],
  ['discount', 'Meilleures remises'],
  ['name', 'Nom (A → Z)'],
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const { categories, brands } = useShop();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [drawer, setDrawer] = useState(false);

  const f = Object.fromEntries(params.entries());
  const selectedBrands = (f.brand || '').split(',').filter(Boolean);
  const [priceDraft, setPriceDraft] = useState({ min: f.min || '', max: f.max || '' });

  useEffect(() => { setPriceDraft({ min: f.min || '', max: f.max || '' }); }, [f.min, f.max]);

  useEffect(() => {
    setData(null);
    setError('');
    api.get(`/api/products${qs({ ...f, limit: 12 })}`).then(setData).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === undefined || v === '' || v === null ? next.delete(k) : next.set(k, v)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };
  const toggleBrand = (slug) => {
    const set = new Set(selectedBrands);
    set.has(slug) ? set.delete(slug) : set.add(slug);
    update({ brand: [...set].join(',') });
  };

  const category = categories.find((c) => c.slug === f.category);
  const title = f.q ? `Résultats pour « ${f.q} »` : category ? category.name : f.promo ? 'Promotions' : f.new ? 'Nouveautés' : 'Boutique';
  const activeCount = ['category', 'brand', 'min', 'max', 'promo', 'new', 'q'].filter((k) => f[k]).length;

  const Filters = (
    <div className="space-y-6 text-sm">
      <div>
        <h3 className="mb-2 font-serif text-base font-semibold text-choco-800">Recherche</h3>
        <form onSubmit={(e) => { e.preventDefault(); update({ q: new FormData(e.target).get('q') }); }} className="relative">
          <input name="q" defaultValue={f.q || ''} key={f.q} placeholder="Nom ou marque…" className="input !pr-10" />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-choco-800" aria-label="Rechercher"><Search className="h-4 w-4" /></button>
        </form>
      </div>
      <div>
        <h3 className="mb-2 font-serif text-base font-semibold text-choco-800">Catégories</h3>
        <ul className="space-y-1">
          <li><button onClick={() => update({ category: '' })} className={`w-full rounded-md px-2 py-1.5 text-left hover:bg-rose-50 ${!f.category ? 'bg-rose-100 font-semibold text-choco-800' : ''}`}>Toutes les catégories</button></li>
          {categories.map((c) => (
            <li key={c.id}>
              <button onClick={() => update({ category: c.slug })}
                className={`flex w-full justify-between rounded-md px-2 py-1.5 text-left hover:bg-rose-50 ${f.category === c.slug ? 'bg-rose-100 font-semibold text-choco-800' : ''}`}>
                {c.name}<span className="text-stone-400">{c.product_count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-serif text-base font-semibold text-choco-800">Marques</h3>
        <ul className="space-y-1.5">
          {brands.filter((b) => b.product_count > 0).map((b) => (
            <li key={b.id}>
              <label className="flex cursor-pointer items-center gap-2.5 px-1">
                <input type="checkbox" checked={selectedBrands.includes(b.slug)} onChange={() => toggleBrand(b.slug)} className="h-4 w-4 accent-choco-800" />
                <span className="flex-1">{b.name}</span><span className="text-stone-400">{b.product_count}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-serif text-base font-semibold text-choco-800">Prix (FCFA)</h3>
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); update({ min: priceDraft.min, max: priceDraft.max }); }}>
          <input type="number" min="0" inputMode="numeric" placeholder="Min" value={priceDraft.min} onChange={(e) => setPriceDraft((p) => ({ ...p, min: e.target.value }))} className="input !px-2" aria-label="Prix minimum" />
          <span>–</span>
          <input type="number" min="0" inputMode="numeric" placeholder="Max" value={priceDraft.max} onChange={(e) => setPriceDraft((p) => ({ ...p, max: e.target.value }))} className="input !px-2" aria-label="Prix maximum" />
          <button className="btn-primary !px-3 !shadow-none">OK</button>
        </form>
      </div>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2.5 px-1">
          <input type="checkbox" checked={!!f.promo} onChange={(e) => update({ promo: e.target.checked ? '1' : '' })} className="h-4 w-4 accent-choco-800" />
          En promotion
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 px-1">
          <input type="checkbox" checked={!!f.new} onChange={(e) => update({ new: e.target.checked ? '1' : '' })} className="h-4 w-4 accent-choco-800" />
          Nouveautés
        </label>
      </div>
      {activeCount > 0 && (
        <button onClick={() => setParams({})} className="btn-outline w-full">Réinitialiser les filtres</button>
      )}
    </div>
  );

  return (
    <>
      <PageHeader title={title} crumbs={[['/boutique', 'Boutique'], ...(category ? [[null, category.name]] : [])]}
        subtitle="Soins du visage, corps, cheveux, maquillage et parfums — 100 % authentiques, livrés partout au Sénégal." />
      <div className="container-bdo grid gap-8 py-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block"><div className="card sticky top-32 p-5">{Filters}</div></aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600">{data ? `${data.total} produit${data.total > 1 ? 's' : ''}` : 'Chargement…'}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setDrawer(true)} className="btn-outline !px-3 !py-2 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filtres {activeCount > 0 && `(${activeCount})`}
              </button>
              <label className="sr-only" htmlFor="sort">Trier</label>
              <select id="sort" value={f.sort || 'popular'} onChange={(e) => update({ sort: e.target.value })} className="input !w-auto !py-2">
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {!data && !error && Array.from({ length: 8 }).map((_, k) => <ProductSkeleton key={k} />)}
            {data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {data && data.items.length === 0 && (
            <div className="card p-10 text-center">
              <p className="font-serif text-xl text-choco-800">Aucun produit ne correspond à votre recherche.</p>
              <button onClick={() => setParams({})} className="btn-primary mt-4">Voir tous les produits</button>
            </div>
          )}
          {data && data.pages > 1 && (
            <nav className="mt-8 flex justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: data.pages }).map((_, k) => (
                <button key={k} onClick={() => { update({ page: k + 1 }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`h-10 w-10 rounded-lg text-sm font-semibold ${data.page === k + 1 ? 'bg-choco-800 text-white' : 'bg-white shadow-card hover:bg-rose-50'}`}>
                  {k + 1}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-choco-950/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-white p-5 animate-slide-in">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-choco-800">Filtres</h2>
              <button onClick={() => setDrawer(false)} aria-label="Fermer"><X className="h-6 w-6" /></button>
            </div>
            {Filters}
            <button onClick={() => setDrawer(false)} className="btn-primary mt-6 w-full">Voir les {data?.total ?? ''} produits</button>
          </div>
        </div>
      )}
    </>
  );
}
