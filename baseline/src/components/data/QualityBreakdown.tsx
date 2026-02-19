import { cn } from '@/lib/utils/cn';

export interface QualityBreakdownProps {
  high: number;
  medium: number;
  low: number;
  noData: number;
  className?: string;
}

const segments = [
  { key: 'high', color: '#4AA88C', label: 'High' },
  { key: 'medium', color: '#D97706', label: 'Medium' },
  { key: 'low', color: '#DC2626', label: 'Low' },
  { key: 'noData', color: '#E5E7EB', label: 'No data' },
] as const;

export function QualityBreakdown({ high, medium, low, noData, className }: QualityBreakdownProps) {
  const total = high + medium + low + noData;

  if (total === 0) {
    return (
      <div className={cn('text-sm text-gray-500', className)}>
        No data to analyze
      </div>
    );
  }

  const values = { high, medium, low, noData };

  return (
    <div className={className}>
      {/* Segmented bar */}
      <div className="flex h-3 rounded-full overflow-hidden">
        {segments.map((seg) => {
          const value = values[seg.key];
          if (value === 0) return null;
          return (
            <div
              key={seg.key}
              style={{
                width: `${(value / total) * 100}%`,
                backgroundColor: seg.color
              }}
              className="transition-all duration-300"
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-600">
        {segments.map((seg) => {
          const value = values[seg.key];
          if (value === 0) return null;
          const percent = Math.round((value / total) * 100);
          return (
            <span key={seg.key} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span>{seg.label}: {value} ({percent}%)</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
