import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Heart, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { PageHeader, FeatureStrip } from '../components/Layout';
import { WhatsAppIcon } from '../components/Icons';
import { useShop, useToast } from '../context/AppContext';
import { api } from '../lib/api';
import { waLink } from '../lib/format';

export function Categories() {
  const { categories } = useShop();
  return (
    <>
      <PageHeader title="Catégories" crumbs={[[null, 'Catégories']]} subtitle="Trouvez le soin qu’il vous faut, du visage aux cheveux." />
      <div className="container-bdo grid gap-5 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link key={c.id} to={`/boutique?category=${c.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
            <div className="aspect-[2/1] overflow-hidden"><img src={c.image_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
            <div className="flex items-center justify-between p-5">
              <div>
                <h2 className="font-serif text-xl font-bold text-choco-800">{c.name}</h2>
                <p className="text-sm text-stone-500">{c.product_count} produit{c.product_count > 1 ? 's' : ''}</p>
              </div>
              <span className="btn-outline !px-4 !py-1.5 !text-xs">Voir</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function Brands() {
  const { brands } = useShop();
  return (
    <>
      <PageHeader title="Nos marques" crumbs={[[null, 'Nos marques']]} subtitle="Des marques reconnues, des produits 100 % authentiques." />
      <div className="container-bdo grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <Link key={b.id} to={`/boutique?brand=${b.slug}`} className="card flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-rose-100 font-serif text-xl font-bold text-choco-800">{b.name.charAt(0)}</span>
            <span>
              <span className="block font-serif text-lg font-bold text-choco-800">{b.name}</span>
              <span className="block text-sm text-stone-600">{b.description}</span>
              <span className="mt-1 block text-xs font-semibold text-gold-600">{b.product_count} produit{b.product_count > 1 ? 's' : ''} →</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

export function About() {
  const values = [
    [ShieldCheck, '100 % authentique', 'Nous nous approvisionnons auprès de distributeurs agréés. Aucune contrefaçon, jamais.'],
    [Heart, 'Conseil personnalisé', 'Peau grasse, sèche, cheveux crépus ou défrisés : nous vous orientons vers le bon soin.'],
    [Truck, 'Livraison partout', 'Rufisque le jour même, Dakar en 24h, et toutes les régions du Sénégal en 48 à 72h.'],
    [Sparkles, 'Sélection exigeante', 'Des marques reconnues et des produits adaptés à notre climat et à nos carnations.'],
  ];
  return (
    <>
      <PageHeader title="À propos de Beauté d’Or" crumbs={[[null, 'À propos']]} />
      <div className="container-bdo grid items-center gap-10 py-12 lg:grid-cols-2">
        <img src="/images/hero-1.jpg" alt="Univers Beauté d’Or" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-card" style={{ objectPosition: '20% center' }} />
        <div>
          <h2 className="font-serif text-3xl font-bold text-choco-800">Révéler la beauté naturelle de chaque femme</h2>
          <p className="mt-4 leading-relaxed text-stone-700">
            Née à Rufisque, Beauté d’Or est une boutique de cosmétiques et de soins de beauté pensée pour les femmes
            sénégalaises. Notre mission : rendre accessibles des soins de qualité, authentiques et adaptés à nos peaux
            et à nos cheveux, avec un service proche et chaleureux.
          </p>
          <p className="mt-3 leading-relaxed text-stone-700">
            De la crème hydratante au parfum, chaque produit est sélectionné avec soin. Commandez en ligne ou directement
            sur WhatsApp, et recevez votre colis partout au Sénégal.
          </p>
          <Link to="/boutique" className="btn-primary mt-6">Découvrir la boutique</Link>
        </div>
      </div>
      <div className="bg-rose-50 py-12">
        <div className="container-bdo grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(([Icon, t, d]) => (
            <div key={t} className="card p-6">
              <Icon className="h-8 w-8 text-gold-600" strokeWidth={1.5} />
              <h3 className="mt-3 font-serif text-lg font-bold text-choco-800">{t}</h3>
              <p className="mt-1 text-sm text-stone-600">{d}</p>
            </div>
          ))}
        </div>
      </div>
      <FeatureStrip />
    </>
  );
}

export function Contact() {
  const { settings } = useShop();
  const { notify } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Indiquez votre nom.';
    if (!form.email && !form.phone) er.email = 'Indiquez un email ou un téléphone pour vous répondre.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Email invalide.';
    if (form.message.trim().length < 10) er.message = 'Votre message est trop court (10 caractères min.).';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await api.post('/api/contact', form);
      setSent(true);
      setForm({ name: '', email: '', phone: '', message: '' });
      notify('Message envoyé. Nous vous répondrons rapidement.');
    } catch (x) { setErrors(x.fieldErrors); notify(x.message, { type: 'error' }); } finally { setBusy(false); }
  };

  const infos = [
    [MapPin, 'Adresse', settings.shop_address],
    [Phone, 'Téléphone', settings.shop_phone, `tel:${settings.shop_phone.replace(/\s/g, '')}`],
    [Mail, 'Email', settings.shop_email, `mailto:${settings.shop_email}`],
    [Clock, 'Horaires', 'Lundi – Samedi : 9h – 20h'],
  ];
  return (
    <>
      <PageHeader title="Contactez-nous" crumbs={[[null, 'Contact']]} subtitle="Une question sur un produit, une commande ou une livraison ? Nous sommes là." />
      <div className="container-bdo grid gap-8 py-10 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {infos.map(([Icon, t, v, href]) => (
            <div key={t} className="card flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-100 text-choco-800"><Icon className="h-5 w-5" /></span>
              <span><span className="block text-xs font-bold uppercase text-stone-500">{t}</span>
                {href ? <a href={href} className="font-semibold hover:text-gold-600">{v}</a> : <span className="font-semibold">{v}</span>}</span>
            </div>
          ))}
          <a href={waLink(settings.whatsapp_number, "Bonjour Beauté d'Or !")} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full !py-3.5">
            <WhatsAppIcon /> Écrire sur WhatsApp
          </a>
        </div>
        <form onSubmit={submit} noValidate className="card space-y-4 p-6">
          <h2 className="font-serif text-2xl font-bold text-choco-800">Envoyer un message</h2>
          {sent && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Merci ! Votre message a bien été enregistré.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="c-name">Nom *</label><input id="c-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{errors.name && <p className="field-error">{errors.name}</p>}</div>
            <div><label className="label" htmlFor="c-phone">Téléphone</label><input id="c-phone" type="tel" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email && <p className="field-error">{errors.email}</p>}</div>
          <div><label className="label" htmlFor="c-msg">Message *</label><textarea id="c-msg" rows={5} className="input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />{errors.message && <p className="field-error">{errors.message}</p>}</div>
          <button disabled={busy} className="btn-primary">{busy ? 'Envoi…' : 'Envoyer le message'}</button>
        </form>
      </div>
    </>
  );
}

