import type { Workforce, HealthSafety, Training } from '@/types';
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

export interface WorkforceTrackingData extends TrackingData {
  fteSparkline: number[];
}

export function calculateWorkforceMetrics(
  workforce: Workforce[],
  healthSafety: HealthSafety[],
  training: Training[]
): WorkforceTrackingData {
  const targetPeriods = getLast12Months();

  // Get latest period data for current metrics
  const sortedEntries = [...workforce].sort((a, b) =>
    b.period.localeCompare(a.period)
  );
  const latestEntry = sortedEntries[0];
  const latestSafety = [...healthSafety].sort((a, b) => b.period.localeCompare(a.period))[0];

  // Calculate totals
  const latestFte = latestEntry?.totalFte || 0;
  const latestContractors = latestEntry?.contractors || 0;
  const totalWorkforce = latestFte + latestContractors;

  // Safety metrics (latest)
  const trir = latestSafety?.trir;
  const ltir = latestSafety?.ltir;

  // Training metrics
  const totalTrainingHours = training.reduce((sum, t) => sum + (t.totalTrainingHours || 0), 0);
  const avgTrainingPerFte = latestFte > 0 && totalTrainingHours > 0
    ? totalTrainingHours / latestFte
    : 0;

  // Sparkline data
  const fteSums = sumByPeriod(workforce, 'totalFte' as keyof Workforce);
  const fteSparkline = getSparklineData(fteSums, targetPeriods);

  // Build metrics
  const metrics: DomainMetric[] = [
    {
      label: 'Total FTE',
      value: formatNumber(latestFte),
      unit: 'employees',
      trend: fteSparkline.length >= 2
        ? getTrend(fteSparkline[fteSparkline.length - 1], fteSparkline[fteSparkline.length - 2])
        : undefined
    },
    {
      label: 'Contractors',
      value: formatNumber(latestContractors),
      unit: 'people'
    },
    {
      label: 'TRIR',
      value: trir !== undefined ? trir.toFixed(2) : 'N/A',
      unit: trir !== undefined ? 'per 200k hrs' : ''
    },
    {
      label: 'Training',
      value: avgTrainingPerFte > 0 ? avgTrainingPerFte.toFixed(1) : 'N/A',
      unit: avgTrainingPerFte > 0 ? 'hrs/FTE' : ''
    },
    {
      label: 'LTIR',
      value: ltir !== undefined ? ltir.toFixed(2) : 'N/A',
      unit: ltir !== undefined ? 'per 200k hrs' : ''
    }
  ];

  // Combine all for coverage/quality
  const allEntries = [...workforce, ...healthSafety, ...training];
  const coverage = calculateCoverage(allEntries, targetPeriods);
  const quality = calculateQuality(allEntries);

  // Generate recommendations
  const recommendations = generateBaseRecommendations(allEntries, targetPeriods, 'workforce');

  // Domain-specific recommendations
  if (trir !== undefined && trir > 2.0) {
    recommendations.push(`TRIR of ${trir.toFixed(2)} is above industry benchmark. Review safety programs.`);
  }

  if (avgTrainingPerFte < 20 && training.length > 0) {
    recommendations.push(`Training averages ${avgTrainingPerFte.toFixed(1)} hrs/FTE. Consider increasing to 40+ hours annually.`);
  }

  if (latestContractors > latestFte * 0.3 && totalWorkforce > 0) {
    recommendations.push('Contractor ratio >30%. Consider direct employment for core roles.');
  }

  if (ltir === undefined && workforce.length > 0) {
    recommendations.push('LTIR not tracked. Add lost-time injury rate for safety reporting.');
  }

  if (healthSafety.length === 0 && workforce.length > 0) {
    recommendations.push('No health & safety data logged. Add incident tracking for compliance.');
  }

  return {
    metrics,
    coverage,
    quality,
    recommendations,
    fteSparkline
  };
}
