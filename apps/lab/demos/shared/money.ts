// Demo money is integer cents so totals are exact and deterministic.
export const formatUSD = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const formatUSDShort = (cents: number) => (cents % 100 === 0 ? `$${cents / 100}` : formatUSD(cents));
