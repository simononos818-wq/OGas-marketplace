// Single source of truth for public contact details.
// Change the number or email here and the footer updates everywhere.
export const CONTACT = {
  brand: 'OGas Marketplace Ltd',
  whatsappDisplay: '0913 311 0237',
  whatsappE164: '2349133110237',
  email: 'support@ogaslpgmarketplace.com',
  address: '20 Ejumeghere Street, Isodje, Oteri, Ughelli, Delta State, Nigeria',
  registration: 'CAC incorporation in progress',
} as const;

export function whatsappLink(text?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappE164}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
