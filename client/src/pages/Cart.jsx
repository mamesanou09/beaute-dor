import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Truck } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { WhatsAppIcon } from '../components/Icons';
import { useCart } from '../context/AppContext';
import { api, qs } from '../lib/api';
import { fcfa, imgUrl } from '../lib/format';

export default function Cart() {
  const { items, setQty, remove, clear, refresh, count, subtotal } = useCart();
  const navigate = useNavigate();

  // Prix et stocks toujours à jour avec la base
  useEffect(() => {
    if (!items.length) return;
    api.get(`/api/products${qs({ ids: items.map((i) => i.id).join(','), limit: 60 })}`).then((r) => refresh(r.items)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!items.length) {
    return (
      <>
        <PageHeader title="Mon panier" crumbs={[[null, 'Panier']]} />
        <div className="container-bdo py-16 text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-rose-300" strokeWidth={1.2} />
          <p className="mt-4 font-serif text-2xl text-choco-800">Votre panier est vide</p>
          <p className="mt-2 text-stone-600">Découvrez nos soins et ajoutez vos favoris au panier.</p>
          <Link to="/boutique" className="btn-primary mt-6">Découvrir la boutique</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Mon panier" crumbs={[[null, 'Panier']]} subtitle={`${count} article${count > 1 ? 's' : ''} dans votre panier`} />
      <div className="container-bdo grid gap-8 py-8 lg:grid-cols-[1fr_360px]">
        <div className="card divide-y divide-rose-100">
          {items.map((i) => (
            <div key={i.id} className="flex gap-3 p-4 sm:gap-5">
              <Link to={`/produit/${i.slug}`} className="h-20 w-20 shrink-0 rounded-lg bg-rose-50 p-1.5 sm:h-24 sm:w-24">
                <img src={imgUrl(i.image_url)} alt={i.name} className="h-full w-full object-contain mix-blend-multiply" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase text-gold-600">{i.brand}</p>
                  <Link to={`/produit/${i.slug}`} className="block font-semibold leading-snug hover:text-gold-600">{i.name}</Link>
                  <p className="text-xs text-stone-500">{i.format} · {fcfa(i.price)} l’unité</p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center rounded-lg border border-rose-300">
                    <button onClick={() => (i.quantity > 1 ? setQty(i.id, i.quantity - 1) : remove(i.id))} className="p-2" aria-label={`Diminuer la quantité de ${i.name}`}><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                    <button onClick={() => setQty(i.id, i.quantity + 1)} disabled={i.quantity >= i.stock} className="p-2 disabled:opacity-30" aria-label={`Augmenter la quantité de ${i.name}`}><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <span className="w-24 text-right font-bold text-choco-800">{fcfa(i.price * i.quantity)}</span>
                  <button onClick={() => remove(i.id)} className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600" aria-label={`Supprimer ${i.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <Link to="/boutique" className="btn-ghost !px-2"><ArrowLeft className="h-4 w-4" /> Continuer mes achats</Link>
            <button onClick={() => { if (confirm('Vider le panier ?')) clear(); }} className="btn-ghost !px-2 !text-red-600">Vider le panier</button>
          </div>
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-32">
          <h2 className="font-serif text-xl font-bold text-choco-800">Récapitulatif</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Sous-total ({count} article{count > 1 ? 's' : ''})</dt><dd className="font-semibold">{fcfa(subtotal)}</dd></div>
            <div className="flex justify-between text-stone-500"><dt>Livraison</dt><dd>Calculée à l’étape suivante</dd></div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-rose-100 pt-4 text-lg font-bold text-choco-800">
            <span>Total</span><span>{fcfa(subtotal)}</span>
          </div>
          <button onClick={() => navigate('/commande')} className="btn-whatsapp mt-5 w-full !py-3 !text-[15px]">
            <WhatsAppIcon /> Commander via WhatsApp
          </button>
          <p className="mt-3 flex items-start gap-2 text-xs text-stone-500">
            <Truck className="h-4 w-4 shrink-0" />
            Vous renseignerez vos informations de livraison, puis WhatsApp s’ouvrira avec le récapitulatif de votre commande.
          </p>
        </aside>
      </div>
    </>
  );
}
