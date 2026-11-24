import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, Wallet, Users, Package, Plus, Pencil, Trash2, Search, Upload, ChevronDown, AlertTriangle, Save, Percent } from 'lucide-react';
import { WhatsAppIcon } from '../../components/Icons';
import { useAuth, useShop, useToast } from '../../context/AppContext';
import { api, qs } from '../../lib/api';
import { dateTime, fcfa, imgUrl, ORDER_STATUS, PAYMENT_LABELS, PAYMENT_STATUS, waLink } from '../../lib/format';

const Title = ({ children, action }) => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <h2 className="font-serif text-2xl font-bold text-choco-800">{children}</h2>{action}
  </div>
);

function useLoad(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => api.get(path).then(setData).catch((e) => setError(e.message)), [path]);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload };
}

const Loading = () => <div className="h-40 animate-pulse rounded-xl bg-rose-100" />;
const ErrorBox = ({ msg }) => <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{msg}</p>;

/* ------------------------------ Tableau de bord ------------------------------ */
export function Dashboard() {
  const { data, error } = useLoad('/api/admin/stats');
  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Loading />;
  const cards = [
    [ShoppingBag, 'Commandes', data.orders, 'bg-rose-100 text-choco-800'],
    [Wallet, 'Chiffre d’affaires confirmé', fcfa(data.revenue), 'bg-amber-100 text-amber-800'],
    [Users, 'Clients inscrits', data.customers, 'bg-sky-100 text-sky-800'],
    [Package, 'Produits actifs', data.products, 'bg-emerald-100 text-emerald-800'],
  ];
  return (
    <div className="space-y-6">
      <Title>Tableau de bord</Title>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([Icon, label, value, cls]) => (
          <div key={label} className="card flex items-center gap-4 p-5">
            <span className={`grid h-12 w-12 place-items-center rounded-xl ${cls}`}><Icon className="h-6 w-6" /></span>
            <span><span className="block text-xs text-stone-500">{label}</span><span className="block text-xl font-bold">{value}</span></span>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Object.entries(ORDER_STATUS).map(([k, s]) => (
          <Link key={k} to={`/admin/commandes?status=${k}`} className="card p-4 text-center hover:shadow-card-hover">
            <span className={`badge ${s.cls}`}>{s.label}</span>
            <p className="mt-2 text-2xl font-bold">{data.by_status[k] || 0}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Dernières commandes</h3><Link to="/admin/commandes" className="text-sm text-gold-600">Tout voir →</Link></div>
          {data.recent_orders.length === 0 ? <p className="text-sm text-stone-500">Aucune commande pour le moment.</p> : (
            <table className="w-full text-sm"><tbody className="divide-y divide-rose-100">
              {data.recent_orders.map((o) => (
                <tr key={o.id}><td className="py-2 font-semibold">{o.reference}</td><td className="hidden py-2 sm:table-cell">{o.customer_name}</td>
                  <td className="py-2">{fcfa(o.total)}</td><td className="py-2 text-right"><span className={`badge ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span></td></tr>
              ))}
            </tbody></table>
          )}
        </div>
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-amber-600" />Stock faible (≤ 5)</h3>
          {data.low_stock.length === 0 ? <p className="text-sm text-stone-500">Tous les stocks sont suffisants.</p> : (
            <ul className="divide-y divide-rose-100 text-sm">
              {data.low_stock.map((p) => <li key={p.id} className="flex justify-between py-2"><Link to={`/admin/produits/${p.id}`} className="hover:text-gold-600">{p.name}</Link><span className={`font-bold ${p.stock === 0 ? 'text-red-600' : 'text-amber-700'}`}>{p.stock}</span></li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Produits --------------------------------- */
function PromoEditor({ product, onSaved }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(product.price);
  const [old, setOld] = useState(product.old_price || '');
  const { notify } = useToast();
  const save = async () => {
    try {
      await api.patch(`/api/admin/products/${product.id}/promo`, { price: Number(price), old_price: old ? Number(old) : null });
      notify('Prix mis à jour'); setOpen(false); onSaved();
    } catch (e) { notify(e.message, { type: 'error' }); }
  };
  if (!open) return <button onClick={() => setOpen(true)} className="rounded p-1.5 text-gold-600 hover:bg-amber-50" title="Prix / promotion"><Percent className="h-4 w-4" /></button>;
  return (
    <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl bg-white p-4 text-left shadow-card-hover ring-1 ring-rose-100">
      <p className="mb-2 text-sm font-semibold">Prix & promotion</p>
      <label className="text-xs">Ancien prix (vide = pas de promo)</label>
      <input type="number" className="input mb-2 !py-1.5" value={old} onChange={(e) => setOld(e.target.value)} />
      <label className="text-xs">Prix de vente</label>
      <input type="number" className="input !py-1.5" value={price} onChange={(e) => setPrice(e.target.value)} />
      {old > 0 && price > 0 && Number(old) > Number(price) && <p className="mt-1 text-xs text-emerald-700">Remise : -{Math.floor((1 - price / old) * 100)} %</p>}
      <div className="mt-3 flex gap-2"><button onClick={save} className="btn-primary !px-3 !py-1.5 !shadow-none">OK</button><button onClick={() => setOpen(false)} className="btn-ghost !px-3 !py-1.5">Annuler</button></div>
    </div>
  );
}

export function Products() {
  const { data, error, reload } = useLoad('/api/admin/products');
  const { can } = useAuth();
  const { notify } = useToast();
  const [q, setQ] = useState('');
  const write = can('products.write');

  const del = async (p) => {
    if (!confirm(`Supprimer définitivement « ${p.name} » ?`)) return;
    try { await api.del(`/api/admin/products/${p.id}`); notify('Produit supprimé'); reload(); } catch (e) { notify(e.message, { type: 'error' }); }
  };

  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Loading />;
  const list = data.filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Title action={write && <Link to="/admin/produits/nouveau" className="btn-primary"><Plus className="h-4 w-4" />Ajouter un produit</Link>}>Produits ({data.length})</Title>
      <div className="relative mb-4 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="input !pl-9" /></div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-rose-50 text-left text-xs uppercase text-stone-500">
            <tr><th className="p-3">Produit</th><th className="p-3">Catégorie</th><th className="p-3">Prix</th><th className="p-3">Stock</th><th className="p-3">Statut</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-rose-100">
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-rose-50/40">
                <td className="p-3"><div className="flex items-center gap-3">
                  <img src={imgUrl(p.image_url)} alt="" className="h-11 w-11 rounded-lg bg-rose-50 object-contain" />
                  <div><p className="font-semibold">{p.name}</p><p className="text-xs text-stone-500">{p.brand} · {p.format}</p></div></div></td>
                <td className="p-3">{p.category || '—'}</td>
                <td className="p-3"><span className="font-semibold">{fcfa(p.price)}</span>
                  {p.discount > 0 && <span className="ml-1.5 badge bg-promo text-white">-{p.discount}%</span>}
                  {p.old_price > p.price && <span className="block text-xs text-stone-400 line-through">{fcfa(p.old_price)}</span>}</td>
                <td className={`p-3 font-semibold ${p.stock === 0 ? 'text-red-600' : p.stock <= 5 ? 'text-amber-700' : ''}`}>{p.stock}</td>
                <td className="p-3 space-x-1">
                  <span className={`badge ${p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>{p.is_active ? 'En ligne' : 'Masqué'}</span>
                  {p.is_featured && <span className="badge bg-amber-100 text-amber-800">Populaire</span>}
                  {p.is_new && <span className="badge bg-sky-100 text-sky-800">Nouveau</span>}
                </td>
                <td className="relative p-3"><div className="flex justify-end gap-1">
                  {write && <PromoEditor product={p} onSaved={reload} />}
                  {write && <Link to={`/admin/produits/${p.id}`} className="rounded p-1.5 text-choco-800 hover:bg-rose-100" title="Modifier"><Pencil className="h-4 w-4" /></Link>}
                  {write && <button onClick={() => del(p)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const EMPTY = { name: '', brand_id: '', category_id: '', description: '', format: '', price: '', old_price: '', stock: 0, image_url: '', is_featured: false, is_new: false, is_active: true };

export function ProductForm() {
  const { id } = useParams();
  const isNew = !id || id === 'nouveau';
  const navigate = useNavigate();
  const { notify } = useToast();
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/api/categories').then(setCats);
    api.get('/api/brands').then(setBrands);
    if (!isNew) api.get(`/api/admin/products/${id}`).then((p) => setForm({ ...EMPTY, ...p, brand_id: p.brand_id || '', category_id: p.category_id || '', old_price: p.old_price || '', image_url: p.image_url || '' })).catch((e) => notify(e.message, { type: 'error' }));
  }, [id, isNew, notify]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return notify('Image trop lourde (3 Mo max).', { type: 'error' });
    setUploading(true);
    try { const r = await api.upload(file); setForm((f) => ({ ...f, image_url: r.url })); } catch (x) { notify(x.message, { type: 'error' }); } finally { setUploading(false); e.target.value = ''; }
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Nom requis';
    if (form.price === '' || Number(form.price) < 0) er.price = 'Prix requis';
    if (form.old_price && Number(form.old_price) <= Number(form.price)) er.old_price = 'Doit être supérieur au prix de vente';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const payload = { ...form, brand_id: form.brand_id || null, category_id: form.category_id || null, old_price: form.old_price || null, image_url: form.image_url || null };
    ['id', 'slug', 'brand', 'brand_slug', 'category', 'category_slug', 'rating', 'review_count', 'discount', 'created_at', 'updated_at'].forEach((k) => delete payload[k]);
    try {
      if (isNew) await api.post('/api/admin/products', payload); else await api.put(`/api/admin/products/${id}`, payload);
      notify(isNew ? 'Produit ajouté' : 'Produit mis à jour');
      navigate('/admin/produits');
    } catch (x) { setErrors(x.fieldErrors); notify(x.message, { type: 'error' }); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate>
      <Title action={<Link to="/admin/produits" className="btn-ghost">← Retour</Link>}>{isNew ? 'Nouveau produit' : 'Modifier le produit'}</Title>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="card grid gap-4 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Nom du produit *</label><input className="input" value={form.name} onChange={set('name')} />{errors.name && <p className="field-error">{errors.name}</p>}</div>
          <div><label className="label">Marque</label><select className="input" value={form.brand_id} onChange={set('brand_id')}><option value="">—</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div><label className="label">Catégorie</label><select className="input" value={form.category_id} onChange={set('category_id')}><option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Format</label><input className="input" placeholder="400 ml" value={form.format} onChange={set('format')} /></div>
          <div><label className="label">Stock</label><input type="number" min="0" className="input" value={form.stock} onChange={set('stock')} /></div>
          <div><label className="label">Prix de vente (FCFA) *</label><input type="number" min="0" className="input" value={form.price} onChange={set('price')} />{errors.price && <p className="field-error">{errors.price}</p>}</div>
          <div><label className="label">Ancien prix (promotion)</label><input type="number" min="0" className="input" placeholder="Laisser vide si pas de promo" value={form.old_price} onChange={set('old_price')} />{errors.old_price && <p className="field-error">{errors.old_price}</p>}</div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea rows={5} className="input" value={form.description} onChange={set('description')} /></div>
          <div className="flex flex-wrap gap-5 sm:col-span-2">
            {[['is_active', 'En ligne'], ['is_featured', 'Produit populaire (accueil)'], ['is_new', 'Nouveauté']].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form[k]} onChange={set(k)} className="h-4 w-4 accent-choco-800" />{l}</label>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <p className="label">Image</p>
            <div className="flex aspect-square items-center justify-center rounded-xl bg-rose-50 p-4">
              {form.image_url ? <img src={form.image_url} alt="" className="max-h-full object-contain" /> : <span className="text-sm text-stone-400">Aucune image</span>}
            </div>
            <label className="btn-outline mt-3 w-full cursor-pointer">
              <Upload className="h-4 w-4" />{uploading ? 'Envoi…' : 'Choisir une image'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="sr-only" />
            </label>
            <p className="mt-2 text-xs text-stone-500">JPG, PNG ou WEBP — 3 Mo maximum.</p>
          </div>
          <button disabled={busy || uploading} className="btn-primary w-full !py-3"><Save className="h-4 w-4" />{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </div>
    </form>
  );
}

/* --------------------------- Catégories & marques --------------------------- */
export function CategoriesAdmin() {
  const cats = useLoad('/api/categories');
  const brands = useLoad('/api/brands');
  const { notify } = useToast();
  const [cat, setCat] = useState({ name: '', image_url: '', position: 0 });
  const [brand, setBrand] = useState({ name: '', description: '' });
  const [editing, setEditing] = useState(null);

  const run = async (fn, msg, after) => { try { await fn(); notify(msg); after?.(); } catch (e) { notify(e.message, { type: 'error' }); } };
  const uploadFor = async (e, setter) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const r = await api.upload(f); setter(r.url); } catch (x) { notify(x.message, { type: 'error' }); }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section>
        <Title>Catégories</Title>
        <div className="card divide-y divide-rose-100">
          {cats.data?.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <img src={c.image_url || '/favicon.svg'} alt="" className="h-12 w-16 rounded-lg object-cover" />
              {editing?.id === c.id ? (
                <div className="flex flex-1 flex-wrap gap-2">
                  <input className="input !w-40 !py-1.5" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  <input type="number" className="input !w-20 !py-1.5" value={editing.position} onChange={(e) => setEditing({ ...editing, position: e.target.value })} title="Ordre" />
                  <label className="btn-ghost cursor-pointer !px-2 !py-1.5 !text-xs"><Upload className="h-3.5 w-3.5" />Image<input type="file" accept="image/*" className="sr-only" onChange={(e) => uploadFor(e, (u) => setEditing((x) => ({ ...x, image_url: u })))} /></label>
                  <button className="btn-primary !px-3 !py-1.5 !shadow-none" onClick={() => run(() => api.put(`/api/admin/categories/${c.id}`, editing), 'Catégorie modifiée', () => { setEditing(null); cats.reload(); })}>OK</button>
                </div>
              ) : (
                <>
                  <span className="flex-1"><span className="font-semibold">{c.name}</span><span className="block text-xs text-stone-500">{c.product_count} produit(s) · ordre {c.position}</span></span>
                  <button onClick={() => setEditing({ id: c.id, name: c.name, image_url: c.image_url, position: c.position })} className="rounded p-1.5 hover:bg-rose-100"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => confirm(`Supprimer « ${c.name} » ? Les produits resteront sans catégorie.`) && run(() => api.del(`/api/admin/categories/${c.id}`), 'Catégorie supprimée', cats.reload)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </>
              )}
            </div>
          ))}
        </div>
        <form className="card mt-4 flex flex-wrap items-end gap-2 p-4" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/api/admin/categories', cat), 'Catégorie ajoutée', () => { setCat({ name: '', image_url: '', position: 0 }); cats.reload(); }); }}>
          <div className="flex-1"><label className="label">Nouvelle catégorie</label><input className="input" required minLength={2} value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} /></div>
          <label className="btn-outline cursor-pointer"><Upload className="h-4 w-4" />{cat.image_url ? 'Image ✓' : 'Image'}<input type="file" accept="image/*" className="sr-only" onChange={(e) => uploadFor(e, (u) => setCat((x) => ({ ...x, image_url: u })))} /></label>
          <button className="btn-primary"><Plus className="h-4 w-4" />Ajouter</button>
        </form>
      </section>
      <section>
        <Title>Marques</Title>
        <div className="card divide-y divide-rose-100">
          {brands.data?.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3">
              <span className="flex-1"><span className="font-semibold">{b.name}</span><span className="block text-xs text-stone-500">{b.product_count} produit(s)</span></span>
              <button onClick={() => confirm(`Supprimer la marque « ${b.name} » ?`) && run(() => api.del(`/api/admin/brands/${b.id}`), 'Marque supprimée', brands.reload)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <form className="card mt-4 grid gap-2 p-4" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/api/admin/brands', brand), 'Marque ajoutée', () => { setBrand({ name: '', description: '' }); brands.reload(); }); }}>
          <label className="label">Nouvelle marque</label>
          <input className="input" required placeholder="Nom" value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} />
          <input className="input" placeholder="Description courte" value={brand.description} onChange={(e) => setBrand({ ...brand, description: e.target.value })} />
          <button className="btn-primary w-fit"><Plus className="h-4 w-4" />Ajouter</button>
        </form>
      </section>
    </div>
  );
}

/* -------------------------------- Commandes -------------------------------- */
export function Orders() {
  const params = new URLSearchParams(window.location.search);
  const [status, setStatus] = useState(params.get('status') || '');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const { data, error, reload } = useLoad(`/api/admin/orders${qs({ status, q: search })}`);
  const [open, setOpen] = useState(null);
  const { notify } = useToast();
  const { can } = useAuth();

  const patch = async (o, body) => {
    try { await api.patch(`/api/admin/orders/${o.id}`, body); notify('Commande mise à jour'); reload(); } catch (e) { notify(e.message, { type: 'error' }); }
  };

  return (
    <>
      <Title>Commandes</Title>
      <div className="mb-4 flex flex-wrap gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q); }} className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Référence, nom, téléphone…" className="input !pl-9" />
        </form>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setStatus('')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!status ? 'bg-choco-800 text-white' : 'bg-white shadow-card'}`}>Toutes</button>
          {Object.entries(ORDER_STATUS).map(([k, s]) => (
            <button key={k} onClick={() => setStatus(k)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === k ? 'bg-choco-800 text-white' : 'bg-white shadow-card'}`}>{s.label}</button>
          ))}
        </div>
      </div>
      {error && <ErrorBox msg={error} />}
      {!data ? <Loading /> : data.length === 0 ? <p className="card p-8 text-center text-stone-500">Aucune commande.</p> : (
        <div className="space-y-3">
          {data.map((o) => {
            const isOpen = open === o.id;
            const waText = `Bonjour ${o.customer_name.split(' ')[0]}, ici Beauté d'Or. Nous avons bien reçu votre commande ${o.reference} (${fcfa(o.total)}).`;
            return (
              <article key={o.id} className="card overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : o.id)} className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 p-4 text-left hover:bg-rose-50/50">
                  <span className="min-w-[150px]"><span className="block font-bold text-choco-800">{o.reference}</span><span className="text-xs text-stone-500">{dateTime(o.created_at)}</span></span>
                  <span className="min-w-[140px] flex-1"><span className="block font-semibold">{o.customer_name}</span><span className="text-xs text-stone-500">{o.phone} · {o.zone_name}</span></span>
                  <span className="font-bold">{fcfa(o.total)}</span>
                  <span className={`badge ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span>
                  <span className={`badge ${PAYMENT_STATUS[o.payment_status].cls}`}>{PAYMENT_LABELS[o.payment_method]} · {PAYMENT_STATUS[o.payment_status].label}</span>
                  <ChevronDown className={`ml-auto h-5 w-5 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="grid gap-5 border-t border-rose-100 bg-rose-50/30 p-4 lg:grid-cols-[1.4fr_1fr]">
                    <div>
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs text-stone-500"><tr><th className="pb-1">Produit</th><th>Qté</th><th>P.U.</th><th className="text-right">Total</th></tr></thead>
                        <tbody className="divide-y divide-rose-100">
                          {o.items.map((it) => <tr key={it.id}><td className="py-1.5">{it.product_name} <span className="text-stone-500">{it.brand}</span></td><td>{it.quantity}</td><td>{fcfa(it.unit_price)}</td><td className="text-right">{fcfa(it.line_total)}</td></tr>)}
                        </tbody>
                      </table>
                      <div className="mt-2 space-y-0.5 text-right text-sm">
                        <p>Sous-total : {fcfa(o.subtotal)}</p><p>Livraison ({o.zone_name}) : {fcfa(o.delivery_fee)}</p><p className="font-bold text-choco-800">Total : {fcfa(o.total)}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <p><strong>Adresse :</strong> {o.address}, {o.district_city}</p>
                      {o.notes && <p><strong>Remarque :</strong> {o.notes}</p>}
                      {can('orders.update') && (
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-xs font-semibold">Statut
                            <select className="input mt-1 !py-1.5" value={o.status} onChange={(e) => patch(o, { status: e.target.value })}>
                              {Object.entries(ORDER_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                            </select></label>
                          <label className="text-xs font-semibold">Paiement
                            <select className="input mt-1 !py-1.5" value={o.payment_status} onChange={(e) => patch(o, { payment_status: e.target.value })}>
                              {Object.entries(PAYMENT_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                            </select></label>
                        </div>
                      )}
                      <p className="text-xs text-stone-500">L’annulation d’une commande remet automatiquement les produits en stock.</p>
                      <a href={waLink(o.phone.replace(/\D/g, '').replace(/^(?!221)/, '221'), waText)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp !py-2 !text-xs">
                        <WhatsAppIcon className="h-4 w-4" />Contacter la cliente
                      </a>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

/* --------------------------------- Clients --------------------------------- */
export function Customers() {
  const { data, error, reload } = useLoad('/api/admin/customers');
  const { can, user } = useAuth();
  const { notify } = useToast();
  const [q, setQ] = useState('');
  const setRole = async (c, role) => {
    try { await api.patch(`/api/admin/customers/${c.id}/role`, { role }); notify('Rôle modifié'); reload(); } catch (e) { notify(e.message, { type: 'error' }); }
  };
  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Loading />;
  const list = data.filter((c) => `${c.full_name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Title>Clients & utilisateurs ({data.length})</Title>
      <div className="relative mb-4 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, email, téléphone…" className="input !pl-9" /></div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-rose-50 text-left text-xs uppercase text-stone-500"><tr><th className="p-3">Nom</th><th className="p-3">Contact</th><th className="p-3">Adresse</th><th className="p-3">Commandes</th><th className="p-3">Rôle</th></tr></thead>
          <tbody className="divide-y divide-rose-100">
            {list.map((c) => (
              <tr key={c.id}>
                <td className="p-3"><p className="font-semibold">{c.full_name}</p><p className="text-xs text-stone-500">Inscrit le {new Date(c.created_at).toLocaleDateString('fr-SN')}</p></td>
                <td className="p-3">{c.email}<br /><span className="text-stone-500">{c.phone}</span></td>
                <td className="p-3 text-stone-600">{[c.address, c.city].filter(Boolean).join(', ') || '—'}</td>
                <td className="p-3">{c.order_count} · {fcfa(c.total_spent)}</td>
                <td className="p-3">
                  {can('customers.update') && c.id !== user.id ? (
                    <select value={c.role} onChange={(e) => setRole(c, e.target.value)} className="input !w-auto !py-1">
                      <option value="customer">Client</option><option value="staff">Personnel</option><option value="admin">Administrateur</option>
                    </select>
                  ) : <span className="badge bg-rose-100 text-choco-800">{{ customer: 'Client', staff: 'Personnel', admin: 'Administrateur' }[c.role]}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-stone-500"><strong>Personnel</strong> : gère les commandes et consulte les clients. <strong>Administrateur</strong> : accès complet (produits, catégories, paramètres, rôles).</p>
    </>
  );
}

/* --------------------------- Livraison & paramètres -------------------------- */
export function SettingsAdmin() {
  const zones = useLoad('/api/admin/delivery-zones');
  const settings = useLoad('/api/admin/settings');
  const { notify } = useToast();
  const [s, setS] = useState(null);
  const [newZone, setNewZone] = useState({ name: '', fee: '', delay: '' });
  useEffect(() => { if (settings.data) setS(settings.data); }, [settings.data]);

  const run = async (fn, msg, after) => { try { await fn(); notify(msg); after?.(); } catch (e) { notify(e.message, { type: 'error' }); } };
  const updateZone = (z, patch) => run(() => api.put(`/api/admin/delivery-zones/${z.id}`, { ...z, ...patch }), 'Zone mise à jour', zones.reload);

  return (
    <div className="space-y-8">
      <section>
        <Title>Frais de livraison</Title>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-rose-50 text-left text-xs uppercase text-stone-500"><tr><th className="p-3">Zone</th><th className="p-3">Frais (FCFA)</th><th className="p-3">Délai</th><th className="p-3">Active</th><th /></tr></thead>
            <tbody className="divide-y divide-rose-100">
              {zones.data?.map((z) => (
                <tr key={z.id}>
                  <td className="p-3"><input className="input !py-1.5" defaultValue={z.name} onBlur={(e) => e.target.value !== z.name && updateZone(z, { name: e.target.value })} /></td>
                  <td className="p-3"><input type="number" min="0" className="input !w-32 !py-1.5" defaultValue={z.fee} onBlur={(e) => Number(e.target.value) !== z.fee && updateZone(z, { fee: Number(e.target.value) })} /></td>
                  <td className="p-3"><input className="input !py-1.5" defaultValue={z.delay || ''} onBlur={(e) => e.target.value !== (z.delay || '') && updateZone(z, { delay: e.target.value })} /></td>
                  <td className="p-3"><input type="checkbox" checked={z.is_active} onChange={(e) => updateZone(z, { is_active: e.target.checked })} className="h-4 w-4 accent-choco-800" /></td>
                  <td className="p-3 text-right"><button onClick={() => confirm(`Supprimer la zone « ${z.name} » ?`) && run(() => api.del(`/api/admin/delivery-zones/${z.id}`), 'Zone supprimée', zones.reload)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <form className="flex flex-wrap items-end gap-2 border-t border-rose-100 p-4" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/api/admin/delivery-zones', { ...newZone, fee: Number(newZone.fee || 0), position: (zones.data?.length || 0) + 1 }), 'Zone ajoutée', () => { setNewZone({ name: '', fee: '', delay: '' }); zones.reload(); }); }}>
            <input className="input !w-48" required placeholder="Nouvelle zone (ex : Thiès)" value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} />
            <input type="number" min="0" className="input !w-32" required placeholder="Frais" value={newZone.fee} onChange={(e) => setNewZone({ ...newZone, fee: e.target.value })} />
            <input className="input !w-40" placeholder="Délai" value={newZone.delay} onChange={(e) => setNewZone({ ...newZone, delay: e.target.value })} />
            <button className="btn-primary"><Plus className="h-4 w-4" />Ajouter</button>
          </form>
        </div>
        <p className="mt-2 text-xs text-stone-500">Les modifications sont enregistrées en quittant le champ.</p>
      </section>

      {s && (
        <form onSubmit={(e) => { e.preventDefault(); run(() => api.put('/api/admin/settings', s), 'Paramètres enregistrés'); }} className="card grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-serif text-2xl font-bold text-choco-800 sm:col-span-2">Coordonnées & WhatsApp</h2>
          {[['whatsapp_number', 'Numéro WhatsApp de commande (format 221XXXXXXXXX)'], ['shop_phone', 'Téléphone affiché'], ['shop_email', 'Email'], ['shop_address', 'Adresse'], ['wave_number', 'Numéro Wave marchand'], ['orange_money_number', 'Numéro Orange Money']].map(([k, l]) => (
            <div key={k}><label className="label">{l}</label><input className="input" value={s[k] || ''} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></div>
          ))}
          <button className="btn-primary w-fit"><Save className="h-4 w-4" />Enregistrer</button>
        </form>
      )}
    </div>
  );
}

/* -------------------------------- Messages -------------------------------- */
export function Messages() {
  const { data, error, reload } = useLoad('/api/admin/messages');
  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Loading />;
  return (
    <>
      <Title>Messages de contact</Title>
      {data.length === 0 ? <p className="card p-8 text-center text-stone-500">Aucun message.</p> : (
        <div className="space-y-3">
          {data.map((m) => (
            <article key={m.id} className={`card p-4 ${m.is_read ? 'opacity-70' : 'ring-2 ring-gold-300'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{m.name} <span className="text-sm font-normal text-stone-500">{[m.email, m.phone].filter(Boolean).join(' · ')}</span></p>
                <span className="text-xs text-stone-500">{dateTime(m.created_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
              {!m.is_read && <button onClick={() => api.patch(`/api/admin/messages/${m.id}/read`, {}).then(reload)} className="btn-ghost mt-2 !px-2 !py-1 !text-xs">Marquer comme lu</button>}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

