"use client";

import { type ReactNode, type ComponentType } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from './Button';
import type { IconProps } from '@phosphor-icons/react';

export interface EmptyStateProps {
  icon?: ReactNode | ComponentType<IconProps>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  // Alternative action props for convenience
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  // Determine if icon is a component or a ReactNode
  const renderIcon = () => {
    if (!icon) return null;

    // Check if it's a component (function or forwardRef)
    // Lucide icons are forwardRef components, so we check for $$typeof or function
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
      const IconComponent = icon as ComponentType<IconProps>;
      return <IconComponent className="w-12 h-12 text-gray-300 mx-auto" weight="duotone" />;
    }

    // Otherwise treat as ReactNode
    return icon;
  };

  // Support both action object and actionLabel/onAction props
  const finalAction = action || (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : null);

  return (
    <div className={cn('text-center py-12 px-6', className)}>
      {icon && (
        <div className="mb-4">{renderIcon()}</div>
      )}
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {finalAction && (
        <Button onClick={finalAction.onClick}>{finalAction.label}</Button>
      )}
    </div>
  );
}
