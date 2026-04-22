import type {
  Asset,
  BuyerRequirement,
  Company,
  DirectEmission,
  EnergyElectricity,
  EnergyFuel,
  EnergyWater,
  ExternalContext,
  FinancialContext,
  HealthSafety,
  MaterialInput,
  PackagingInput,
  ProductOutput,
  Site,
  Training,
  TransportLog,
  Waste,
  Workforce,
} from '@/types';

type ConfidenceLevel = 'high' | 'medium' | 'low';

type ConfidenceRecord = {
  confidence: ConfidenceLevel;
};

export interface DashboardInsightInput {
  company: Company | null;
  sites: Site[];
  materialInputs: MaterialInput[];
  packagingInputs: PackagingInput[];
  energyElectricity: EnergyElectricity[];
  energyFuels: EnergyFuel[];
  energyWater: EnergyWater[];
  assets: Asset[];
  transportLogs: TransportLog[];
  workforce: Workforce[];
  healthSafety: HealthSafety[];
  training: Training[];
  waste: Waste[];
  productOutputs: ProductOutput[];
  directEmissions: DirectEmission[];
  externalContext: ExternalContext | null;
  financialContext: FinancialContext | null;
  buyerRequirements: BuyerRequirement[];
}

export interface DashboardOpportunity {
  id: string;
  stackLabel: string;
  title: string;
  amount: number | null;
  amountLabel: string;
  summary: string;
  actionLabel: string;
  href: string;
}

export interface DashboardGap {
  id: string;
  title: string;
  detail: string;
  href: string;
}

export interface DashboardInsights {
  totalRecords: number;
  trackedSpend: number;
  recoveredValue: number;
  dataConfidencePercent: number;
  domainsWithData: number;
  completenessPercent: number;
  focusLabel: string;
  focusDetail: string;
  opportunities: DashboardOpportunity[];
  gaps: DashboardGap[];
  nextAction: {
    title: string;
    detail: string;
    href: string;
    ctaLabel: string;
  };
  buyerReadiness: {
    label: string;
    detail: string;
  };
}

function sum(values: Array<number | undefined>): number {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? Number(value) : 0), 0);
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: amount >= 1000 ? 0 : 2,
  }).format(amount);
}

function confidencePercent(records: ConfidenceRecord[]): number {
  if (records.length === 0) return 0;
  const weighted = records.reduce((total, record) => {
    if (record.confidence === 'high') return total + 1;
    if (record.confidence === 'medium') return total + 0.6;
    return total + 0.25;
  }, 0);

  return Math.round((weighted / records.length) * 100);
}

function buildBuyerReadiness(input: DashboardInsightInput): DashboardInsights['buyerReadiness'] {
  const requirementCount = input.buyerRequirements.length;

  if (requirementCount > 0) {
    return {
      label: `${requirementCount} buyer request${requirementCount === 1 ? '' : 's'} tracked`,
      detail: 'You already have external pressure recorded, which makes prioritization easier.',
    };
  }

  if (input.externalContext || input.financialContext) {
    return {
      label: 'Commercial context captured',
      detail: 'Add live buyer requests next so the baseline translates into revenue protection.',
    };
  }

  return {
    label: 'No buyer pressure mapped yet',
    detail: 'The product is strongest when it ties operational data to real customer or lender asks.',
  };
}

