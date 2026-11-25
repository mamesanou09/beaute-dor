import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Truck, Info, Banknote, Smartphone } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { WhatsAppIcon } from '../components/Icons';
import { useAuth, useCart, useShop } from '../context/AppContext';
import { api } from '../lib/api';
import { fcfa, imgUrl } from '../lib/format';

const PAYMENTS = [
  { value: 'wave', label: 'Wave', icon: Smartphone, color: 'bg-[#1dc8f2]', hint: 'Payez via Wave après confirmation de la boutique.' },
  { value: 'orange_money', label: 'Orange Money', icon: Smartphone, color: 'bg-[#ff7900]', hint: 'Payez via Orange Money après confirmation de la boutique.' },
  { value: 'cash', label: 'Paiement à la livraison', icon: Banknote, color: 'bg-choco-800', hint: 'Réglez en espèces à la réception de votre colis.' },
];
const PHONE_RE = /^(\+?221)?\s?(7[0-8]|3[0-9])\s?\d{3}\s?\d{2}\s?\d{2}$/;

export function validateCheckout(f) {
  const e = {};
  if (f.customer_name.trim().length < 3) e.customer_name = 'Indiquez votre nom complet.';
  if (!PHONE_RE.test(f.phone.trim())) e.phone = 'Numéro invalide (ex : 7X XXX XX XX).';
  if (f.address.trim().length < 5) e.address = 'Indiquez votre adresse de livraison.';
  if (f.district_city.trim().length < 2) e.district_city = 'Indiquez votre quartier / ville.';
  if (!f.zone_id) e.zone_id = 'Choisissez une zone de livraison.';
  if (!f.payment_method) e.payment_method = 'Choisissez un mode de paiement.';
  return e;
}

