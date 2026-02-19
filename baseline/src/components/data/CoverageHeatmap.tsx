import { cn } from '@/lib/utils/cn';

export interface CoverageHeatmapProps {
  periods: string[];
  hasData: boolean[];
  className?: string;
}

export function CoverageHeatmap({ periods, hasData, className }: CoverageHeatmapProps) {
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {periods.map((period, i) => {
        const month = period.slice(5, 7);
        const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        const monthLabel = monthNames[parseInt(month, 10) - 1];

        return (
          <div
            key={period}
            className={cn(
              'w-7 h-7 rounded text-[10px] font-medium flex items-center justify-center transition-colors',
              hasData[i]
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-400'
            )}
            title={formatPeriodTitle(period)}
          >
            {monthLabel}
          </div>
        );
      })}
    </div>
  );
}

function formatPeriodTitle(period: string): string {
  const [year, month] = period.split('-');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}
