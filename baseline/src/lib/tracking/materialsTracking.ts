import type { Material, MaterialInput } from '@/types';
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

export interface MaterialsTrackingData extends TrackingData {
  quantitySparkline: number[];
}

export function calculateMaterialsMetrics(
  materials: Material[],
  materialInputs: MaterialInput[]
): MaterialsTrackingData {
  const targetPeriods = getLast12Months();

  // Total quantity (normalize to kg where possible)
  const totalQuantity = materialInputs.reduce((sum, i) => {
    // Convert to kg if needed
    const factor = i.unit === 't' ? 1000 : i.unit === 'kg' ? 1 : 0;
    return sum + (i.quantity * factor);
  }, 0);

  // Average recycled content
  const entriesWithRecycled = materialInputs.filter(i => i.recycledContentPercent !== undefined);
  const avgRecycledContent = entriesWithRecycled.length > 0
    ? entriesWithRecycled.reduce((sum, i) => sum + (i.recycledContentPercent || 0), 0) / entriesWithRecycled.length
    : 0;

  // Certified materials count
  const certifiedCount = materialInputs.filter(i => i.certification).length;

  // Unique supplier countries
  const uniqueCountries = [...new Set(materialInputs.map(i => i.supplierCountry).filter(Boolean))];

  // Hazardous materials count
  const hazardousCount = materialInputs.filter(i => i.hazardous).length;

  // Sparkline data
  const quantitySums = sumByPeriod(materialInputs, 'quantity');
  const quantitySparkline = getSparklineData(quantitySums, targetPeriods);

  // Build metrics
  const metrics: DomainMetric[] = [
    {
      label: 'Material Types',
      value: materials.length,
      unit: 'types'
    },
    {
      label: 'Total Quantity',
      value: totalQuantity > 1000 ? formatNumber(totalQuantity / 1000, 1) : formatNumber(totalQuantity),
      unit: totalQuantity > 1000 ? 't' : 'kg',
      trend: quantitySparkline.length >= 2
        ? getTrend(quantitySparkline[quantitySparkline.length - 1], quantitySparkline[quantitySparkline.length - 2])
        : undefined
    },
    {
      label: 'Avg Recycled Content',
      value: avgRecycledContent.toFixed(1),
      unit: '%'
    },
    {
      label: 'Supplier Countries',
      value: uniqueCountries.length,
      unit: 'countries'
    },
    {
      label: 'Certified Entries',
      value: certifiedCount,
      unit: 'entries'
    }
  ];

  // Calculate coverage and quality
  const coverage = calculateCoverage(materialInputs, targetPeriods);
  const quality = calculateQuality(materialInputs);

  // Generate recommendations
  const recommendations = generateBaseRecommendations(materialInputs, targetPeriods, 'materials');

  // Domain-specific recommendations
  if (materials.length > 0 && materialInputs.length === 0) {
    recommendations.unshift('You have materials defined but no purchase records. Add input data for each material.');
  }

  if (entriesWithRecycled.length < materialInputs.length * 0.5 && materialInputs.length > 0) {
    recommendations.push('Track recycled content percentages for more materials to improve reporting.');
  }

  if (hazardousCount > 0 && hazardousCount === materialInputs.length) {
    recommendations.push('All tracked materials are hazardous. Consider adding non-hazardous materials.');
  }

  if (uniqueCountries.length === 1 && materialInputs.length > 5) {
    recommendations.push('All suppliers are from one country. Supply chain diversity data may be incomplete.');
  }

  return {
    metrics,
    coverage,
    quality,
    recommendations,
    quantitySparkline
  };
}