export default function Checkout() {
  const { items, subtotal, count, clear } = useCart();
  const { user } = useAuth();
  const { settings } = useShop();
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState({
    customer_name: user?.full_name || '', phone: user?.phone || '', address: user?.address || '',
    district_city: user?.city || '', zone_id: '', payment_method: '', notes: '',
  });

  useEffect(() => { api.get('/api/delivery-zones').then(setZones).catch(() => setServerError('Impossible de charger les zones de livraison.')); }, []);
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, customer_name: f.customer_name || user.full_name, phone: f.phone || user.phone || '', address: f.address || user.address || '', district_city: f.district_city || user.city || '' }));
  }, [user]);

  if (!items.length && !busy) return <Navigate to="/panier" replace />;

  const zone = zones.find((z) => String(z.id) === String(form.zone_id));
  const fee = zone?.fee || 0;
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validateCheckout(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    // Fenêtre ouverte immédiatement (geste utilisateur) pour éviter le blocage des pop-ups,
    // puis redirigée vers WhatsApp une fois la commande enregistrée.
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const win = isMobile ? null : window.open('', '_blank');
    setBusy(true);
    try {
      const r = await api.post('/api/orders', {
        ...form,
        zone_id: Number(form.zone_id),
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      });
      let opened = false;
      if (win) { win.location.href = r.whatsapp_url; opened = true; }
      clear();
      navigate(`/commande/confirmation/${r.order.reference}`, { replace: true, state: { ...r, opened } });
      if (isMobile) window.location.href = r.whatsapp_url; // ouvre l'application WhatsApp
    } catch (err) {
      win?.close();
      setBusy(false);
      setErrors(err.fieldErrors || {});
      setServerError(err.message);
    }
  };

  const Field = ({ name, label, children }) => (
    <div>
      <label htmlFor={name} className="label">{label} <span className="text-red-500">*</span></label>
      {children}
      {errors[name] && <p className="field-error" role="alert">{errors[name]}</p>}
    </div>
  );

  return (
    <>
      <PageHeader title="Validation de commande" crumbs={[['/panier', 'Panier'], [null, 'Validation']]}
        subtitle="Renseignez vos informations : votre commande sera enregistrée puis envoyée à la boutique via WhatsApp." />
      <form onSubmit={submit} noValidate className="container-bdo grid gap-8 py-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-choco-800">1. Vos informations</h2>
            {!user && (
              <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm">
                Déjà cliente ? <Link to="/connexion" state={{ from: '/commande' }} className="font-semibold text-choco-800 underline">Connectez-vous</Link> pour retrouver vos commandes dans votre historique.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {Field({ name: 'customer_name', label: 'Nom complet', children:
                <input id="customer_name" name="customer_name" value={form.customer_name} onChange={set('customer_name')} autoComplete="name" className="input" placeholder="Awa Ndiaye" /> })}
              {Field({ name: 'phone', label: 'Téléphone', children:
                <input id="phone" name="phone" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" className="input" placeholder="7X XXX XX XX" /> })}
              <div className="sm:col-span-2">
                {Field({ name: 'address', label: 'Adresse de livraison', children:
                  <input id="address" name="address" value={form.address} onChange={set('address')} autoComplete="street-address" className="input" placeholder="Rue, villa, repère (ex : près de la mosquée)" /> })}
              </div>
              {Field({ name: 'district_city', label: 'Quartier / Ville', children:
                <input id="district_city" name="district_city" value={form.district_city} onChange={set('district_city')} className="input" placeholder="Keury Souf, Rufisque" /> })}
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-choco-800">2. Zone de livraison</h2>
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Zone de livraison">
              {zones.map((z) => (
                <label key={z.id} className={`cursor-pointer rounded-xl border-2 p-4 transition ${String(form.zone_id) === String(z.id) ? 'border-choco-800 bg-rose-50' : 'border-rose-200 hover:border-rose-300'}`}>
                  <input type="radio" name="zone_id" value={z.id} checked={String(form.zone_id) === String(z.id)} onChange={set('zone_id')} className="sr-only" />
                  <Truck className="h-5 w-5 text-choco-800" />
                  <p className="mt-2 font-semibold">{z.name}</p>
                  <p className="text-sm font-bold text-gold-600">{z.fee ? fcfa(z.fee) : 'Gratuit'}</p>
                  {z.delay && <p className="text-xs text-stone-500">Délai : {z.delay}</p>}
                </label>
              ))}
            </div>
            {errors.zone_id && <p className="field-error" role="alert">{errors.zone_id}</p>}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-choco-800">3. Mode de paiement souhaité</h2>
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Mode de paiement">
              {PAYMENTS.map((p) => (
                <label key={p.value} className={`cursor-pointer rounded-xl border-2 p-4 transition ${form.payment_method === p.value ? 'border-choco-800 bg-rose-50' : 'border-rose-200 hover:border-rose-300'}`}>
                  <input type="radio" name="payment_method" value={p.value} checked={form.payment_method === p.value} onChange={set('payment_method')} className="sr-only" />
                  <span className={`grid h-9 w-9 place-items-center rounded-lg text-white ${p.color}`}><p.icon className="h-5 w-5" /></span>
                  <p className="mt-2 font-semibold">{p.label}</p>
                  <p className="text-xs text-stone-500">{p.hint}</p>
                </label>
              ))}
            </div>
            {errors.payment_method && <p className="field-error" role="alert">{errors.payment_method}</p>}
            <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              <Info className="h-4 w-4 shrink-0" />
              Aucun paiement n’est effectué sur ce site. Pour Wave ou Orange Money, la boutique vous communiquera les
              modalités de paiement après confirmation de votre commande sur WhatsApp
              {settings.wave_number ? ` (numéro marchand : ${settings.wave_number})` : ''}.
            </p>
            <div className="mt-4">
              <label htmlFor="notes" className="label">Remarque (facultatif)</label>
              <textarea id="notes" name="notes" value={form.notes} onChange={set('notes')} rows={2} maxLength={500} className="input" placeholder="Horaire de livraison préféré, instructions…" />
            </div>
          </section>
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-32">
          <h2 className="font-serif text-xl font-bold text-choco-800">Votre commande</h2>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <span className="relative h-12 w-12 shrink-0 rounded-lg bg-rose-50 p-1">
                  <img src={imgUrl(i.image_url)} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-choco-800 px-1 text-[10px] font-bold text-white">{i.quantity}</span>
                </span>
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{i.name}</span><span className="text-xs text-stone-500">{i.brand} · {fcfa(i.price)}</span></span>
                <span className="font-semibold">{fcfa(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-rose-100 pt-4 text-sm">
            <div className="flex justify-between"><dt>Sous-total ({count})</dt><dd>{fcfa(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Livraison {zone ? `(${zone.name})` : ''}</dt><dd>{zone ? fcfa(fee) : '—'}</dd></div>
          </dl>
          <div className="mt-3 flex justify-between border-t border-rose-100 pt-3 text-lg font-bold text-choco-800">
            <span>Total</span><span>{fcfa(subtotal + fee)}</span>
          </div>
          {serverError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</p>}
          <button type="submit" disabled={busy} className="btn-whatsapp mt-5 w-full !py-3.5 !text-[15px]">
            <WhatsAppIcon /> {busy ? 'Préparation du message…' : 'Commander via WhatsApp'}
          </button>
          <p className="mt-3 text-center text-xs text-stone-500">
            WhatsApp s’ouvrira avec le récapitulatif. Votre commande ne sera transmise qu’après avoir appuyé sur « Envoyer » dans WhatsApp.
          </p>
        </aside>
      </form>
    </>
  );
}
