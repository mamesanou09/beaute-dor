import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Truck, ShieldCheck, LockKeyhole } from 'lucide-react';
import ProductCard, { ProductSkeleton } from '../components/ProductCard';
import { FeatureStrip } from '../components/Layout';
import { useShop } from '../context/AppContext';
import { api } from '../lib/api';

const SLIDES = [
  {
    eyebrow: 'COSMÉTIQUES & SOINS DE BEAUTÉ',
    title: ['Révélez votre', 'beauté naturelle'],
    text: ['Des soins de qualité pour sublimer votre peau,', 'vos cheveux et votre bien-être au quotidien.'],
    image: '/images/hero-1.jpg',
    alt: 'Femme africaine élégante entourée de soins Garnier, NIVEA et Dove',
    primary: ['Découvrir la boutique', '/boutique'],
    secondary: ['Nos nouveautés', '/boutique?new=1'],
  },
  {
    eyebrow: 'NOUVEAUTÉS',
    title: ['Les essentiels', 'de la saison'],
    text: ['CeraVe, Elseve, NIVEA… les soins visage et cheveux', 'qui viennent d’arriver en boutique.'],
    image: '/images/offre-produits.jpg',
    alt: 'Nouveaux soins CeraVe, Elseve, NIVEA et Garnier',
    primary: ['Voir les nouveautés', '/boutique?new=1'],
    secondary: ['Toutes les promos', '/boutique?promo=1'],
  },
  {
    eyebrow: 'PARFUMS',
    title: ['Un sillage qui', 'vous ressemble'],
    text: ['Eaux de parfum gourmandes et florales', 'pour chaque moment de votre journée.'],
    image: '/images/cat-parfums.jpg',
    alt: 'Flacon d’eau de parfum sur fond rose poudré',
    primary: ['Découvrir les parfums', '/boutique?category=parfums'],
    secondary: ['Nos marques', '/marques'],
  },
];

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((d) => setI((x) => (x + d + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => go(1), 6500);
    return () => clearInterval(t);
  }, [paused, go]);

  const s = SLIDES[i];
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-r from-[#f8e3db] via-[#f7e2d8] to-[#f3d3c6]"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrousel" aria-label="Mises en avant"
    >
      <div className="relative sm:min-h-[340px] lg:h-[300px] lg:min-h-0 xl:h-[312px]">
        {/* Image */}
        <div key={`img-${i}`} className="absolute inset-x-0 bottom-0 h-[240px] animate-fade sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-[58%] lg:w-[57%]">
          <img src={s.image} alt={s.alt} className="h-full w-full object-cover object-left sm:object-center"
            style={{ maskImage: 'linear-gradient(to right, transparent 0, #000 14%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 14%)' }} />
        </div>

        {/* Texte */}
        <div className="container-bdo relative z-10 flex h-full flex-col justify-center pb-[262px] pt-6 sm:pb-8 sm:pt-6 lg:pb-0">
          <div key={`txt-${i}`} className="max-w-[540px] animate-slide-in sm:max-w-[46%] lg:max-w-[560px]">
            <p className="text-[12px] font-semibold tracking-[0.18em] text-choco-800 sm:text-[13px]">{s.eyebrow}</p>
            <h1 className="mt-1.5 font-serif text-[34px] font-bold leading-[1.02] text-choco-800 sm:text-[42px] lg:text-[50px]">
              {s.title[0]}<br />{s.title[1]}
            </h1>
            <p className="mt-3 text-[14px] leading-snug text-ink sm:text-[15px]">
              {s.text[0]}<br className="hidden sm:block" /> {s.text[1]}
            </p>
            <div className="mt-4 flex gap-2.5 sm:gap-5">
              <Link to={s.primary[1]} className="btn-primary !rounded-lg !px-3.5 !py-2.5 !text-[13px] sm:!px-6 sm:!text-[14px]">
                {s.primary[0]} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={s.secondary[1]} className="btn-outline !rounded-lg !px-3.5 !py-2 !text-[13px] sm:!px-6 sm:!text-[14px]">{s.secondary[0]}</Link>
            </div>
            <ul className="mt-5 hidden flex-wrap gap-x-8 gap-y-2 text-[11.5px] text-ink sm:flex">
              <li className="flex items-center gap-2"><Truck className="h-5 w-5 text-choco-800" strokeWidth={1.5} />Livraison partout au Sénégal</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-choco-800" strokeWidth={1.5} />Produits authentiques</li>
              <li className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-choco-800" strokeWidth={1.5} />Paiement sécurisé</li>
            </ul>
          </div>
        </div>

        {/* Navigation */}
        <button onClick={() => go(-1)} aria-label="Diapositive précédente"
          className="absolute bottom-[100px] left-3 z-20 sm:bottom-auto sm:top-1/2 grid h-9 w-9 place-items-center rounded-full bg-white text-choco-800 shadow-card transition hover:bg-rose-50 sm:-translate-y-1/2 sm:left-9 sm:h-10 sm:w-10">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => go(1)} aria-label="Diapositive suivante"
          className="absolute bottom-[100px] right-3 z-20 sm:bottom-auto sm:top-1/2 grid h-9 w-9 place-items-center rounded-full bg-white text-choco-800 shadow-card transition hover:bg-rose-50 sm:-translate-y-1/2 sm:right-9 sm:h-10 sm:w-10">
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {SLIDES.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Diapositive ${k + 1}`} aria-current={k === i}
              className={`h-2.5 rounded-full transition-all ${k === i ? 'w-6 bg-white' : 'w-2.5 bg-white/60 hover:bg-white'}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const { categories } = useShop();
  return (
    <section className="container-bdo pt-5">
      <h2 className="section-title">Nos Catégories Populaires</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {(categories.length ? categories : Array.from({ length: 6 })).map((c, k) => c ? (
          <Link key={c.id} to={`/boutique?category=${c.slug}`}
            className="group overflow-hidden rounded-xl bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
            <div className="aspect-[2.4/1] overflow-hidden bg-rose-100">
              <img src={c.image_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="bg-[#fbeee8] py-2.5 text-center text-[14px] font-bold text-ink sm:text-[15px]">{c.name}</div>
          </Link>
        ) : <div key={k} className="aspect-[1.9/1] animate-pulse rounded-xl bg-rose-100" />)}
      </div>
    </section>
  );
}

function PopularProducts() {
  const [items, setItems] = useState(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const track = useRef(null);

  useEffect(() => {
    api.get('/api/products?featured=1&limit=12&sort=popular').then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const p = Math.max(1, Math.round(el.scrollWidth / el.clientWidth));
    setPages(p);
    setPage(Math.min(p - 1, Math.round(el.scrollLeft / el.clientWidth)));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [items, measure]);

  const scrollTo = (p) => {
    const el = track.current;
    if (el) el.scrollTo({ left: p * el.clientWidth, behavior: 'smooth' });
  };
  const nav = (d) => scrollTo(Math.max(0, Math.min(pages - 1, page + d)));

  return (
    <section className="container-bdo pt-6">
      <div className="relative">
        <h2 className="section-title">Nos Produits Populaires</h2>
        <Link to="/boutique" className="mt-2 flex items-center justify-center gap-2 text-[13px] font-semibold text-choco-800 hover:text-gold-600 md:absolute md:right-0 md:top-1/2 md:mt-0 md:-translate-y-1/2">
          Voir toute la boutique <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative mt-4">
        <button onClick={() => nav(-1)} disabled={page === 0} aria-label="Produits précédents"
          className="absolute -left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-choco-800 shadow-card disabled:opacity-40 md:grid xl:-left-14">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div ref={track} onScroll={measure}
          className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 pt-1 scrollbar-none sm:gap-4">
          {(items || Array.from({ length: 6 })).map((p, k) => (
            <div key={p?.id || k} className="w-[calc(50%-6px)] shrink-0 snap-start sm:w-[calc(33.333%-11px)] lg:w-[calc(16.666%-13.4px)]">
              {p ? <ProductCard product={p} /> : <ProductSkeleton />}
            </div>
          ))}
        </div>
        <button onClick={() => nav(1)} disabled={page >= pages - 1} aria-label="Produits suivants"
          className="absolute -right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-choco-800 shadow-card disabled:opacity-40 md:grid xl:-right-14">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      {pages > 1 && (
        <div className="mt-1 flex justify-center gap-2.5">
          {Array.from({ length: pages }).map((_, k) => (
            <button key={k} onClick={() => scrollTo(k)} aria-label={`Page ${k + 1}`}
              className={`h-2 w-2 rounded-full ${k === page ? 'bg-choco-800' : 'bg-stone-300'}`} />
          ))}
        </div>
      )}
    </section>
  );
}

function SpecialOffer() {
  return (
    <section className="container-bdo pt-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#fbe6df] via-[#f8ddd4] to-[#f4cfc3] shadow-card">
        <div className="grid items-center sm:grid-cols-[1fr_1.15fr]">
          <div className="relative z-10 px-6 py-6 sm:py-5 sm:pl-[7%]">
            <h2 className="font-serif text-[38px] font-bold italic leading-none text-choco-800 sm:text-[44px]">Offre Spéciale</h2>
            <p className="mt-2 text-[17px] leading-tight text-ink sm:text-[19px]">
              Jusqu’à <strong className="font-bold text-choco-800">-30%</strong> sur une sélection<br />de soins visage et cheveux
            </p>
            <Link to="/boutique?promo=1&sort=discount" className="btn-primary mt-4 !rounded-lg !px-6 !text-[14px]">
              En profiter maintenant <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative h-40 sm:h-full sm:min-h-[150px]">
            <img src="/images/offre-produits.jpg" alt="Sélection CeraVe, Elseve, NIVEA et Garnier en promotion"
              className="absolute inset-0 h-full w-full object-cover object-left"
              style={{ maskImage: 'linear-gradient(to right, transparent, #000 12%, #000 80%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 12%, #000 80%, transparent)' }} />
            <div className="absolute right-4 top-1/2 grid h-24 w-24 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-[#c8561f] to-[#8a3414] text-center text-white shadow-lg ring-4 ring-white/40 sm:right-[8%] sm:h-28 sm:w-28">
              <span className="leading-none">
                <span className="block font-serif text-base">Jusqu’à</span>
                <span className="block text-[32px] font-bold sm:text-[36px]">-30%</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <PopularProducts />
      <SpecialOffer />
      <FeatureStrip />
    </>
  );
}
