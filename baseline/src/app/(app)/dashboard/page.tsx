"use client";

import Link from 'next/link';
import {
  Database,
  Export,
  ListChecks,
  ArrowRight,
  ChartBar,
  MapPin,
  TreeStructure,
  Plant,
  Cow,
  Grains,
  Drop,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { isAgriculturalIndustry } from '@/lib/utils/industry';
import { FtueChecklist } from '@/components/app/FtueChecklist';

// Helper to format numbers
function formatNumber(n: number): string {
  if (n === 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function DashboardPage() {
  const { company, sites } = useAppStore();
  const {
    materialInputs,
    packagingInputs,
    energyElectricity,
    energyFuels,
    energyWater,
    assets,
    transportLogs,
    workforce,
    healthSafety,
    training,
    waste,
    productOutputs,
    directEmissions,
    externalContext,
    financialContext,
    landUse,
    fertiliserApplications,
    livestockRecords,
    cropOutputs,
  } = useDataStore();

  const isAg = isAgriculturalIndustry(company?.industryCode);

  // Domain record counts
  const domainCounts = {
    materials: materialInputs.length + (isAg ? fertiliserApplications.length : 0),
    packaging: packagingInputs.length,
    energy: energyElectricity.length + energyFuels.length + energyWater.length,
    infrastructure: assets.length + sites.length + (isAg ? landUse.length : 0),
    transport: transportLogs.length,
    workforce: workforce.length + healthSafety.length + training.length,
    outputs: waste.length + productOutputs.length + directEmissions.length + (isAg ? cropOutputs.length + livestockRecords.length : 0),
    context: (externalContext ? 1 : 0) + (financialContext ? 1 : 0),
  };

  const totalRecords = Object.values(domainCounts).reduce((sum, c) => sum + c, 0);
  const domainsWithData = Object.values(domainCounts).filter(c => c > 0).length;
  const completenessPercent = Math.round((domainsWithData / 8) * 100);

  // Find the first domain with 0 records for the "what to do next" nudge
  const domainLabels: Record<string, { label: string; path: string }> = {
    materials: { label: 'Materials', path: '/data/materials' },
    packaging: { label: 'Packaging', path: '/data/packaging' },
    energy: { label: 'Energy', path: '/data/energy' },
    infrastructure: { label: 'Infrastructure', path: '/data/infrastructure' },
    transport: { label: 'Transport', path: '/data/transport' },
    workforce: { label: 'Workforce', path: '/data/workforce' },
    outputs: { label: 'Outputs', path: '/data/outputs' },
    context: { label: 'Context', path: '/data/context' },
  };
  const emptyDomain = Object.entries(domainCounts).find(([, count]) => count === 0);

  // Agricultural quick stats
  const totalLandHa = landUse.reduce((sum, l) => sum + l.areaHa, 0);
  const totalLivestock = livestockRecords.reduce((sum, l) => sum + l.headcount, 0);
  const totalCropHa = cropOutputs.reduce((sum, c) => sum + c.areaHa, 0);
  const totalFertiliserKg = fertiliserApplications.reduce((sum, f) => sum + f.quantityKg, 0);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Section A: Company Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-stack-3 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg">
            {company?.legalEntityName?.charAt(0)?.toUpperCase() || 'E'}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {company?.legalEntityName || 'Your Dashboard'}
          </h1>
          <p className="text-sm text-gray-500">
            {[company?.industryDescription, company?.headquartersCountry].filter(Boolean).join(' · ') || 'Complete onboarding to set up your company'}
          </p>
        </div>
      </div>

      {/* FTUE Checklist */}
      <FtueChecklist />

      {/* Section B: Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <ChartBar className="w-5 h-5 text-primary" weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(totalRecords)}</div>
              <div className="text-xs text-gray-500">Total records</div>
            </div>
          </div>
        </Card>

        <Card className="!p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stack-3/10 flex items-center justify-center">
              <TreeStructure className="w-5 h-5 text-stack-3" weight="duotone" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{domainsWithData}</span>
                <span className="text-sm text-gray-400">/ 8</span>
              </div>
              <div className="text-xs text-gray-500">Domains covered</div>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-stack-3 to-primary rounded-full transition-all duration-500"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
        </Card>

        <Card className="!p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stack-4/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-stack-4" weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{sites.length}</div>
              <div className="text-xs text-gray-500">Sites tracked</div>
            </div>
          </div>
        </Card>

        <Card className="!p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stack-1/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-stack-1" weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{completenessPercent}%</div>
              <div className="text-xs text-gray-500">Completeness</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Section C: Agricultural Quick Stats (ag users only) */}
      {isAg && (totalLandHa > 0 || totalLivestock > 0 || totalCropHa > 0 || totalFertiliserKg > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Farm Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="!p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <Plant className="w-5 h-5 text-green-600" weight="duotone" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{formatNumber(totalLandHa)}</div>
                  <div className="text-xs text-gray-500">Land area (ha)</div>
                </div>
              </div>
            </Card>

            <Card className="!p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Cow className="w-5 h-5 text-amber-600" weight="duotone" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{formatNumber(totalLivestock)}</div>
                  <div className="text-xs text-gray-500">Livestock (head)</div>
                </div>
              </div>
            </Card>

            <Card className="!p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Grains className="w-5 h-5 text-emerald-600" weight="duotone" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{formatNumber(totalCropHa)}</div>
                  <div className="text-xs text-gray-500">Crop area (ha)</div>
                </div>
              </div>
            </Card>

            <Card className="!p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Drop className="w-5 h-5 text-blue-600" weight="duotone" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{formatNumber(totalFertiliserKg)}</div>
                  <div className="text-xs text-gray-500">Fertiliser (kg)</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Section D: What to do next */}
      <Card className="!p-5 rounded-xl border-l-4 border-l-primary bg-primary-100/30">
        {emptyDomain ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">
                Get started with {domainLabels[emptyDomain[0]].label}
              </p>
              <p className="text-sm text-gray-600">
                No data yet — add your first entry to improve your baseline coverage.
              </p>
            </div>
            <Link
              href={domainLabels[emptyDomain[0]].path}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm shrink-0"
            >
              Add data
              <ArrowRight className="w-4 h-4" weight="bold" />
            </Link>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-gray-900">All domains covered</p>
            <p className="text-sm text-gray-600">
              Keep adding monthly records to build a comprehensive baseline.
            </p>
          </div>
        )}
      </Card>

      {/* Section E: Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/data" className="group">
          <Card className="!p-5 rounded-xl border-2 border-transparent hover:border-primary transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stack-1 to-stack-3 flex items-center justify-center">
                <Database className="w-6 h-6 text-white" weight="duotone" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">Enter Data</div>
                <div className="text-sm text-gray-500">Add records across all domains</div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" weight="bold" />
            </div>
          </Card>
        </Link>

        <Link href="/360-view" className="group">
          <Card className="!p-5 rounded-xl border-2 border-transparent hover:border-primary transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stack-2 to-stack-4 flex items-center justify-center">
                <ListChecks className="w-6 h-6 text-white" weight="duotone" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">360 View</div>
                <div className="text-sm text-gray-500">See all your data in one place</div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" weight="bold" />
            </div>
          </Card>
        </Link>

        <Link href="/exports" className="group">
          <Card className="!p-5 rounded-xl border-2 border-transparent hover:border-primary transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stack-3 to-stack-4 flex items-center justify-center">
                <Export className="w-6 h-6 text-white" weight="duotone" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">View Exports</div>
                <div className="text-sm text-gray-500">Download your data</div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" weight="bold" />
            </div>
          </Card>
        </Link>
      </div>

    </div>
  );
}
