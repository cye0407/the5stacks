"use client";

import { cn } from '@/lib/utils/cn';
import { CheckCircle2, AlertCircle, HelpCircle, XCircle } from 'lucide-react';

export interface BadgeProps {
  variant?: 'default' | 'high' | 'medium' | 'low' | 'none' | 'complete' | 'draft' | 'due' | 'overdue' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  onClick?: () => void;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
  showIcon = true,
  onClick,
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    high: 'bg-primary-100 text-primary',
    medium: 'bg-warning-light text-warning',
    low: 'bg-error-light text-error',
    none: 'bg-gray-100 text-gray-500',
    complete: 'bg-primary-100 text-primary',
    draft: 'bg-gray-100 text-gray-500',
    due: 'bg-warning-light text-warning',
    overdue: 'bg-error-light text-error',
    info: 'bg-accent-light text-accent',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
  };

  const icons = {
    default: null,
    high: <CheckCircle2 className="w-3 h-3" />,
    medium: <AlertCircle className="w-3 h-3" />,
    low: <HelpCircle className="w-3 h-3" />,
    none: <XCircle className="w-3 h-3" />,
    complete: <CheckCircle2 className="w-3 h-3" />,
    draft: null,
    due: <AlertCircle className="w-3 h-3" />,
    overdue: <XCircle className="w-3 h-3" />,
    info: null,
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded',
        variants[variant],
        sizes[size],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
    >
      {showIcon && icons[variant]}
      {children}
    </Component>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return <Badge variant={confidence}>{labels[confidence]}</Badge>;
}

export function StatusBadge({ status }: { status: 'complete' | 'draft' | 'due' | 'overdue' }) {
  const labels = {
    complete: 'Complete',
    draft: 'Draft',
    due: 'Due Soon',
    overdue: 'Overdue',
  };

  return <Badge variant={status}>{labels[status]}</Badge>;
}