function Legal({ title, sections }) {
  return (
    <>
      <PageHeader title={title} crumbs={[[null, title]]} />
      <article className="container-bdo max-w-3xl space-y-6 py-10 leading-relaxed text-stone-700">
        {sections.map(([h, p]) => (
          <section key={h}><h2 className="mb-2 font-serif text-xl font-bold text-choco-800">{h}</h2><p>{p}</p></section>
        ))}
        <p className="text-xs text-stone-500">Document type à faire valider par un professionnel du droit avant mise en ligne.</p>
      </article>
    </>
  );
}

export const CGV = () => (
  <Legal title="Conditions générales de vente" sections={[
    ['1. Objet', "Les présentes conditions régissent les ventes de produits cosmétiques réalisées par Beauté d'Or, boutique située à Rufisque (Sénégal), via son site internet et WhatsApp."],
    ['2. Commandes', "La commande est préparée sur le site puis transmise par le client via WhatsApp. Elle n'est ferme qu'après confirmation écrite de la boutique (disponibilité, frais et délai de livraison)."],
    ['3. Prix', 'Les prix sont indiqués en francs CFA (XOF), toutes taxes comprises, hors frais de livraison. Les frais de livraison dépendent de la zone (Dakar, Rufisque, autres régions) et sont affichés avant validation.'],
    ['4. Paiement', "Les paiements acceptés sont Wave, Orange Money et le paiement en espèces à la livraison. Aucun paiement n'est encaissé directement sur le site : les modalités sont communiquées par la boutique après confirmation."],
    ['5. Livraison', 'Les livraisons sont effectuées partout au Sénégal. Les délais indicatifs sont communiqués lors de la confirmation. Le client doit vérifier le colis à la réception.'],
    ['6. Retours', "Pour des raisons d'hygiène, les produits ouverts ne sont ni repris ni échangés. Un produit défectueux ou non conforme doit être signalé sous 48h après réception pour échange."],
    ['7. Contact', "Pour toute réclamation : contact@beautedor.sn ou via WhatsApp."],
  ]} />
);

export const Privacy = () => (
  <Legal title="Politique de confidentialité" sections={[
    ['Données collectées', 'Nom, téléphone, email, adresse de livraison et historique de commandes, uniquement pour traiter vos commandes et gérer votre compte.'],
    ['Base légale', "Le traitement est nécessaire à l'exécution de votre commande, conformément à la loi sénégalaise n° 2008-12 sur la protection des données à caractère personnel (CDP)."],
    ['WhatsApp', "Lorsque vous commandez via WhatsApp, le message est envoyé depuis votre propre compte. WhatsApp (Meta) applique sa propre politique de confidentialité."],
    ['Conservation', 'Vos données sont conservées pendant la durée de la relation commerciale puis archivées selon les obligations légales.'],
    ['Sécurité', 'Les mots de passe sont chiffrés (bcrypt) et la session est protégée par un cookie sécurisé. Seul le personnel autorisé accède aux commandes.'],
    ['Vos droits', "Vous pouvez demander l'accès, la rectification ou la suppression de vos données à contact@beautedor.sn."],
    ['Stockage local', "Votre panier et vos favoris sont enregistrés dans votre navigateur (localStorage) pour être conservés entre deux visites."],
  ]} />
);

export function NotFound() {
  return (
    <div className="container-bdo py-24 text-center">
      <p className="font-serif text-6xl font-bold text-rose-300">404</p>
      <h1 className="mt-2 font-serif text-2xl text-choco-800">Page introuvable</h1>
      <Link to="/" className="btn-primary mt-6">Retour à l’accueil</Link>
    </div>
  );
}
