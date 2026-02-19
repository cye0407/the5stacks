"use client";

import Link from 'next/link';
import {
  MapPin,
  Target,
  Flag,
  Database,
  Export,
  CheckCircle,
  X,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';

interface FtueItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  isComplete: () => boolean;
}

export function FtueChecklist() {
  const { sites, swot, goals, ftue, dismissFtueItem, dismissAllFtue } = useAppStore();
  const dataStore = useDataStore();

  // Check if any domain has data entered
  const hasAnyData =
    dataStore.materialInputs.length > 0 ||
    dataStore.packagingInputs.length > 0 ||
    dataStore.energyElectricity.length > 0 ||
    dataStore.energyFuels.length > 0 ||
    dataStore.energyWater.length > 0 ||
    dataStore.assets.length > 0 ||
    dataStore.transportLogs.length > 0 ||
    dataStore.workforce.length > 0 ||
    dataStore.waste.length > 0 ||
    dataStore.productOutputs.length > 0 ||
    dataStore.directEmissions.length > 0;

  const items: FtueItem[] = [
    {
      id: 'add-site',
      label: 'Add your first site',
      description: 'Define where your organisation operates',
      href: '/onboarding/site',
      icon: MapPin,
      isComplete: () => sites.length > 0,
    },
    {
      id: 'complete-swot',
      label: 'Complete your SWOT analysis',
      description: 'Prepares you for Stack 2 strategic assessment',
      href: '/onboarding/swot',
      icon: Target,
      isComplete: () => swot !== null,
    },
    {
      id: 'set-goals',
      label: 'Set your sustainability goals',
      description: 'Define what success looks like',
      href: '/onboarding/goals',
      icon: Flag,
      isComplete: () => goals !== null,
    },
    {
      id: 'enter-data',
      label: 'Enter your first data',
      description: 'Start building your operational baseline',
      href: '/data',
      icon: Database,
      isComplete: () => hasAnyData,
    },
    {
      id: 'explore-exports',
      label: 'Explore exports',
      description: 'See how your data turns into reports',
      href: '/exports',
      icon: Export,
      isComplete: () => false, // dismiss-only
    },
  ];

  // If user dismissed all, don't render
  if (ftue.dismissedAll) return null;

  // Filter out dismissed or completed items
  const visibleItems = items.filter(
    (item) => !ftue.dismissedItems.includes(item.id) && !item.isComplete()
  );

  // Count completed items (not dismissed, actually completed)
  const completedCount = items.filter((item) => item.isComplete()).length;

  // If all visible items are done/dismissed, hide the whole card
  if (visibleItems.length === 0) return null;

  return (
    <Card className="!p-5 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Getting Started</h2>
          <p className="text-sm text-gray-500">
            {completedCount} of {items.length} complete
          </p>
        </div>
        <button
          onClick={dismissAllFtue}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Dismiss all
        </button>
      </div>

      <div className="space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-gray-500" weight="duotone" />
              </div>
              <Link
                href={item.href}
                className="flex-1 min-w-0"
              >
                <div className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                  {item.label}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {item.description}
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  dismissFtueItem(item.id);
                }}
                className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
                aria-label={`Dismiss ${item.label}`}
              >
                <X className="w-3.5 h-3.5" weight="bold" />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
