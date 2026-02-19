import type { PackagingInput, Packaging } from '@/types';
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

export interface PackagingTrackingData extends TrackingData {
  weightSparkline: number[];
}

export function calculatePackagingMetrics(
  packagingInputs: PackagingInput[],
  packagings: Packaging[]
): PackagingTrackingData {
  const targetPeriods = getLast12Months();

  // Calculate total weight
  const totalWeight = packagingInputs.reduce((sum, p) => sum + (p.totalWeightKg || 0), 0);

  // Level breakdown - need to join with packaging definition
  const packagingMap = new Map(packagings.map(p => [p.id, p]));
  const levelBreakdown: Record<string, number> = { primary: 0, secondary: 0, tertiary: 0 };
  const materialBreakdown: Record<string, number> = {};

  packagingInputs.forEach(input => {
    const pkg = packagingMap.get(input.packagingId);
    if (pkg) {
      levelBreakdown[pkg.packagingLevel] = (levelBreakdown[pkg.packagingLevel] || 0) + (input.totalWeightKg || 0);
      materialBreakdown[pkg.materialType] = (materialBreakdown[pkg.materialType] || 0) + (input.totalWeightKg || 0);
    }
  });


  // Recyclability analysis
  const recyclableItems = packagingInputs.filter(p =>
    p.recyclabilityClass === 'recyclable'
  );
  const recyclableWeight = recyclableItems.reduce((sum, p) => sum + (p.totalWeightKg || 0), 0);
  const recyclabilityPercent = totalWeight > 0
    ? Math.round((recyclableWeight / totalWeight) * 100)
    : 0;

  // Recycled content analysis
  const itemsWithRecycledContent = packagingInputs.filter(p => p.recycledContentPercent !== undefined);
  const avgRecycledContent = itemsWithRecycledContent.length > 0
    ? itemsWithRecycledContent.reduce((sum, p) => sum + (p.recycledContentPercent || 0), 0) / itemsWithRecycledContent.length
    : 0;

  // Sparkline data
  const weightSums = sumByPeriod(packagingInputs, 'totalWeightKg' as keyof PackagingInput);
  const weightSparkline = getSparklineData(weightSums, targetPeriods);

  // Build metrics
  const metrics: DomainMetric[] = [
    {
      label: 'Total Packaging',
      value: totalWeight > 1000 ? formatNumber(totalWeight / 1000, 1) : formatNumber(totalWeight),
      unit: totalWeight > 1000 ? 't' : 'kg',
      trend: weightSparkline.length >= 2
        ? getTrend(weightSparkline[weightSparkline.length - 1], weightSparkline[weightSparkline.length - 2])
        : undefined
    },
    {
      label: 'Primary',
      value: formatNumber(levelBreakdown.primary),
      unit: 'kg'
    },
    {
      label: 'Secondary',
      value: formatNumber(levelBreakdown.secondary),
      unit: 'kg'
    },
    {
      label: 'Recyclable',
      value: recyclabilityPercent,
      unit: '%'
    },
    {
      label: 'Recycled Content',
      value: avgRecycledContent.toFixed(0),
      unit: '%'
    }
  ];

  // Calculate coverage and quality
  const coverage = calculateCoverage(packagingInputs, targetPeriods);
  const quality = calculateQuality(packagingInputs);

  // Generate recommendations
  const recommendations = generateBaseRecommendations(packagingInputs, targetPeriods, 'packaging');

  // Domain-specific recommendations
  if (recyclabilityPercent < 80 && packagingInputs.length > 0) {
    recommendations.push(`Only ${recyclabilityPercent}% of packaging is recyclable. Consider transitioning to recyclable alternatives.`);
  }

  if (avgRecycledContent < 30 && itemsWithRecycledContent.length > 0) {
    recommendations.push(`Average recycled content is ${avgRecycledContent.toFixed(0)}%. Target 30%+ for sustainability goals.`);
  }

  const plasticWeight = materialBreakdown['plastic'] || 0;
  if (plasticWeight > totalWeight * 0.5 && totalWeight > 0) {
    recommendations.push('Plastic represents >50% of packaging. Explore paper-based or compostable alternatives.');
  }

  if (levelBreakdown.tertiary > levelBreakdown.primary + levelBreakdown.secondary && totalWeight > 0) {
    recommendations.push('Tertiary packaging exceeds primary + secondary. Review outer packaging requirements.');
  }

  return {
    metrics,
    coverage,
    quality,
    recommendations,
    weightSparkline
  };
}
