import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  comparison?: string;
  sparkline?: number[];
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  trend,
  comparison,
  sparkline,
  className
}: MetricCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-4', className)}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>

      {sparkline && sparkline.length > 0 && (
        <div className="h-8 mt-3">
          <Sparkline data={sparkline} />
        </div>
      )}

      {(trend || comparison) && (
        <div className="flex items-center gap-1 mt-2">
          {trend && (
            <span className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-error' : 'text-gray-500'
            )}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
               trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
            </span>
          )}
          {comparison && <span className="text-xs text-gray-500">{comparison}</span>}
        </div>
      )}
    </div>
  );
}

// Simple sparkline component using SVG
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const width = 100;
  const height = 24;
  const padding = 2;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <polyline
        fill="none"
        stroke="#4AA88C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* Last point dot */}
      {data.length > 0 && (
        <circle
          cx={padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)}
          cy={height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)}
          r="3"
          fill="#4AA88C"
        />
      )}
    </svg>
  );
}
