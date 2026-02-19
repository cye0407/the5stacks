// Tracking utility functions

export interface TimeSeriesCoverage {
  periodsWithData: string[];
  periodsMissing: string[];
  oldestData: string;
  newestData: string;
  coveragePercent: number;
}

export interface DataQualityBreakdown {
  high: number;
  medium: number;
  low: number;
  noData: number;
  total: number;
}

export interface DomainMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  comparison?: string;
}

export interface TrackingData {
  metrics: DomainMetric[];
  coverage: TimeSeriesCoverage;
  quality: DataQualityBreakdown;
  recommendations: string[];
}

/**
 * Get last N months as period strings (YYYY-MM format)
 */
export function getLast12Months(): string[] {
  const periods: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(d.toISOString().slice(0, 7));
  }
  return periods;
}

/**
 * Get current period as YYYY-MM string
 */
export function getCurrentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Calculate time series coverage for entries with a period field
 */
export function calculateCoverage<T extends { period: string }>(
  entries: T[],
  targetPeriods: string[]
): TimeSeriesCoverage {
  const periodsWithData = [...new Set(entries.map(e => e.period))].filter(p => targetPeriods.includes(p));
  const periodsMissing = targetPeriods.filter(p => !periodsWithData.includes(p));
  const allPeriods = [...new Set(entries.map(e => e.period))].sort();

  return {
    periodsWithData: periodsWithData.sort(),
    periodsMissing,
    oldestData: allPeriods[0] || 'N/A',
    newestData: allPeriods[allPeriods.length - 1] || 'N/A',
    coveragePercent: targetPeriods.length > 0
      ? Math.round((periodsWithData.length / targetPeriods.length) * 100)
      : 0
  };
}

/**
 * Calculate data quality breakdown based on confidence levels
 */
export function calculateQuality<T extends { confidence?: string }>(
  entries: T[]
): DataQualityBreakdown {
  const high = entries.filter(e => e.confidence === 'high').length;
  const medium = entries.filter(e => e.confidence === 'medium').length;
  const low = entries.filter(e => e.confidence === 'low').length;
  const noData = entries.filter(e => !e.confidence || e.confidence === 'none').length;

  return { high, medium, low, noData, total: entries.length };
}

/**
 * Generate common recommendations based on coverage and quality
 */
export function generateBaseRecommendations<T extends { confidence?: string; period: string }>(
  entries: T[],
  targetPeriods: string[],
  domainName: string
): string[] {
  const recommendations: string[] = [];

  if (entries.length === 0) {
    recommendations.push(`Start adding ${domainName} data to build your baseline.`);
    return recommendations;
  }

  const coverage = calculateCoverage(entries, targetPeriods);
  const quality = calculateQuality(entries);

  // Coverage recommendations
  if (coverage.coveragePercent < 25) {
    recommendations.push(`Only ${coverage.coveragePercent}% of the last 12 months have data. Consider backfilling historical data.`);
  } else if (coverage.coveragePercent < 50) {
    const missingFormatted = coverage.periodsMissing.slice(0, 3).map(formatPeriod).join(', ');
    recommendations.push(`Fill data gaps for: ${missingFormatted}${coverage.periodsMissing.length > 3 ? ` (+${coverage.periodsMissing.length - 3} more)` : ''}`);
  }

  // Quality recommendations
  const lowQualityPercent = Math.round(((quality.low + quality.noData) / Math.max(quality.total, 1)) * 100);
  if (lowQualityPercent > 30) {
    recommendations.push(`${lowQualityPercent}% of entries have low confidence. Verify data sources where possible.`);
  }

  // Staleness recommendations
  const threeMonthsAgo = targetPeriods.slice(-3)[0];
  if (threeMonthsAgo && !coverage.periodsWithData.some(p => p >= threeMonthsAgo)) {
    recommendations.push('Data is more than 3 months old. Add recent entries to keep your baseline current.');
  }

  return recommendations;
}

/**
 * Format period string for display (YYYY-MM -> "Jan 2024")
 */
export function formatPeriod(period: string): string {
  if (!period || period === 'N/A') return period;
  const [year, month] = period.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Calculate percentage safely
 */
export function safePercent(numerator: number, denominator: number, decimals = 1): string {
  if (denominator === 0) return '0';
  return ((numerator / denominator) * 100).toFixed(decimals);
}

/**
 * Get trend based on comparing two values
 */
export function getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const threshold = 0.05; // 5% change threshold
  const change = previous > 0 ? (current - previous) / previous : 0;
  if (change > threshold) return 'up';
  if (change < -threshold) return 'down';
  return 'stable';
}

/**
 * Group entries by period and sum a numeric field
 */
export function sumByPeriod<T extends { period: string }>(
  entries: T[],
  field: keyof T
): Record<string, number> {
  return entries.reduce((acc, entry) => {
    const period = entry.period;
    const value = entry[field];
    if (typeof value === 'number') {
      acc[period] = (acc[period] || 0) + value;
    }
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get sparkline data for last N periods
 */
export function getSparklineData(
  periodSums: Record<string, number>,
  periods: string[],
  lastN = 6
): number[] {
  return periods.slice(-lastN).map(p => periodSums[p] || 0);
}
