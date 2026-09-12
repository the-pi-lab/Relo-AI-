/**
 * ManyChat Tiered Contact Pricing & 3-Year Savings Formulas
 * Sourced & Verified: September 2026 based on published ManyChat Pro pricing
 */

export const calculateManyChatMonthly = (count: number): number => {
  if (count <= 500) return 15;
  if (count <= 1000) return 25;
  if (count <= 2500) return 35;
  if (count <= 5000) return 45;
  if (count <= 10000) return 65;
  if (count <= 25000) return 145;
  return 235;
};

export const calculateManyChatAnnual = (count: number): number => {
  return calculateManyChatMonthly(count) * 12;
};

export const calculateThreeYearSavings = (count: number, reloCost: number = 10): number => {
  const threeYearManyChat = calculateManyChatAnnual(count) * 3;
  return threeYearManyChat - reloCost;
};
