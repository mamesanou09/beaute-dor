import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Truck, ShieldCheck, Phone, Mail, Search, User, ShoppingCart, ChevronDown, Menu, X, LayoutDashboard } from 'lucide-react';
import { Logo } from './Icons';
import { useAuth, useCart, useShop } from '../context/AppContext';
import { api, qs } from '../lib/api';
import { fcfa, imgUrl } from '../lib/format';

function TopBar() {
  const { settings } = useShop();
  const items = [
    { icon: MapPin, text: settings.shop_address },
    { icon: Truck, text: 'Livraison partout au Sénégal' },
    { icon: ShieldCheck, text: 'Produits 100% authentiques' },
    { icon: Phone, text: settings.shop_phone, href: `tel:${settings.shop_phone.replace(/\s/g, '')}` },
    { icon: Mail, text: settings.shop_email, href: `mailto:${settings.shop_email}` },
  ];
  return (
    <div className="bg-choco-800 text-[12.5px] text-white">
      <div className="container-bdo flex h-8 items-center justify-center gap-6 overflow-x-auto scrollbar-none md:justify-between">
        {items.map(({ icon: Icon, text, href }, i) => {
          const content = (<><Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />{text}</>);
          const hideMobile = i === 0 || i === 2 || i === 4 ? 'hidden md:flex' : 'flex';
          return href
            ? <a key={i} href={href} className={`${hideMobile} shrink-0 items-center gap-2 hover:text-gold-300`}>{content}</a>
            : <span key={i} className={`${hideMobile} shrink-0 items-center gap-2`}>{content}</span>;
        })}
      </div>
    </div>
  );
}

