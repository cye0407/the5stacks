import { cn } from '@/lib/utils/cn';

export interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  milestones?: number[]; // e.g., [25, 50, 80]
}

export function ProgressBar({
  value,
  className,
  showLabel = false,
  size = 'md',
  milestones,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('relative w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className="h-full progress-gradient rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
        {milestones?.map((milestone) => (
          <div
            key={milestone}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-0.5 h-[120%]',
              clampedValue >= milestone ? 'bg-primary' : 'bg-white border border-primary'
            )}
            style={{ left: `${milestone}%` }}
          />
        ))}
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{clampedValue}% complete</span>
          {milestones && milestones.length > 0 && (
            <span className="text-xs text-gray-500">
              Next: {milestones.find((m) => m > clampedValue) ?? 'Complete'}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
