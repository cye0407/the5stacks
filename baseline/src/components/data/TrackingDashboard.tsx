"use client";

import { useState } from 'react';
import { CaretDown, CaretUp, ChartBar } from '@phosphor-icons/react';
import { cn } from '@/lib/utils/cn';

export interface TrackingDashboardProps {
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function TrackingDashboard({
  children,
  defaultExpanded = false,
  className
}: TrackingDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('bg-gray-50 rounded-xl border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChartBar className="w-4 h-4 text-primary" weight="duotone" />
          <span className="font-medium text-gray-900 text-sm">Tracking Dashboard</span>
        </div>
        {isExpanded ? (
          <CaretUp className="w-4 h-4 text-gray-500" weight="bold" />
        ) : (
          <CaretDown className="w-4 h-4 text-gray-500" weight="bold" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-slide-up">
          {children}
        </div>
      )}
    </div>
  );
}
