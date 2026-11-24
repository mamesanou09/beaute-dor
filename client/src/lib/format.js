export const fcfa = (n) =>
  `${Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;

export const date = (d) =>
  new Date(d).toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' });

export const dateTime = (d) =>
  new Date(d).toLocaleString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const ORDER_STATUS = {
  en_attente: { label: 'En attente', cls: 'bg-amber-100 text-amber-800' },
  confirmee: { label: 'Confirmée', cls: 'bg-sky-100 text-sky-800' },
  en_preparation: { label: 'En préparation', cls: 'bg-indigo-100 text-indigo-800' },
  expediee: { label: 'Expédiée', cls: 'bg-violet-100 text-violet-800' },
  livree: { label: 'Livrée', cls: 'bg-emerald-100 text-emerald-800' },
  annulee: { label: 'Annulée', cls: 'bg-stone-200 text-stone-700' },
};

export const PAYMENT_STATUS = {
  non_paye: { label: 'Non payé', cls: 'bg-rose-100 text-rose-700' },
  paye: { label: 'Payé', cls: 'bg-emerald-100 text-emerald-800' },
  rembourse: { label: 'Remboursé', cls: 'bg-stone-200 text-stone-700' },
};

export const PAYMENT_LABELS = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Paiement à la livraison' };

/** Lien WhatsApp générique (bouton flottant, fiche produit). */
export const waLink = (number, text) =>
  `https://wa.me/${String(number || '221783676372').replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const imgUrl = (u) => u || '/favicon.svg';
