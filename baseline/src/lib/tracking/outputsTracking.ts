import type { Waste, ProductOutput } from '@/types';
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

export interface OutputsTrackingData extends TrackingData {
  wasteSparkline: number[];
  productSparkline: number[];
}

export function calculateOutputsMetrics(
  waste: Waste[],
  productOutputs: ProductOutput[]
): OutputsTrackingData {
  const targetPeriods = getLast12Months();

  // Waste analysis
  const totalWaste = waste.reduce((sum, w) => sum + (w.quantityKg || 0), 0);

  // Diversion (recycled + composting)
  const divertedWaste = waste
    .filter(w => w.disposalRoute === 'recycling' || w.disposalRoute === 'composting' || w.disposalRoute === 'reuse')
    .reduce((sum, w) => sum + (w.quantityKg || 0), 0);
  const diversionRate = totalWaste > 0 ? Math.round((divertedWaste / totalWaste) * 100) : 0;

  // Hazardous waste
  const hazardousWaste = waste
    .filter(w => w.hazardous)
    .reduce((sum, w) => sum + (w.quantityKg || 0), 0);
  const hazardousPercent = totalWaste > 0 ? Math.round((hazardousWaste / totalWaste) * 100) : 0;

  // Landfill
  const landfillWaste = waste
    .filter(w => w.disposalRoute === 'landfill')
    .reduce((sum, w) => sum + (w.quantityKg || 0), 0);
  const landfillPercent = totalWaste > 0 ? Math.round((landfillWaste / totalWaste) * 100) : 0;

  // Product output
  const totalProductOutput = productOutputs.reduce((sum, p) => sum + (p.quantity || 0), 0);

  // Waste intensity (kg waste per unit produced)
  const wasteIntensity = totalProductOutput > 0
    ? totalWaste / totalProductOutput
    : 0;

  // Sparkline data
  const wasteSums = sumByPeriod(waste, 'quantityKg' as keyof Waste);
  const wasteSparkline = getSparklineData(wasteSums, targetPeriods);

  const productSums = sumByPeriod(productOutputs, 'quantity' as keyof ProductOutput);
  const productSparkline = getSparklineData(productSums, targetPeriods);

  // Build metrics
  const metrics: DomainMetric[] = [
    {
      label: 'Total Waste',
      value: totalWaste > 1000 ? formatNumber(totalWaste / 1000, 1) : formatNumber(totalWaste),
      unit: totalWaste > 1000 ? 't' : 'kg',
      trend: wasteSparkline.length >= 2
        ? getTrend(wasteSparkline[wasteSparkline.length - 1], wasteSparkline[wasteSparkline.length - 2])
        : undefined
    },
    {
      label: 'Diversion Rate',
      value: diversionRate,
      unit: '%'
    },
    {
      label: 'Hazardous',
      value: hazardousPercent,
      unit: '%'
    },
    {
      label: 'Landfill',
      value: landfillPercent,
      unit: '%'
    },
    {
      label: 'Production',
      value: totalProductOutput > 1000 ? formatNumber(totalProductOutput / 1000, 1) : formatNumber(totalProductOutput),
      unit: totalProductOutput > 1000 ? 'k units' : 'units',
      trend: productSparkline.length >= 2
        ? getTrend(productSparkline[productSparkline.length - 1], productSparkline[productSparkline.length - 2])
        : undefined
    }
  ];

  // Combine all outputs for coverage/quality
  const allOutputs = [...waste, ...productOutputs];
  const coverage = calculateCoverage(allOutputs, targetPeriods);
  const quality = calculateQuality(allOutputs);

  // Generate recommendations
  const recommendations = generateBaseRecommendations(allOutputs, targetPeriods, 'outputs');

  // Domain-specific recommendations
  if (diversionRate < 75 && waste.length > 0) {
    recommendations.push(`Diversion rate is ${diversionRate}%. Target 75%+ to reduce landfill impact.`);
  }

  if (hazardousPercent > 5 && waste.length > 0) {
    recommendations.push(`Hazardous waste is ${hazardousPercent}% of total. Review processes to reduce hazardous materials.`);
  }

  if (landfillPercent > 25 && waste.length > 0) {
    recommendations.push(`${landfillPercent}% of waste goes to landfill. Implement recycling and composting programs.`);
  }

  if (wasteIntensity > 0.5 && totalProductOutput > 0) {
    recommendations.push(`Waste intensity is ${wasteIntensity.toFixed(2)} kg/unit. Consider process optimization.`);
  }

  if (productOutputs.length === 0 && waste.length > 0) {
    recommendations.push('No production data logged. Add product output to calculate waste intensity metrics.');
  }

  return {
    metrics,
    coverage,
    quality,
    recommendations,
    wasteSparkline,
    productSparkline
  };
}
