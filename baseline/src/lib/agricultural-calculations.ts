/**
 * Agricultural emission and efficiency calculations.
 *
 * Sources:
 * - IPCC 2019 Refinement (Tier 1 defaults)
 * - IPCC AR5 GWP values (CH₄ = 28, N₂O = 265)
 */

import type { LivestockRecord, FertiliserApplication, CropOutput } from '@/types';
import {
  getLivestockEmissionFactors,
  GWP_CH4,
  GWP_N2O,
  FERTILISER_N2O_FACTOR,
  N2O_N_TO_N2O,
  getCropNRemoval,
} from '@/types';

/** Calculate livestock emissions in tCO₂e for a set of records */
export function calculateLivestockEmissions(records: LivestockRecord[]): {
  totalTco2e: number;
  entericCh4Tco2e: number;
  manureCh4Tco2e: number;
  manureN2oTco2e: number;
} {
  let entericCh4Kg = 0;
  let manureCh4Kg = 0;
  let manureN2oKg = 0;

  for (const record of records) {
    const factors = getLivestockEmissionFactors(record.livestockType);
    entericCh4Kg += record.headcount * factors.ch4EntericKgPerHead;
    manureCh4Kg += record.headcount * factors.ch4ManureKgPerHead;
    manureN2oKg += record.headcount * factors.n2oManureKgPerHead;
  }

  const entericCh4Tco2e = (entericCh4Kg * GWP_CH4) / 1000;
  const manureCh4Tco2e = (manureCh4Kg * GWP_CH4) / 1000;
  const manureN2oTco2e = (manureN2oKg * GWP_N2O) / 1000;

  return {
    totalTco2e: entericCh4Tco2e + manureCh4Tco2e + manureN2oTco2e,
    entericCh4Tco2e,
    manureCh4Tco2e,
    manureN2oTco2e,
  };
}

/** Calculate total livestock units */
export function calculateLivestockUnits(records: LivestockRecord[]): number {
  return records.reduce((sum, r) => {
    const factor = getLivestockEmissionFactors(r.livestockType).luFactor;
    return sum + r.headcount * factor;
  }, 0);
}

/** Calculate fertiliser N₂O emissions in tCO₂e */
export function calculateFertiliserEmissions(applications: FertiliserApplication[]): {
  totalNAppliedKg: number;
  n2oEmissionsTco2e: number;
} {
  const totalNAppliedKg = applications.reduce((sum, app) => {
    const nPercent = app.nitrogenContentPercent || 0;
    return sum + (app.quantityKg * nPercent) / 100;
  }, 0);

  // IPCC Tier 1: 1% of applied N → N₂O-N, then convert to N₂O, then to CO₂e
  const n2oNKg = totalNAppliedKg * FERTILISER_N2O_FACTOR;
  const n2oKg = n2oNKg * N2O_N_TO_N2O;
  const n2oEmissionsTco2e = (n2oKg * GWP_N2O) / 1000;

  return { totalNAppliedKg, n2oEmissionsTco2e };
}

/** Calculate nitrogen balance (applied - removed) */
export function calculateNBalance(
  fertiliserApps: FertiliserApplication[],
  cropOutputs: CropOutput[],
): {
  nAppliedKg: number;
  nRemovedKg: number;
  nBalanceKg: number;
  nBalancePerHa?: number;
} {
  const nAppliedKg = fertiliserApps.reduce((sum, app) => {
    const nPercent = app.nitrogenContentPercent || 0;
    return sum + (app.quantityKg * nPercent) / 100;
  }, 0);

  const nRemovedKg = cropOutputs.reduce((sum, crop) => {
    const removalFactor = getCropNRemoval(crop.cropType);
    return sum + crop.yieldTonnes * removalFactor;
  }, 0);

  const totalAreaHa = cropOutputs.reduce((sum, c) => sum + c.areaHa, 0);

  return {
    nAppliedKg,
    nRemovedKg,
    nBalanceKg: nAppliedKg - nRemovedKg,
    nBalancePerHa: totalAreaHa > 0 ? (nAppliedKg - nRemovedKg) / totalAreaHa : undefined,
  };
}

/** Calculate per-hectare intensity metrics */
export function calculatePerHectareMetrics(
  totalEmissionsTco2e: number,
  totalAreaHa: number,
  totalOutputTonnes: number,
): {
  emissionsPerHa?: number;
  emissionsPerTonne?: number;
  outputPerHa?: number;
} {
  return {
    emissionsPerHa: totalAreaHa > 0 ? totalEmissionsTco2e / totalAreaHa : undefined,
    emissionsPerTonne: totalOutputTonnes > 0 ? totalEmissionsTco2e / totalOutputTonnes : undefined,
    outputPerHa: totalAreaHa > 0 ? totalOutputTonnes / totalAreaHa : undefined,
  };
}
