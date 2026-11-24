import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ClipboardCheck, Copy, Check } from 'lucide-react';
import { WhatsAppIcon } from '../components/Icons';
import { useAuth } from '../context/AppContext';
import { api } from '../lib/api';
import { fcfa } from '../lib/format';

export default function OrderConfirmation() {
  const { reference } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const [data, setData] = useState(state?.order ? state : null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!data && user) api.get(`/api/orders/mine/${reference}`).then(setData).catch(() => {});
  }, [data, user, reference]);

  if (!data) {
    return (
      <div className="container-bdo py-20 text-center">
        <p className="font-serif text-2xl text-choco-800">Commande {reference}</p>
        <p className="mt-2 text-stone-600">Connectez-vous pour consulter le détail de cette commande.</p>
        <Link to="/connexion" className="btn-primary mt-6">Se connecter</Link>
      </div>
    );
  }

  const { order, whatsapp_url, whatsapp_message } = data;
  const copy = async () => {
    try { await navigator.clipboard.writeText(whatsapp_message); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  return (
    <div className="container-bdo max-w-3xl py-10 sm:py-14">
      <div className="card p-6 text-center sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-choco-800">
          <ClipboardCheck className="h-8 w-8" />
        </span>
        <h1 className="mt-4 font-serif text-3xl font-bold text-choco-800">Commande préparée</h1>
        <p className="mt-2 text-stone-600">
          Référence <strong className="text-choco-800">{order.reference}</strong> — total <strong>{fcfa(order.total)}</strong>
        </p>
        <div className="mx-auto mt-5 max-w-xl rounded-xl bg-amber-50 p-4 text-left text-sm text-amber-900">
          <p className="font-semibold">Dernière étape : envoyez le message sur WhatsApp</p>
          <p className="mt-1">
            Votre commande est enregistrée <strong>en attente</strong>. Elle ne sera transmise à Beauté d’Or qu’une fois que
            vous aurez appuyé sur <strong>« Envoyer »</strong> dans WhatsApp. La boutique vous confirmera ensuite la
            disponibilité, la livraison et le paiement.
          </p>
        </div>
        <a href={whatsapp_url} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-6 !px-8 !py-3.5 !text-base">
          <WhatsAppIcon className="h-6 w-6" /> {state?.opened ? 'Rouvrir WhatsApp' : 'Ouvrir WhatsApp et envoyer'}
        </a>
      </div>

      <div className="card mt-6 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-choco-800">Aperçu du message</h2>
          <button onClick={copy} className="btn-ghost !px-3 !py-1.5 !text-xs">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-[#e7ffdb] p-4 font-sans text-[13px] leading-relaxed text-stone-800">{whatsapp_message}</pre>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/boutique" className="btn-outline">Continuer mes achats</Link>
        {user && <Link to="/compte/commandes" className="btn-primary">Mes commandes</Link>}
      </div>
    </div>
  );
}
