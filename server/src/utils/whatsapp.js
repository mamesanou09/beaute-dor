export const PAYMENT_LABELS = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  cash: 'Paiement à la livraison',
};

export const formatFCFA = (n) =>
  `${Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;

/**
 * Construit le message WhatsApp de commande à partir d'une commande enregistrée
 * (prix recalculés côté serveur, donc exacts).
 */
export function buildOrderMessage(order, items) {
  const lines = [
    "Bonjour Beauté d'Or !",
    '',
    'Je souhaite passer une commande.',
    `Référence : ${order.reference}`,
    '',
    'DÉTAILS DE MA COMMANDE :',
    '',
  ];
  items.forEach((it, i) => {
    const label = [it.product_name, it.brand].filter(Boolean).join(' ') + (it.format ? ` (${it.format})` : '');
    lines.push(
      `${i + 1}. Produit : ${label}`,
      `   - Quantité : ${it.quantity}`,
      `   - Prix unitaire : ${formatFCFA(it.unit_price)}`,
      `   - Sous-total : ${formatFCFA(it.line_total)}`,
      ''
    );
  });
  lines.push(
    `Sous-total produits : ${formatFCFA(order.subtotal)}`,
    `Livraison (${order.zone_name}) : ${formatFCFA(order.delivery_fee)}`,
    `TOTAL : ${formatFCFA(order.total)}`,
    '',
    'INFORMATIONS DU CLIENT :',
    '',
    `- Nom complet : ${order.customer_name}`,
    `- Téléphone : ${order.phone}`,
    `- Adresse de livraison : ${order.address}`,
    `- Quartier / Ville : ${order.district_city}`,
    `- Mode de paiement souhaité : ${PAYMENT_LABELS[order.payment_method] || order.payment_method}`,
  );
  if (order.notes) lines.push(`- Remarque : ${order.notes}`);
  lines.push(
    '',
    'Merci de confirmer ma commande et de m\'indiquer les modalités de livraison.',
    '',
    'Cordialement.'
  );
  return lines.join('\n');
}

export function whatsappUrl(number, message) {
  const digits = String(number).replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
