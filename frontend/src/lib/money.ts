import { CURRENCIES } from "@/lib/currencies";

const SYMBOL = new Map(CURRENCIES.map((c) => [c.code, c.symbol]));

/** "USD 1,240" — code + grouped integer amount, matching the app's existing style. */
export function money(amount: number, currency: string): string {
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

/**
 * "USD 1,240 · ≈ ¥185,000" — appends the destination's local currency when a
 * snapshot rate is known. Falls back to `money()` otherwise.
 */
export function moneyDual(
  amount: number,
  currency: string,
  localCurrency?: string | null,
  fxRate?: number | null,
): string {
  const base = money(amount, currency);
  const local = localMoney(amount, currency, localCurrency, fxRate);
  return local ? `${local} · ${base}` : base;
}

/** "≈ ¥185,000" for the local currency, or null when there's no rate to use. */
export function localMoney(
  amount: number,
  currency: string,
  localCurrency?: string | null,
  fxRate?: number | null,
): string | null {
  if (!localCurrency || !fxRate || localCurrency === currency) return null;
  const sym = SYMBOL.get(localCurrency) ?? `${localCurrency} `;
  return `≈ ${sym}${Math.round(amount * fxRate).toLocaleString()}`;
}
