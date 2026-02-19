/**
 * Industry detection helpers based on NACE Rev. 2 codes.
 *
 * Covers the agricultural food chain:
 *  - A01  Crop and animal production
 *  - A02  Forestry and logging
 *  - A03  Fishing and aquaculture
 *  - C10  Food products manufacturing
 *  - C11  Beverages manufacturing
 */

/** Returns true for agricultural and food-chain industries */
export function isAgriculturalIndustry(code?: string): boolean {
  if (!code) return false;
  return code.startsWith('A') || code === 'C10' || code === 'C11';
}
