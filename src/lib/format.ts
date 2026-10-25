import type { Alternative, Product } from './types';

type Priced = Product | Alternative | null | undefined;

export function money(n: number | null | undefined, currency = 'INR'): string {
  if (n == null || !Number.isFinite(Number(n))) return 'Price not verified';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(Number(n));
}

export const getPrice = (p: Priced): number | null => p?.price ?? p?.currentPriceINR ?? null;
export const getLink = (p: Priced): string => p?.buyUrl || p?.productUrl || (p as Alternative)?.retailerUrl || '';
export const getImage = (p: Priced): string => p?.imageUrl || '';

export interface Saving { alt: Alternative; amount: number; percent: number }

// The cheapest alternative that is actually cheaper than the product.
export function bestSaving(product: Product): Saving | null {
  const base = getPrice(product);
  if (base == null) return null;
  let best: Saving | null = null;
  for (const alt of product.alternatives ?? []) {
    const price = getPrice(alt);
    if (price == null || price >= base) continue;
    const amount = base - price;
    if (!best || amount > best.amount) {
      best = { alt, amount, percent: Math.round((amount / base) * 100) };
    }
  }
  return best;
}

export function formatDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}
