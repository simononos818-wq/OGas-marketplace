export const MIN_PRICE_PER_KG = 800;
export const MAX_PRICE_PER_KG = 3000;

export function isValidPricePerKg(value: unknown): value is number {
  const price = Number(value);
  return Number.isFinite(price) && price >= MIN_PRICE_PER_KG && price <= MAX_PRICE_PER_KG;
}
