/**
 * Formats a price value in UAE Dirham format: 250د.إ
 */
export const formatPrice = (price: number | string): string => {
  return `${price} د.إ`;
};
