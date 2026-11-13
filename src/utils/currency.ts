/**
 * Currency utility for Indian Rupee (INR - ₹)
 * Standard exchange rate pegged to latest market: 1 USD ≈ ₹93.80 INR
 */
export const USD_TO_INR_RATE = 93.80;

export const formatINR = (amount: number, includeDecimals = true): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);
};

export const formatINRSymbol = (amount: number, includeDecimals = false): string => {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);
  return `₹${formatted}`;
};