function SearchBox({ onDone, className = '' }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const box = useRef(null);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      api.get(`/api/products${qs({ q: q.trim(), limit: 5 })}`).then((r) => setResults(r.items)).catch(() => setResults([]));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    navigate(`/boutique${qs({ q: q.trim() })}`);
    setOpen(false);
    onDone?.();
  };

  return (
    <div ref={box} className={`relative ${className}`}>
      <form onSubmit={submit} role="search">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-choco-800" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un produit..."
          aria-label="Rechercher un produit ou une marque"
          className="h-10 w-full rounded-full border border-rose-200 bg-rose-50 pl-11 pr-4 text-[13px] outline-none transition focus:border-gold-400 focus:bg-white"
        />
      </form>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-rose-100 bg-white shadow-card-hover animate-slide-in">
          {results.map((p) => (
            <Link key={p.id} to={`/produit/${p.slug}`} onClick={() => { setOpen(false); setQ(''); onDone?.(); }}
              className="flex items-center gap-3 px-3 py-2 hover:bg-rose-50">
              <img src={imgUrl(p.image_url)} alt="" className="h-10 w-10 rounded object-contain" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold uppercase text-gold-600">{p.brand}</span>
                <span className="block truncate text-sm">{p.name}</span>
              </span>
              <span className="text-sm font-bold text-choco-800">{fcfa(p.price)}</span>
            </Link>
          ))}
          <button onClick={submit} className="w-full border-t border-rose-100 px-3 py-2 text-left text-sm font-semibold text-choco-800 hover:bg-rose-50">
            Voir tous les résultats pour « {q} »
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { categories } = useShop();
  const { count } = useCart();
  const { user, isStaff } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); setCatOpen(false); }, [location.pathname, location.search]);
  useEffect(() => { document.body.style.overflow = mobileOpen ? 'hidden' : ''; }, [mobileOpen]);

  const linkCls = ({ isActive }) =>
    `relative whitespace-nowrap py-2 text-[14.5px] font-medium transition hover:text-gold-600 ${isActive ? 'text-choco-800 after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-[2px] after:bg-choco-800' : 'text-ink'}`;

  return (
    <header className="sticky top-0 z-40 shadow-[0_1px_0_rgba(91,42,20,0.08)]">
      <TopBar />
      <div className="bg-white">
        <div className="container-bdo flex h-[72px] items-center gap-4 lg:gap-8">
          <button className="-ml-2 rounded-lg p-2 text-choco-800 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu">
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/" aria-label="Beauté d'Or — accueil" className="shrink-0">
            <Logo />
          </Link>

          <nav className="ml-auto hidden shrink-0 items-center gap-6 lg:flex xl:gap-8 2xl:gap-9" aria-label="Navigation principale">
            <NavLink to="/" end className={linkCls}>Accueil</NavLink>
            <NavLink to="/boutique" className={linkCls}>Boutique</NavLink>
            <div className="relative" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
              <NavLink to="/categories" className={(s) => `${linkCls(s)} inline-flex items-center gap-2`} aria-haspopup="true" aria-expanded={catOpen}>
                Catégories <ChevronDown className={`h-4 w-4 transition ${catOpen ? 'rotate-180' : ''}`} />
              </NavLink>
              {catOpen && (
                <div className="absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 pt-3">
                  <div className="overflow-hidden rounded-xl border border-rose-100 bg-white py-2 shadow-card-hover animate-slide-in">
                    {categories.map((c) => (
                      <Link key={c.id} to={`/boutique?category=${c.slug}`} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-rose-50">
                        <img src={c.image_url} alt="" className="h-8 w-8 rounded-md object-cover" />
                        <span className="flex-1">{c.name}</span>
                        <span className="text-xs text-stone-400">{c.product_count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <NavLink to="/marques" className={linkCls}>Nos marques</NavLink>
            <NavLink to="/a-propos" className={linkCls}>À propos</NavLink>
            <NavLink to="/contact" className={linkCls}>Contact</NavLink>
          </nav>

          <SearchBox className="ml-6 hidden min-w-[150px] max-w-[242px] flex-1 xl:block" />

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3 xl:ml-4">
            {isStaff && (
              <Link to="/admin" className="hidden rounded-lg p-2 text-choco-800 hover:bg-rose-50 xl:block" title="Administration">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            )}
            <Link to={user ? '/compte' : '/connexion'} className="flex items-center gap-2 whitespace-nowrap rounded-lg p-2 text-[14.5px] font-medium hover:text-gold-600">
              <User className="h-6 w-6 text-choco-800" strokeWidth={1.8} />
              <span className="hidden xl:inline">{user ? user.full_name.split(' ')[0] : 'Mon compte'}</span>
            </Link>
            <Link to="/panier" className="relative rounded-lg p-2 text-choco-800" aria-label={`Panier, ${count} article(s)`}>
              <ShoppingCart className="h-7 w-7" strokeWidth={1.8} />
              <span className="absolute -right-0.5 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-choco-800 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                {count}
              </span>
            </Link>
          </div>
        </div>
        <div className="container-bdo pb-3 xl:hidden">
          <SearchBox />
        </div>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-choco-950/50 animate-fade" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-white shadow-xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-rose-100 p-4">
              <Logo compact />
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2" aria-label="Fermer le menu"><X className="h-6 w-6" /></button>
            </div>
            <nav className="flex flex-col p-2 text-[15px] font-medium">
              {[['/', 'Accueil'], ['/boutique', 'Boutique'], ['/categories', 'Catégories'], ['/marques', 'Nos marques'],
                ['/a-propos', 'À propos'], ['/contact', 'Contact'], ['/panier', `Panier (${count})`],
                [user ? '/compte' : '/connexion', user ? 'Mon compte' : 'Connexion / Inscription']].map(([to, label]) => (
                <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `rounded-lg px-4 py-3 ${isActive ? 'bg-rose-100 text-choco-800' : 'hover:bg-rose-50'}`}>
                  {label}
                </NavLink>
              ))}
              {isStaff && <NavLink to="/admin" className="rounded-lg px-4 py-3 text-gold-600 hover:bg-rose-50">Administration</NavLink>}
            </nav>
            <div className="mt-2 border-t border-rose-100 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Catégories</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <Link key={c.id} to={`/boutique?category=${c.slug}`} className="rounded-lg bg-rose-50 px-3 py-2 text-sm">{c.name}</Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
