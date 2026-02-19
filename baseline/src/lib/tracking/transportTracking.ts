import type { TransportLog } from '@/types';
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

export interface TransportTrackingData extends TrackingData {
  tkmSparkline: number[];
}

export function calculateTransportMetrics(
  transportLogs: TransportLog[]
): TransportTrackingData {
  const targetPeriods = getLast12Months();

  // Calculate total tkm (tonne-kilometers)
  const totalTkm = transportLogs.reduce((sum, t) => sum + (t.tkm || 0), 0);

  // Direction breakdown
  const inboundTkm = transportLogs.filter(t => t.direction === 'inbound').reduce((sum, t) => sum + (t.tkm || 0), 0);
  const outboundTkm = transportLogs.filter(t => t.direction === 'outbound').reduce((sum, t) => sum + (t.tkm || 0), 0);

  // Mode breakdown
  const modeBreakdown: Record<string, number> = {};
  transportLogs.forEach(t => {
    modeBreakdown[t.mode] = (modeBreakdown[t.mode] || 0) + (t.tkm || 0);
  });
  const dominantMode = Object.entries(modeBreakdown).sort((a, b) => b[1] - a[1])[0];

  // Data type breakdown (activity vs spend-based)
  const activityBased = transportLogs.filter(t => t.dataType === 'activity_based').length;
  const spendBased = transportLogs.filter(t => t.dataType === 'spend_based').length;
  const activityPercent = transportLogs.length > 0
    ? Math.round((activityBased / transportLogs.length) * 100)
    : 0;

  // Average load factor
  const logsWithLoadFactor = transportLogs.filter(t => t.loadFactorPercent !== undefined);
  const avgLoadFactor = logsWithLoadFactor.length > 0
    ? logsWithLoadFactor.reduce((sum, t) => sum + (t.loadFactorPercent || 0), 0) / logsWithLoadFactor.length
    : 0;

  // Sparkline data
  const tkmSums = sumByPeriod(transportLogs, 'tkm' as keyof TransportLog);
  const tkmSparkline = getSparklineData(tkmSums, targetPeriods);

  // Build metrics
  const metrics: DomainMetric[] = [
    {
      label: 'Total Transport',
      value: totalTkm > 1000000 ? formatNumber(totalTkm / 1000000, 1) : formatNumber(totalTkm),
      unit: totalTkm > 1000000 ? 'M tkm' : 'tkm',
      trend: tkmSparkline.length >= 2
        ? getTrend(tkmSparkline[tkmSparkline.length - 1], tkmSparkline[tkmSparkline.length - 2])
        : undefined
    },
    {
      label: 'Inbound',
      value: formatNumber(inboundTkm),
      unit: 'tkm'
    },
    {
      label: 'Outbound',
      value: formatNumber(outboundTkm),
      unit: 'tkm'
    },
    {
      label: 'Primary Mode',
      value: dominantMode ? dominantMode[0].charAt(0).toUpperCase() + dominantMode[0].slice(1) : 'N/A',
      unit: dominantMode ? `(${Math.round((dominantMode[1] / totalTkm) * 100)}%)` : ''
    },
    {
      label: 'Activity Data',
      value: activityPercent,
      unit: '%'
    }
  ];

  // Calculate coverage and quality
  const coverage = calculateCoverage(transportLogs, targetPeriods);
  const quality = calculateQuality(transportLogs);

  // Generate recommendations
  const recommendations = generateBaseRecommendations(transportLogs, targetPeriods, 'transport');

  // Domain-specific recommendations
  if (spendBased > activityBased && transportLogs.length > 0) {
    recommendations.push('Most data is spend-based. Activity-based data (distance, weight) is more accurate for emissions.');
  }

  if (avgLoadFactor > 0 && avgLoadFactor < 50) {
    recommendations.push(`Average load factor is ${avgLoadFactor.toFixed(0)}%. Improving load optimization could reduce emissions.`);
  }

  const airTkm = modeBreakdown['air'] || 0;
  if (airTkm > totalTkm * 0.2 && totalTkm > 0) {
    recommendations.push('Air freight represents >20% of transport. Consider modal shift for lower emissions.');
  }

  if (inboundTkm === 0 && outboundTkm > 0) {
    recommendations.push('No inbound transport logged. Add upstream logistics for complete Scope 3 data.');
  }

  return {
    metrics,
    coverage,
    quality,
    recommendations,
    tkmSparkline
  };
}
