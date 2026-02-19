import type { Asset, SiteDetails } from '@/types';
import {
  formatNumber,
  getLast12Months,
  type TrackingData,
  type DomainMetric
} from './utils';

export interface InfrastructureTrackingData extends TrackingData {
  assetsByCategory: Record<string, number>;
}

export function calculateInfrastructureMetrics(
  assets: Asset[],
  siteDetails: SiteDetails[]
): InfrastructureTrackingData {
  const targetPeriods = getLast12Months();

  // Total assets
  const totalAssets = assets.reduce((sum, a) => sum + (a.quantity || 1), 0);

  // Assets by category
  const assetsByCategory: Record<string, number> = {};
  assets.forEach(a => {
    assetsByCategory[a.assetCategory] = (assetsByCategory[a.assetCategory] || 0) + (a.quantity || 1);
  });

  // Total energy consumption
  const totalEnergy = assets.reduce((sum, a) => sum + (a.energyConsumptionKwhYear || 0), 0);

  // Assets needing replacement (within next 5 years)
  const currentYear = new Date().getFullYear();
  const assetsNeedingReplacement = assets.filter(a => {
    if (!a.acquisitionYear || !a.expectedLifespanYears) return false;
    const replacementYear = a.acquisitionYear + a.expectedLifespanYears;
    return replacementYear <= currentYear + 5;
  });
  const replacementCount = assetsNeedingReplacement.reduce((sum, a) => sum + (a.quantity || 1), 0);
  const replacementPercent = totalAssets > 0
    ? Math.round((replacementCount / totalAssets) * 100)
    : 0;

  // Total site floor area
  const totalFloorArea = siteDetails.reduce((sum, s) => sum + (s.floorAreaM2 || 0), 0);

  // Energy intensity (if we have floor area)
  const energyIntensity = totalFloorArea > 0
    ? totalEnergy / totalFloorArea
    : 0;

  // Build metrics
  const metrics: DomainMetric[] = [
    {
      label: 'Total Assets',
      value: formatNumber(totalAssets),
      unit: 'items'
    },
    {
      label: 'Annual Energy',
      value: totalEnergy > 1000000 ? formatNumber(totalEnergy / 1000000, 1) : formatNumber(totalEnergy / 1000, 0),
      unit: totalEnergy > 1000000 ? 'GWh' : 'MWh'
    },
    {
      label: 'Floor Area',
      value: totalFloorArea > 0 ? formatNumber(totalFloorArea) : 'N/A',
      unit: totalFloorArea > 0 ? 'm²' : ''
    },
    {
      label: 'Replacement Due',
      value: replacementCount.toString(),
      unit: 'assets (5yr)'
    },
    {
      label: 'Energy Intensity',
      value: energyIntensity > 0 ? energyIntensity.toFixed(0) : 'N/A',
      unit: energyIntensity > 0 ? 'kWh/m²' : ''
    }
  ];

  // Infrastructure is point-in-time, create synthetic coverage
  // Assets don't have period/confidence fields, so we create static values
  const coverage: import('./utils').TimeSeriesCoverage = {
    periodsWithData: assets.length > 0 ? targetPeriods.slice(-1) : [],
    periodsMissing: assets.length > 0 ? targetPeriods.slice(0, -1) : targetPeriods,
    oldestData: assets.length > 0 ? assets.reduce((min, a) => a.createdAt < min ? a.createdAt : min, assets[0]?.createdAt || 'N/A') : 'N/A',
    newestData: assets.length > 0 ? assets.reduce((max, a) => a.updatedAt > max ? a.updatedAt : max, assets[0]?.updatedAt || 'N/A') : 'N/A',
    coveragePercent: assets.length > 0 ? 100 : 0
  };

  const quality: import('./utils').DataQualityBreakdown = {
    high: assets.length,
    medium: 0,
    low: 0,
    noData: 0,
    total: assets.length
  };

  // Generate recommendations
  const recommendations: string[] = [];
  if (assets.length === 0) {
    recommendations.push('Start adding infrastructure assets to build your baseline.');
  }

  // Domain-specific recommendations
  if (replacementPercent > 20) {
    recommendations.push(`${replacementPercent}% of assets due for replacement within 5 years. Plan capital budget accordingly.`);
  }

  if (siteDetails.length === 0 && assets.length > 0) {
    recommendations.push('No site details logged. Add floor area for energy intensity calculations.');
  }

  const hvacAssets = assetsByCategory['hvac'] || 0;
  if (hvacAssets === 0 && assets.length > 0) {
    recommendations.push('No HVAC assets logged. Add heating/cooling equipment for complete emissions tracking.');
  }

  const vehicleAssets = assetsByCategory['vehicles'] || 0;
  if (vehicleAssets === 0 && assets.length > 5) {
    recommendations.push('No vehicle assets logged. Add company vehicles for Scope 1 emissions tracking.');
  }

  if (energyIntensity > 200 && totalFloorArea > 0) {
    recommendations.push(`Energy intensity of ${energyIntensity.toFixed(0)} kWh/m² is high. Consider efficiency upgrades.`);
  }

  return {
    metrics,
    coverage,
    quality,
    recommendations,
    assetsByCategory
  };
}
