"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChartBar,
  Database,
  Export,
  ListChecks,
  MapPin,
  Target,
  TreeStructure,
} from '@phosphor-icons/react';
import { Button, Card } from '@/components/ui';
import { FtueChecklist } from '@/components/app/FtueChecklist';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { getDashboardInsights } from '@/lib/dashboardInsights';
import { seedMockData } from '@/lib/mockData';

function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    notation: amount >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: amount >= 10000 ? 1 : 0,
  }).format(amount);
}

export default function DashboardPage() {
  const company = useAppStore((state) => state.company);
  const sites = useAppStore((state) => state.sites);
  const setIsOnboardingComplete = useAppStore((state) => state.setIsOnboardingComplete);
  const dataStore = useDataStore();
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);

  const insights = useMemo(
    () =>
      getDashboardInsights({
        company,
        sites,
        materialInputs: dataStore.materialInputs,
        packagingInputs: dataStore.packagingInputs,
        energyElectricity: dataStore.energyElectricity,
        energyFuels: dataStore.energyFuels,
        energyWater: dataStore.energyWater,
        assets: dataStore.assets,
        transportLogs: dataStore.transportLogs,
        workforce: dataStore.workforce,
        healthSafety: dataStore.healthSafety,
        training: dataStore.training,
        waste: dataStore.waste,
        productOutputs: dataStore.productOutputs,
        directEmissions: dataStore.directEmissions,
        externalContext: dataStore.externalContext,
        financialContext: dataStore.financialContext,
        buyerRequirements: dataStore.buyerRequirements,
      }),
    [company, sites, dataStore]
  );

  const hasCompany = Boolean(company);
  const hasAnyData = insights.totalRecords > 0;

  const handleLoadDemo = () => {
    setIsSeedingDemo(true);
    seedMockData();
    setIsOnboardingComplete(true);
    setIsSeedingDemo(false);
  };

  if (!hasCompany && !hasAnyData) {
    return (
      <div className="animate-fade-in space-y-6">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-xl">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Product Preview
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                  Turn the baseline into something a buyer can understand in five minutes.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300">
                  Five Stacks should not feel like a tracker. It should feel like an operating system:
                  where money is leaking, what evidence is weak, and what to fix next.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleLoadDemo} isLoading={isSeedingDemo} size="lg">
                  Load demo company
                </Button>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center rounded-lg border border-white/20 px-7 py-3.5 text-base font-medium text-white transition-colors hover:bg-white/10"
                >
                  Set up my own company
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Step 1</div>
                <div className="mt-2 text-lg font-semibold">Surface tracked spend</div>
                <p className="mt-1 text-sm text-slate-300">Pull materials, utilities, waste, and site costs into one defensible view.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Step 2</div>
                <div className="mt-2 text-lg font-semibold">Prioritize margin leaks</div>
                <p className="mt-1 text-sm text-slate-300">Show where savings are most likely before another initiative gets funded.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Step 3</div>
                <div className="mt-2 text-lg font-semibold">Tie it to buyer pressure</div>
                <p className="mt-1 text-sm text-slate-300">Make the data usable in customer, lender, and procurement conversations.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Stack 1 in motion
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {company?.legalEntityName || 'Your Dashboard'}
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-gray-600">
              This view is about commercial signal, not record-keeping. It shows the cost base you have surfaced,
              where margin is likely escaping, and the next move that earns the next stack.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {!hasAnyData && (
            <Button onClick={handleLoadDemo} isLoading={isSeedingDemo} variant="secondary">
              Load demo data
            </Button>
          )}
          <Link
            href="/data"
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Enter data
          </Link>
        </div>
      </div>

      <FtueChecklist />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-0 bg-slate-950 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Tracked spend</div>
              <div className="mt-3 text-3xl font-bold">{formatCompactCurrency(insights.trackedSpend)}</div>
              <p className="mt-2 text-sm text-slate-300">Visible costs already surfaced from the current baseline.</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <ChartBar className="h-5 w-5 text-emerald-300" weight="duotone" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Recovered value</div>
              <div className="mt-3 text-3xl font-bold text-gray-900">{formatCompactCurrency(insights.recoveredValue)}</div>
              <p className="mt-2 text-sm text-gray-600">Value already captured from tracked discard streams.</p>
            </div>
            <div className="rounded-xl bg-primary-100 p-3">
              <Target className="h-5 w-5 text-primary" weight="duotone" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Data confidence</div>
              <div className="mt-3 text-3xl font-bold text-gray-900">{insights.dataConfidencePercent}%</div>
              <p className="mt-2 text-sm text-gray-600">How defensible the current evidence base is, weighted by record quality.</p>
            </div>
            <div className="rounded-xl bg-primary-100 p-3">
              <Database className="h-5 w-5 text-primary" weight="duotone" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Current focus</div>
              <div className="mt-3 text-xl font-bold text-gray-900">{insights.focusLabel}</div>
              <p className="mt-2 text-sm text-gray-600">{insights.focusDetail}</p>
            </div>
            <div className="rounded-xl bg-primary-100 p-3">
              <TreeStructure className="h-5 w-5 text-primary" weight="duotone" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-2xl border border-gray-200">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Where the money is likely hiding</h2>
              <p className="mt-1 text-sm text-gray-600">First-pass opportunities based on the records already in the baseline.</p>
            </div>
            <Link href="/360-view" className="text-sm font-medium text-primary hover:text-primary-dark">
              See full view
            </Link>
          </div>

          <div className="space-y-3">
            {insights.opportunities.map((opportunity) => (
              <div key={opportunity.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      {opportunity.stackLabel}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{opportunity.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{opportunity.summary}</p>
                    </div>
                  </div>
                  <div className="min-w-[12rem] rounded-xl bg-white p-3 lg:text-right">
                    <div className="text-sm font-semibold text-gray-900">{opportunity.amountLabel}</div>
                    <Link
                      href={opportunity.href}
                      className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark"
                    >
                      {opportunity.actionLabel}
                      <ArrowRight className="h-4 w-4" weight="bold" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-0 bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-100">Recommended next move</div>
              <div className="text-2xl font-bold">{insights.nextAction.title}</div>
              <p className="text-sm leading-6 text-emerald-50">{insights.nextAction.detail}</p>
              <Link
                href={insights.nextAction.href}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-gray-100"
              >
                {insights.nextAction.ctaLabel}
                <ArrowRight className="h-4 w-4" weight="bold" />
              </Link>
            </div>
          </Card>

          <Card className="rounded-2xl border border-gray-200">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Buyer readiness</div>
              <div className="text-xl font-bold text-gray-900">{insights.buyerReadiness.label}</div>
              <p className="text-sm leading-6 text-gray-600">{insights.buyerReadiness.detail}</p>
              <Link href="/data/context" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark">
                Strengthen external context
                <ArrowRight className="h-4 w-4" weight="bold" />
              </Link>
            </div>
          </Card>

          {insights.gaps.length > 0 && (
            <Card className="rounded-2xl border border-amber-200 bg-amber-50">
              <div className="space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-amber-700">Gaps blocking the product story</div>
                  <div className="mt-1 text-lg font-bold text-amber-950">Close these next</div>
                </div>
                <div className="space-y-3">
                  {insights.gaps.map((gap) => (
                    <div key={gap.id} className="rounded-xl bg-white/70 p-3">
                      <div className="font-semibold text-amber-950">{gap.title}</div>
                      <p className="mt-1 text-sm text-amber-900">{gap.detail}</p>
                      <Link href={gap.href} className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-900">
                        Fix this
                        <ArrowRight className="h-4 w-4" weight="bold" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="rounded-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2.5">
              <ChartBar className="h-5 w-5 text-primary" weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{insights.totalRecords}</div>
              <div className="text-xs text-gray-500">Total records</div>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2.5">
              <TreeStructure className="h-5 w-5 text-primary" weight="duotone" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{insights.domainsWithData}</span>
                <span className="text-sm text-gray-400">/ 8</span>
              </div>
              <div className="text-xs text-gray-500">Domains covered</div>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2.5">
              <MapPin className="h-5 w-5 text-primary" weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{sites.length}</div>
              <div className="text-xs text-gray-500">Sites tracked</div>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2.5">
              <Database className="h-5 w-5 text-primary" weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{insights.completenessPercent}%</div>
              <div className="text-xs text-gray-500">Baseline completeness</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/data" className="group">
          <Card className="rounded-2xl border-2 border-transparent transition-all hover:border-primary hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-stack-1 to-stack-3 p-3">
                <Database className="h-6 w-6 text-white" weight="duotone" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 transition-colors group-hover:text-primary">Enter Data</div>
                <div className="text-sm text-gray-500">Add stronger evidence where the current story is still thin.</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-primary" weight="bold" />
            </div>
          </Card>
        </Link>

        <Link href="/360-view" className="group">
          <Card className="rounded-2xl border-2 border-transparent transition-all hover:border-primary hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-stack-2 to-stack-4 p-3">
                <ListChecks className="h-6 w-6 text-white" weight="duotone" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 transition-colors group-hover:text-primary">Inspect The Full Baseline</div>
                <div className="text-sm text-gray-500">Audit the raw detail behind the signals shown here.</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-primary" weight="bold" />
            </div>
          </Card>
        </Link>

        <Link href="/exports" className="group">
          <Card className="rounded-2xl border-2 border-transparent transition-all hover:border-primary hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-stack-3 to-stack-4 p-3">
                <Export className="h-6 w-6 text-white" weight="duotone" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 transition-colors group-hover:text-primary">Export Evidence</div>
                <div className="text-sm text-gray-500">Turn the baseline into something usable outside the tool.</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-primary" weight="bold" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
