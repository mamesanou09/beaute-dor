import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ShoppingBag, Users, Settings, Mail, Store, LogOut, Menu, X } from 'lucide-react';
import { Logo } from '../../components/Icons';
import { useAuth } from '../../context/AppContext';

export function RequireStaff({ children }) {
  const { user, ready, isStaff } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  if (!isStaff) return <Navigate to="/" replace />;
  return children;
}

export default function AdminLayout() {
  const { user, can, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [
    ['/admin', 'Tableau de bord', LayoutDashboard, 'orders.read', true],
    ['/admin/commandes', 'Commandes', ShoppingBag, 'orders.read'],
    ['/admin/produits', 'Produits', Package, 'products.read'],
    ['/admin/categories', 'Catégories & marques', Tags, 'categories.write'],
    ['/admin/clients', 'Clients', Users, 'customers.read'],
    ['/admin/messages', 'Messages', Mail, 'messages.read'],
    ['/admin/parametres', 'Livraison & paramètres', Settings, 'settings.write'],
  ].filter(([, , , perm]) => can(perm));

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {links.map(([to, label, Icon, , end]) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-gold-500 text-white' : 'text-white/80 hover:bg-white/10'}`}>
          <Icon className="h-4 w-4" />{label}
        </NavLink>
      ))}
      <div className="my-3 border-t border-white/10" />
      <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"><Store className="h-4 w-4" />Voir la boutique</Link>
      <button onClick={logout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10"><LogOut className="h-4 w-4" />Déconnexion</button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#faf6f3] lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden bg-choco-900 lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
        <div className="border-b border-white/10 p-5 text-center"><Logo light compact /></div>
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-choco-900 animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/10 p-4"><Logo light compact /><button onClick={() => setOpen(false)} className="text-white" aria-label="Fermer"><X /></button></div>
            {nav}
          </aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-rose-100 bg-white px-4 sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu className="h-6 w-6 text-choco-800" /></button>
          <h1 className="font-serif text-lg font-bold text-choco-800">Administration</h1>
          <span className="ml-auto text-right text-sm">
            <span className="block font-semibold">{user.full_name}</span>
            <span className="block text-xs capitalize text-stone-500">{user.role === 'admin' ? 'Administrateur' : 'Personnel'}</span>
          </span>
        </header>
        <main className="p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