export function getDashboardInsights(input: DashboardInsightInput): DashboardInsights {
  const domainCounts = {
    materials: input.materialInputs.length,
    packaging: input.packagingInputs.length,
    energy: input.energyElectricity.length + input.energyFuels.length + input.energyWater.length,
    infrastructure: input.assets.length + input.sites.length,
    transport: input.transportLogs.length,
    workforce: input.workforce.length + input.healthSafety.length + input.training.length,
    outputs: input.waste.length + input.productOutputs.length + input.directEmissions.length,
    context: (input.externalContext ? 1 : 0) + (input.financialContext ? 1 : 0) + input.buyerRequirements.length,
  };

  const totalRecords = Object.values(domainCounts).reduce((total, count) => total + count, 0);
  const domainsWithData = Object.values(domainCounts).filter((count) => count > 0).length;
  const completenessPercent = pct(domainsWithData, 8);

  const trackedSpend =
    sum(input.materialInputs.map((record) => record.cost)) +
    sum(input.packagingInputs.map((record) => record.cost)) +
    sum(input.energyElectricity.map((record) => record.cost)) +
    sum(input.energyFuels.map((record) => record.cost)) +
    sum(input.energyWater.map((record) => record.cost)) +
    sum(input.waste.map((record) => record.cost)) +
    sum(input.assets.map((record) => record.replacementCost));

  const recoveredValue = sum(input.waste.map((record) => record.revenue));
  const totalOutputRevenue = sum(input.productOutputs.map((record) => record.revenue));
  const energySpend =
    sum(input.energyElectricity.map((record) => record.cost)) +
    sum(input.energyFuels.map((record) => record.cost)) +
    sum(input.energyWater.map((record) => record.cost));
  const materialsSpend = sum(input.materialInputs.map((record) => record.cost));
  const wasteSpend = sum(input.waste.map((record) => record.cost));
  const landfillKg = input.waste
    .filter((record) => record.disposalRoute === 'landfill')
    .reduce((total, record) => total + record.quantityKg, 0);
  const recyclableRevenue = input.waste
    .filter((record) => record.disposalRoute === 'recycling')
    .reduce((total, record) => total + (record.revenue ?? 0), 0);
  const avgRecycledContent =
    input.materialInputs.length > 0
      ? input.materialInputs.reduce((total, record) => total + (record.recycledContentPercent ?? 0), 0) /
        input.materialInputs.length
      : 0;
  const transportSpendCoverage = input.transportLogs.filter((record) => Number.isFinite(record.spend)).length;

  const qualityRecords: ConfidenceRecord[] = [
    ...input.materialInputs,
    ...input.packagingInputs,
    ...input.energyElectricity,
    ...input.energyFuels,
    ...input.energyWater,
    ...input.transportLogs,
    ...input.workforce,
    ...input.healthSafety,
    ...input.training,
    ...input.waste,
    ...input.productOutputs,
    ...input.directEmissions,
  ];

  const dataConfidencePercent = confidencePercent(qualityRecords);

  const opportunities: DashboardOpportunity[] = [];

  if (energySpend > 0) {
    const estimate = energySpend * 0.08;
    opportunities.push({
      id: 'energy',
      stackLabel: 'Stack 2',
      title: 'Reduce utility leakage',
      amount: estimate,
      amountLabel: `${formatCurrency(estimate)} first-pass savings estimate`,
      summary: `${formatCurrency(energySpend)} in tracked utility spend is already visible in the baseline.`,
      actionLabel: 'Review energy records',
      href: '/data/energy',
    });
  }

  if (wasteSpend > 0 || landfillKg > 0 || recyclableRevenue > 0) {
    const estimate = wasteSpend + landfillKg * 0.05;
    opportunities.push({
      id: 'waste',
      stackLabel: 'Stack 3',
      title: 'Recover margin from discard streams',
      amount: estimate,
      amountLabel: `${formatCurrency(estimate)} value in play`,
      summary: `${formatCurrency(wasteSpend)} in disposal cost and ${formatCurrency(recyclableRevenue)} already recovered from recyclables.`,
      actionLabel: 'Inspect output data',
      href: '/data/outputs',
    });
  }

  if (materialsSpend > 0) {
    const estimate = materialsSpend * (avgRecycledContent >= 40 ? 0.015 : 0.03);
    opportunities.push({
      id: 'materials',
      stackLabel: 'Stack 2',
      title: 'Tighten material purchasing and yield',
      amount: estimate,
      amountLabel: `${formatCurrency(estimate)} procurement improvement estimate`,
      summary: `${formatCurrency(materialsSpend)} in tracked material spend with ${Math.round(avgRecycledContent)}% average recycled content.`,
      actionLabel: 'Review materials',
      href: '/data/materials',
    });
  }

  if (input.transportLogs.length > 0 && transportSpendCoverage === 0) {
    opportunities.push({
      id: 'transport',
      stackLabel: 'Stack 1',
      title: 'Price your logistics exposure',
      amount: null,
      amountLabel: 'No freight spend captured yet',
      summary: 'Transport activity exists, but without spend data you cannot see margin drag or carrier leverage.',
      actionLabel: 'Complete transport data',
      href: '/data/transport',
    });
  }

  if (input.buyerRequirements.length === 0) {
    opportunities.push({
      id: 'buyer',
      stackLabel: 'Stack 4',
      title: 'Map external pressure before it becomes urgent',
      amount: null,
      amountLabel: 'Commercial risk not yet quantified',
      summary: 'Track buyer, lender, and certification asks so the baseline supports real sales and compliance conversations.',
      actionLabel: 'Add context',
      href: '/data/context',
    });
  }

  opportunities.sort((left, right) => (right.amount ?? -1) - (left.amount ?? -1));

  const gaps: DashboardGap[] = [];

  if (domainCounts.context === 0) {
    gaps.push({
      id: 'context',
      title: 'Commercial context is missing',
      detail: 'Without buyer and financial pressure, the product cannot rank which fixes matter most.',
      href: '/data/context',
    });
  }

  if (domainCounts.energy === 0) {
    gaps.push({
      id: 'energy',
      title: 'Energy costs are still invisible',
      detail: 'Energy is usually one of the fastest places to prove savings and fund the next stack.',
      href: '/data/energy',
    });
  }

  if (domainCounts.outputs === 0) {
    gaps.push({
      id: 'outputs',
      title: 'No waste or output data yet',
      detail: 'Margin recovery depends on seeing what leaves the site and what it costs.',
      href: '/data/outputs',
    });
  }

  if (dataConfidencePercent < 70 && qualityRecords.length > 0) {
    gaps.push({
      id: 'confidence',
      title: 'Evidence quality is still soft',
      detail: `${dataConfidencePercent}% confidence means the baseline is directionally useful, but not yet highly defensible.`,
      href: '/360-view',
    });
  }

  if (input.sites.length === 0) {
    gaps.push({
      id: 'sites',
      title: 'No sites configured',
      detail: 'You need at least one operating site before cost leaks can be localized.',
      href: '/onboarding/site',
    });
  }

  let focusLabel = 'Stack 1: Defensible baseline';
  let focusDetail = 'Capture enough operational reality that decisions stop relying on guesswork.';

  if (completenessPercent >= 60 && opportunities[0]?.id === 'energy') {
    focusLabel = 'Stack 2: Operational efficiency';
    focusDetail = 'You have enough data to start prioritizing utility and process leaks.';
  } else if (completenessPercent >= 60 && opportunities[0]?.id === 'waste') {
    focusLabel = 'Stack 3: Margin recovery';
    focusDetail = 'The baseline is showing discard streams that can be turned into usable value.';
  } else if (input.buyerRequirements.length > 0 && completenessPercent >= 50) {
    focusLabel = 'Stack 4: Structural resilience';
    focusDetail = 'You can now connect internal performance with external requirements and risk.';
  }

  let nextAction: DashboardInsights['nextAction'];

  if (gaps.length > 0) {
    nextAction = {
      title: gaps[0].title,
      detail: gaps[0].detail,
      href: gaps[0].href,
      ctaLabel: 'Close this gap',
    };
  } else if (opportunities.length > 0) {
    nextAction = {
      title: opportunities[0].title,
      detail: `${opportunities[0].summary} Start here before adding more initiatives.`,
      href: opportunities[0].href,
      ctaLabel: opportunities[0].actionLabel,
    };
  } else {
    nextAction = {
      title: 'Add the next month of data',
      detail: 'The product gets stronger when the baseline becomes a live operating rhythm, not a one-time exercise.',
      href: '/data',
      ctaLabel: 'Enter data',
    };
  }

  if (totalOutputRevenue > 0 && recoveredValue > 0 && opportunities.length > 0) {
    opportunities[0] = {
      ...opportunities[0],
      summary: `${opportunities[0].summary} ${formatCurrency(totalOutputRevenue)} in tracked output revenue gives you a stronger margin context.`,
    };
  }

  return {
    totalRecords,
    trackedSpend,
    recoveredValue,
    dataConfidencePercent,
    domainsWithData,
    completenessPercent,
    focusLabel,
    focusDetail,
    opportunities: opportunities.slice(0, 3),
    gaps: gaps.slice(0, 3),
    nextAction,
    buyerReadiness: buildBuyerReadiness(input),
  };
}
