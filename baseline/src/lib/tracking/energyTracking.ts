import type { EnergyElectricity, EnergyFuel, EnergyWater } from '@/types';
import {
  calculateCoverage,
  calculateQuality,
  generateBaseRecommendations,
  formatNumber,
  getLast12Months,
  sumByPeriod,
  getSparklineData,
  getTrend,
  type TrackingData,
  type DomainMetric
} from './utils';

export interface EnergyTrackingData extends TrackingData {
  electricitySparkline: number[];
  fuelSparkline: number[];
  waterSparkline: number[];
}

export function calculateEnergyMetrics(
  electricity: EnergyElectricity[],
  fuels: EnergyFuel[],
  water: EnergyWater[]
): EnergyTrackingData {
  const targetPeriods = getLast12Months();
  const allEntries = [
    ...electricity.map(e => ({ ...e, type: 'electricity' })),
    ...fuels.map(f => ({ ...f, type: 'fuel' })),
    ...water.map(w => ({ ...w, type: 'water' }))
  ];

  // Calculate totals
  const totalKwh = electricity.reduce((sum, e) => sum + e.consumptionKwh, 0);

  // Calculate renewable percentage
  const renewableKwh = electricity.reduce((sum, e) => {
    const onsiteRenewable = e.consumptionKwh * (e.sourceOnsiteRenewablePercent / 100);
    const ppaRenewable = e.consumptionKwh * (e.sourcePpaPercent / 100);
    const greenTariff = e.greenTariff ? e.consumptionKwh * (e.sourceGridPercent / 100) : 0;
    return sum + onsiteRenewable + ppaRenewable + greenTariff;
  }, 0);
  const renewablePercent = totalKwh > 0 ? (renewableKwh / totalKwh) * 100 : 0;

  // Calculate fuel energy (approximate kWh equivalent)
  const fuelEnergy = fuels.reduce((sum, f) => {
    // Simple conversion factors (approximate)
    const conversions: Record<string, number> = {
      kwh: 1,
      L: 10, // rough diesel/petrol equivalent
      m3: 10.5, // natural gas
      kg: 12, // solid fuels
      t: 12000
    };
    return sum + (f.quantity * (conversions[f.unit] || 1));
  }, 0);

  // Water withdrawal
  const totalWater = water.reduce((sum, w) => sum + w.withdrawalM3, 0);

  // Sparkline data
  const electricitySums = sumByPeriod(electricity, 'consumptionKwh');
  const waterSums = sumByPeriod(water, 'withdrawalM3');
  const fuelSums: Record<string, number> = {};
  fuels.forEach(f => {
    fuelSums[f.period] = (fuelSums[f.period] || 0) + f.quantity;
  });

  const electricitySparkline = getSparklineData(electricitySums, targetPeriods);
  const fuelSparkline = getSparklineData(fuelSums, targetPeriods);
  const waterSparkline = getSparklineData(waterSums, targetPeriods);

  // Estimate Scope 2 emissions (very rough - 0.4 kg CO2e/kWh average)
  const scope2Estimate = (totalKwh - renewableKwh) * 0.0004; // tCO2e

  // Build metrics
  const metrics: DomainMetric[] = [
    {
      label: 'Total Electricity',
      value: formatNumber(totalKwh),
      unit: 'kWh',
      trend: electricitySparkline.length >= 2
        ? getTrend(electricitySparkline[electricitySparkline.length - 1], electricitySparkline[electricitySparkline.length - 2])
        : undefined
    },
    {
      label: 'Renewable %',
      value: renewablePercent.toFixed(1),
      unit: '%'
    },
    {
      label: 'Scope 2 Est.',
      value: scope2Estimate.toFixed(1),
      unit: 'tCO2e'
    },
    {
      label: 'Fuel Energy',
      value: formatNumber(fuelEnergy),
      unit: 'kWh eq.'
    },
    {
      label: 'Water Withdrawal',
      value: formatNumber(totalWater),
      unit: 'm³'
    }
  ];

  // Calculate coverage and quality
  const coverage = calculateCoverage(allEntries, targetPeriods);
  const quality = calculateQuality(allEntries);

  // Generate recommendations
  const recommendations = generateBaseRecommendations(allEntries, targetPeriods, 'energy');

  // Domain-specific recommendations
  if (electricity.length > 0 && renewablePercent < 20) {
    recommendations.push('Consider green energy tariffs or PPAs to reduce Scope 2 emissions.');
  }

  if (water.length === 0 && (electricity.length > 0 || fuels.length > 0)) {
    recommendations.push('Add water consumption data for complete utility tracking.');
  }

  const fuelTypes = [...new Set(fuels.map(f => f.fuelType))];
  if (fuelTypes.length > 0 && !fuelTypes.includes('natural_gas') && !fuelTypes.includes('biomass')) {
    // All fuels are high-carbon
    if (fuels.some(f => f.purpose === 'heating')) {
      recommendations.push('Consider electrification or biomass alternatives for heating.');
    }
  }

  return {
    metrics,
    coverage,
    quality,
    recommendations,
    electricitySparkline,
    fuelSparkline,
    waterSparkline
  };
}
