import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Gem, BadgeCheck, Truck, LockKeyhole, Headphones, X, MapPin, Phone, Mail, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import Header from './Header';
import { Logo, WhatsAppIcon, FacebookIcon, InstagramIcon, TiktokIcon } from './Icons';
import { useShop, useToast } from '../context/AppContext';
import { waLink } from '../lib/format';

export function FeatureStrip() {
  const items = [
    [Gem, 'Produits soigneusement', 'sélectionnés'],
    [BadgeCheck, 'Qualité et', 'authenticité'],
    [Truck, 'Livraison', 'partout au Sénégal'],
    [LockKeyhole, 'Paiement', '100% sécurisé'],
    [Headphones, 'Service client', 'disponible et réactif'],
  ];
  return (
    <div className="container-bdo grid grid-cols-2 gap-x-4 gap-y-5 py-7 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(([Icon, a, b]) => (
        <div key={a} className="flex items-center justify-center gap-3 text-[13px] leading-tight text-ink lg:justify-center">
          <Icon className="h-8 w-8 shrink-0 text-choco-800" strokeWidth={1.4} />
          <span>{a}<br />{b}</span>
        </div>
      ))}
    </div>
  );
}

function Footer() {
  const { categories, settings } = useShop();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-choco-900 text-white/85">
      <div className="container-bdo grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Boutique de cosmétiques et soins de beauté basée à Rufisque. Nous sélectionnons des produits 100 % authentiques
            pour sublimer votre peau, vos cheveux et votre bien-être, livrés partout au Sénégal.
          </p>
          <div className="mt-5 flex gap-2.5">
            {[[FacebookIcon, 'Facebook', 'https://facebook.com'], [InstagramIcon, 'Instagram', 'https://instagram.com'], [TiktokIcon, 'TikTok', 'https://tiktok.com']].map(([Icon, label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-gold-500">
                <Icon />
              </a>
            ))}
            <a href={waLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-[#25D366]">
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <h3 className="mb-4 font-serif text-lg text-gold-300">Liens rapides</h3>
          <ul className="space-y-2 text-sm">
            {[['/', 'Accueil'], ['/boutique', 'Boutique'], ['/marques', 'Nos marques'], ['/a-propos', 'À propos'], ['/contact', 'Contact'], ['/compte', 'Mon compte']].map(([to, l]) => (
              <li key={to}><Link to={to} className="hover:text-gold-300">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-serif text-lg text-gold-300">Catégories</h3>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => <li key={c.id}><Link to={`/boutique?category=${c.slug}`} className="hover:text-gold-300">{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-serif text-lg text-gold-300">Coordonnées</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-gold-400" />{settings.shop_address}</li>
            <li className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-gold-400" /><a href={`tel:${settings.shop_phone.replace(/\s/g, '')}`} className="hover:text-gold-300">{settings.shop_phone}</a></li>
            <li className="flex gap-3"><WhatsAppIcon className="h-4 w-4 shrink-0 text-gold-400" />
              <a href={waLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="hover:text-gold-300">
                +{settings.whatsapp_number.replace(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5')}
              </a></li>
            <li className="flex gap-3"><Mail className="h-4 w-4 shrink-0 text-gold-400" /><a href={`mailto:${settings.shop_email}`} className="hover:text-gold-300">{settings.shop_email}</a></li>
            <li className="pt-1 text-white/60">Lun – Sam : 9h – 20h</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-bdo flex flex-col items-center justify-between gap-2 py-4 text-xs text-white/60 sm:flex-row">
          <span>© {year} Beauté d’Or – Rufisque, Sénégal. Tous droits réservés.</span>
          <span className="flex gap-4">
            <Link to="/cgv" className="hover:text-gold-300">Conditions générales de vente</Link>
            <Link to="/confidentialite" className="hover:text-gold-300">Politique de confidentialité</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  const { settings } = useShop();
  return (
    <a
      href={waLink(settings.whatsapp_number, "Bonjour Beauté d'Or ! J'ai une question sur vos produits.")}
      target="_blank" rel="noopener noreferrer"
      aria-label="Discuter avec Beauté d'Or sur WhatsApp"
      className="group fixed bottom-5 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-choco-800 text-white shadow-[0_8px_24px_rgba(91,42,20,0.35)] transition hover:scale-105 hover:bg-[#25D366] sm:bottom-7 sm:right-6 sm:h-[60px] sm:w-[60px]"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#25D366]" />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-choco-800 shadow-card group-hover:block">
        Besoin d’aide ? Écrivez-nous
      </span>
    </a>
  );
}

function Toasts() {
  const { toasts, dismiss } = useToast();
  const icons = { success: CheckCircle2, info: Info, error: AlertCircle };
  return (
    <div className="pointer-events-none fixed bottom-24 left-3 right-20 z-50 flex flex-col gap-2 sm:bottom-5 sm:left-4 sm:right-auto sm:w-80" aria-live="polite">
      {toasts.map((t) => {
        const Icon = icons[t.type] || Info;
        return (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 rounded-lg bg-white p-3 pr-8 text-[13px] shadow-card-hover ring-1 ring-rose-100 animate-slide-in">
            {t.image ? <img src={t.image} alt="" className="h-11 w-9 shrink-0 object-contain" />
              : <Icon className={`h-5 w-5 shrink-0 ${t.type === 'error' ? 'text-red-600' : 'text-gold-600'}`} />}
            <span className="leading-snug">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="absolute right-2 top-2 text-stone-400 hover:text-stone-700" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <WhatsAppFloat />
      <Toasts />
    </div>
  );
}

export function PageHeader({ title, subtitle, crumbs = [] }) {
  return (
    <section className="bg-gradient-to-r from-rose-100 via-rose-50 to-beige">
      <div className="container-bdo py-8 sm:py-10">
        <nav className="mb-2 text-xs text-stone-500" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:text-choco-800">Accueil</Link>
          {crumbs.map(([to, label]) => (
            <span key={label}> / {to ? <Link to={to} className="hover:text-choco-800">{label}</Link> : <span className="text-choco-800">{label}</span>}</span>
          ))}
        </nav>
        <h1 className="font-serif text-3xl font-bold text-choco-800 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-stone-600 sm:text-base">{subtitle}</p>}
      </div>
    </section>
  );
}
