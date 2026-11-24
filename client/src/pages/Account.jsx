import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { User, Package, Heart, LogOut, LayoutDashboard } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { WhatsAppIcon } from '../components/Icons';
import { useAuth, useFavorites, useToast } from '../context/AppContext';
import { api, qs } from '../lib/api';
import { dateTime, fcfa, ORDER_STATUS, PAYMENT_LABELS } from '../lib/format';

export function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="container-bdo py-20"><div className="h-40 animate-pulse rounded-xl bg-rose-100" /></div>;
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  return children;
}

export function AccountLayout() {
  const { user, logout, isStaff } = useAuth();
  const link = ({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-rose-100 text-choco-800' : 'hover:bg-rose-50'}`;
  return (
    <>
      <PageHeader title="Mon compte" subtitle={`Bonjour ${user.full_name} 👋`} crumbs={[[null, 'Mon compte']]} />
      <div className="container-bdo grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="card h-fit p-3">
          <nav className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
            <NavLink to="/compte" end className={link}><User className="h-4 w-4" />Informations</NavLink>
            <NavLink to="/compte/commandes" className={link}><Package className="h-4 w-4" />Mes commandes</NavLink>
            <NavLink to="/compte/favoris" className={link}><Heart className="h-4 w-4" />Favoris</NavLink>
            {isStaff && <NavLink to="/admin" className={link}><LayoutDashboard className="h-4 w-4" />Administration</NavLink>}
            <button onClick={logout} className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" />Déconnexion
            </button>
          </nav>
        </aside>
        <div><Outlet /></div>
      </div>
    </>
  );
}

export function Profile() {
  const { user, updateProfile } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ full_name: user.full_name, phone: user.phone || '', address: user.address || '', city: user.city || '' });
  const [pwd, setPwd] = useState({ current_password: '', new_password: '' });
  const [err, setErr] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try { await updateProfile(form); notify('Informations mises à jour'); } catch (x) { setErr(x.message); }
  };
  const changePwd = async (e) => {
    e.preventDefault(); setPwdErr('');
    try { await api.put('/api/auth/me/password', pwd); setPwd({ current_password: '', new_password: '' }); notify('Mot de passe modifié'); } catch (x) { setPwdErr(x.message); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="card p-5 sm:p-6">
        <h2 className="font-serif text-xl font-bold text-choco-800">Informations personnelles</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="fn">Nom complet</label><input id="fn" className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input bg-stone-50" value={user.email} disabled /></div>
          <div><label className="label" htmlFor="ph">Téléphone</label><input id="ph" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label" htmlFor="ct">Quartier / Ville</label><input id="ct" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="ad">Adresse de livraison par défaut</label><input id="ad" className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        {err && <p className="field-error mt-3">{err}</p>}
        <button className="btn-primary mt-5">Enregistrer</button>
      </form>
      <form onSubmit={changePwd} className="card p-5 sm:p-6">
        <h2 className="font-serif text-xl font-bold text-choco-800">Mot de passe</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="cp">Mot de passe actuel</label><input id="cp" type="password" autoComplete="current-password" className="input" value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} /></div>
          <div><label className="label" htmlFor="np">Nouveau mot de passe</label><input id="np" type="password" autoComplete="new-password" className="input" value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} /></div>
        </div>
        {pwdErr && <p className="field-error mt-3">{pwdErr}</p>}
        <button className="btn-outline mt-5">Modifier le mot de passe</button>
      </form>
    </div>
  );
}

export function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/api/orders/mine').then(setOrders).catch((e) => setError(e.message)); }, []);

  if (error) return <p className="card p-5 text-red-700">{error}</p>;
  if (!orders) return <div className="h-40 animate-pulse rounded-xl bg-rose-100" />;
  if (!orders.length) return (
    <div className="card p-10 text-center">
      <Package className="mx-auto h-12 w-12 text-rose-300" />
      <p className="mt-3 font-serif text-xl text-choco-800">Aucune commande pour le moment</p>
      <Link to="/boutique" className="btn-primary mt-5">Découvrir la boutique</Link>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold text-choco-800">Historique des commandes</h2>
      {orders.map((o) => {
        const st = ORDER_STATUS[o.status];
        return (
          <article key={o.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-choco-800">{o.reference}</p>
                <p className="text-xs text-stone-500">{dateTime(o.created_at)} · {PAYMENT_LABELS[o.payment_method]} · {o.zone_name}</p>
              </div>
              <span className={`badge ${st.cls}`}>{st.label}</span>
            </div>
            <ul className="mt-3 divide-y divide-rose-100 text-sm">
              {o.items.map((it) => (
                <li key={it.id} className="flex justify-between py-1.5">
                  <span>{it.quantity} × {it.product_name} <span className="text-stone-500">{it.brand}</span></span>
                  <span>{fcfa(it.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-rose-100 pt-3">
              <span className="text-sm">Livraison {fcfa(o.delivery_fee)} · <strong className="text-choco-800">Total {fcfa(o.total)}</strong></span>
              {o.status === 'en_attente' && (
                <Link to={`/commande/confirmation/${o.reference}`} className="btn-whatsapp !px-3 !py-1.5 !text-xs"><WhatsAppIcon className="h-4 w-4" />Renvoyer sur WhatsApp</Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function Favorites() {
  const { ids } = useFavorites();
  const [items, setItems] = useState(null);
  useEffect(() => {
    if (!ids.length) { setItems([]); return; }
    api.get(`/api/products${qs({ ids: ids.join(','), limit: 60 })}`).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, [ids]);
  if (!items) return <div className="h-40 animate-pulse rounded-xl bg-rose-100" />;
  return (
    <div>
      <h2 className="mb-4 font-serif text-xl font-bold text-choco-800">Mes favoris</h2>
      {items.length === 0 ? <p className="card p-6 text-stone-600">Aucun favori. Cliquez sur ♡ sur un produit pour l’ajouter.</p> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </div>
  );
}
