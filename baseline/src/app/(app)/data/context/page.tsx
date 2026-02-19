"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { GlobeHemisphereWest, CurrencyDollar, Check, ArrowLeft, ChartBar } from '@phosphor-icons/react';
import {
  Card,
  CardTitle,
  Button,
  Input,
  Select,
  Badge,
} from '@/components/ui';
import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils/cn';
import type {
  ExternalContext,
  FinancialContext,
  MarketScope,
  CustomerType,
  ConcentrationLevel,
  PressureLevel,
  CSRDStatus,
  VSMEAdoption,
  RevenueBand,
  GrossMarginBand,
  ProfitabilityTrend,
  CashPosition,
  BudgetType,
  CapexCapacity,
  InvestmentPriority,
  CostConcern,
  SustainabilityLinkedFinancing,
  LenderESGRequirements,
} from '@/types';

type ContextTab = 'all' | 'external' | 'financial';

const marketScopeOptions = [
  { value: 'local', label: 'Local' },
  { value: 'regional', label: 'Regional' },
  { value: 'national', label: 'National' },
  { value: 'eu', label: 'EU-wide' },
  { value: 'global', label: 'Global' },
];

const customerTypeOptions = [
  { value: 'b2b', label: 'B2B (Business customers)' },
  { value: 'b2c', label: 'B2C (Consumers)' },
  { value: 'both', label: 'Both B2B and B2C' },
];

const concentrationOptions = [
  { value: 'low', label: 'Low (diversified)' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High (few large customers)' },
];

const pressureOptions = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const csrdOptions = [
  { value: 'not_applicable', label: 'Not applicable' },
  { value: 'will_apply', label: 'Will apply in future' },
  { value: 'currently_applies', label: 'Currently applies' },
];

const vsmeOptions = [
  { value: 'not_considering', label: 'Not considering' },
  { value: 'considering', label: 'Considering' },
  { value: 'implementing', label: 'Implementing' },
  { value: 'complete', label: 'Complete' },
];

const revenueBandOptions = [
  { value: '<500k', label: '< \u20AC500k' },
  { value: '500k-1m', label: '\u20AC500k - \u20AC1m' },
  { value: '1m-5m', label: '\u20AC1m - \u20AC5m' },
  { value: '5m-10m', label: '\u20AC5m - \u20AC10m' },
  { value: '10m-50m', label: '\u20AC10m - \u20AC50m' },
  { value: '50m-100m', label: '\u20AC50m - \u20AC100m' },
  { value: '>100m', label: '> \u20AC100m' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const grossMarginOptions = [
  { value: '<10', label: '< 10%' },
  { value: '10-20', label: '10-20%' },
  { value: '20-40', label: '20-40%' },
  { value: '40-60', label: '40-60%' },
  { value: '>60', label: '> 60%' },
];

const profitabilityOptions = [
  { value: 'declining', label: 'Declining' },
  { value: 'stable', label: 'Stable' },
  { value: 'growing', label: 'Growing' },
];

const cashPositionOptions = [
  { value: 'tight', label: 'Tight' },
  { value: 'adequate', label: 'Adequate' },
  { value: 'strong', label: 'Strong' },
];

const budgetTypeOptions = [
  { value: 'none', label: 'No budget' },
  { value: 'ad_hoc', label: 'Ad-hoc spending' },
  { value: 'dedicated_line_item', label: 'Dedicated budget line' },
];

const capexOptions = [
  { value: 'none', label: 'None' },
  { value: 'limited', label: 'Limited' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'significant', label: 'Significant' },
];

const investmentPriorityOptions = [
  { value: 'not_a_priority', label: 'Not a priority' },
  { value: 'low', label: 'Low priority' },
  { value: 'medium', label: 'Medium priority' },
  { value: 'high', label: 'High priority' },
];

const sustainabilityFinancingOptions = [
  { value: 'no', label: 'No' },
  { value: 'exploring', label: 'Exploring options' },
  { value: 'in_place', label: 'Already in place' },
];

const lenderEsgOptions = [
  { value: 'none', label: 'None' },
  { value: 'informal', label: 'Informal questions' },
  { value: 'formal_requirements', label: 'Formal requirements' },
];

// Toast component
function Toast({ message, show, onClose }: { message: string; show: boolean; onClose: () => void }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

// ============ ALL/INSIGHTS TAB CONTENT ============
function AllInsightsTab({
  externalContext,
  financialContext,
  onNavigate,
}: {
  externalContext: ExternalContext | null;
  financialContext: FinancialContext | null;
  onNavigate: (tab: ContextTab) => void;
}) {
  const externalComplete = !!externalContext;
  const financialComplete = !!financialContext;

  const summaryItems = useMemo(() => {
    const items = [];

    if (externalContext) {
      items.push({
        label: 'Market Scope',
        value: marketScopeOptions.find(o => o.value === externalContext.marketScope)?.label || '\u2014',
      });
      items.push({
        label: 'Customer Type',
        value: customerTypeOptions.find(o => o.value === externalContext.customerType)?.label || '\u2014',
      });
      items.push({
        label: 'CSRD Status',
        value: csrdOptions.find(o => o.value === externalContext.csrdStatus)?.label || '\u2014',
      });
      items.push({
        label: 'Regulatory Pressure',
        value: pressureOptions.find(o => o.value === externalContext.regulatoryPressure)?.label || '\u2014',
      });
    }

    if (financialContext) {
      items.push({
        label: 'Revenue Band',
        value: revenueBandOptions.find(o => o.value === financialContext.revenueBand)?.label || '\u2014',
      });
      items.push({
        label: 'Cash Position',
        value: cashPositionOptions.find(o => o.value === financialContext.cashPosition)?.label || '\u2014',
      });
      items.push({
        label: 'CapEx Capacity',
        value: capexOptions.find(o => o.value === financialContext.capexCapacity12mo)?.label || '\u2014',
      });
      items.push({
        label: 'Investment Priority',
        value: investmentPriorityOptions.find(o => o.value === financialContext.investmentPriority)?.label || '\u2014',
      });
    }

    return items;
  }, [externalContext, financialContext]);

  const categories = [
    {
      id: 'external' as ContextTab,
      title: 'External Context',
      icon: GlobeHemisphereWest,
      gradient: 'from-primary-dark to-primary',
      complete: externalComplete,
      subtitle: 'Market & regulatory environment',
      items: externalContext ? [
        `${externalContext.primaryMarkets?.length || 0} markets`,
        marketScopeOptions.find(o => o.value === externalContext.marketScope)?.label || '',
        customerTypeOptions.find(o => o.value === externalContext.customerType)?.label || '',
      ].filter(Boolean) : [],
    },
    {
      id: 'financial' as ContextTab,
      title: 'Financial Context',
      icon: CurrencyDollar,
      gradient: 'from-primary-dark to-primary',
      complete: financialComplete,
      subtitle: 'Budget & investment capacity',
      items: financialContext ? [
        revenueBandOptions.find(o => o.value === financialContext.revenueBand)?.label || '',
        cashPositionOptions.find(o => o.value === financialContext.cashPosition)?.label || '',
        budgetTypeOptions.find(o => o.value === financialContext.budgetType)?.label || '',
      ].filter(Boolean) : [],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Category Cards */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onNavigate(cat.id)}
              className={cn(
                'text-left p-4 rounded-xl border-2 transition-all',
                'border-gray-200 hover:border-primary/40',
                'hover:shadow-md'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br', cat.gradient)}>
                    <Icon className="w-5 h-5 text-white" weight="duotone" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{cat.title}</div>
                    <div className="text-xs text-gray-500">{cat.subtitle}</div>
                  </div>
                </div>
                {cat.complete ? (
                  <Badge variant="high">Complete</Badge>
                ) : (
                  <Badge variant="medium">Incomplete</Badge>
                )}
              </div>
              {cat.items.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {cat.items.map((item, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {!cat.complete && (
                <p className="text-sm text-gray-400 mt-2">Click to fill out context information</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary Table */}
      {summaryItems.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Context Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            {summaryItems.map((item, i) => (
              <div key={i}>
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className="font-medium text-gray-900">{item.value}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============ EXTERNAL CONTEXT TAB ============
function ExternalContextTab({
  externalContext,
  company,
  onSave,
  showToast,
}: {
  externalContext: ExternalContext | null;
  company: { id: string } | null;
  onSave: (data: ExternalContext) => void;
  showToast: (message: string) => void;
}) {
  const [form, setForm] = useState<Partial<ExternalContext>>(
    externalContext || {
      companyId: company?.id || '',
      primaryMarkets: [],
      marketScope: 'national',
      customerType: 'b2b',
      keyCustomerIndustries: [],
      customerConcentration: 'medium',
      competitivePressureSustainability: 'low',
      marketSustainabilityTrend: 'emerging',
      csrdStatus: 'not_applicable',
      vsmeAdoption: 'not_considering',
      regulatoryPressure: 'low',
    }
  );

  const [marketInput, setMarketInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');

  const addMarket = () => {
    if (marketInput.trim()) {
      setForm({
        ...form,
        primaryMarkets: [...(form.primaryMarkets || []), marketInput.trim()],
      });
      setMarketInput('');
    }
  };

  const removeMarket = (market: string) => {
    setForm({
      ...form,
      primaryMarkets: (form.primaryMarkets || []).filter((m) => m !== market),
    });
  };

  const addIndustry = () => {
    if (industryInput.trim()) {
      setForm({
        ...form,
        keyCustomerIndustries: [...(form.keyCustomerIndustries || []), industryInput.trim()],
      });
      setIndustryInput('');
    }
  };

  const removeIndustry = (industry: string) => {
    setForm({
      ...form,
      keyCustomerIndustries: (form.keyCustomerIndustries || []).filter((i) => i !== industry),
    });
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    onSave({
      ...form,
      id: externalContext?.id || crypto.randomUUID(),
      companyId: company?.id || '',
      updatedAt: now,
    } as ExternalContext);
    showToast('External context saved');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Market Position</CardTitle>
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Markets</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={marketInput}
                onChange={(e) => setMarketInput(e.target.value)}
                placeholder="e.g., Germany, France"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addMarket()}
              />
              <Button onClick={addMarket}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.primaryMarkets || []).map((market) => (
                <Badge key={market} variant="info" className="cursor-pointer" onClick={() => removeMarket(market)}>
                  {market} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Market Scope"
              value={form.marketScope}
              onChange={(e) => setForm({ ...form, marketScope: e.target.value as MarketScope })}
              options={marketScopeOptions}
            />
            <Select
              label="Customer Type"
              value={form.customerType}
              onChange={(e) => setForm({ ...form, customerType: e.target.value as CustomerType })}
              options={customerTypeOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Key Customer Industries</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                placeholder="e.g., Automotive, Retail"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addIndustry()}
              />
              <Button onClick={addIndustry}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.keyCustomerIndustries || []).map((industry) => (
                <Badge key={industry} variant="info" className="cursor-pointer" onClick={() => removeIndustry(industry)}>
                  {industry} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Customer Concentration"
              value={form.customerConcentration}
              onChange={(e) =>
                setForm({ ...form, customerConcentration: e.target.value as ConcentrationLevel })
              }
              options={concentrationOptions}
            />
            <Input
              label="Top Customer Share %"
              type="number"
              min={0}
              max={100}
              value={form.topCustomerSharePercent || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  topCustomerSharePercent: parseFloat(e.target.value) || undefined,
                })
              }
              hint="% of revenue from largest customer"
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Competitive Landscape</CardTitle>
        <div className="space-y-4 mt-4">
          <Select
            label="Sustainability Competitive Pressure"
            value={form.competitivePressureSustainability}
            onChange={(e) =>
              setForm({
                ...form,
                competitivePressureSustainability: e.target.value as PressureLevel,
              })
            }
            options={pressureOptions}
            hint="How much are competitors investing in sustainability?"
          />
          <Select
            label="Market Sustainability Trend"
            value={form.marketSustainabilityTrend}
            onChange={(e) =>
              setForm({
                ...form,
                marketSustainabilityTrend: e.target.value as any,
              })
            }
            options={[
              { value: 'not_a_factor', label: 'Not a factor' },
              { value: 'emerging', label: 'Emerging trend' },
              { value: 'established', label: 'Established expectation' },
              { value: 'differentiator', label: 'Key differentiator' },
            ]}
          />
        </div>
      </Card>

      <Card>
        <CardTitle>Regulatory Context</CardTitle>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="CSRD Applicability"
              value={form.csrdStatus}
              onChange={(e) => setForm({ ...form, csrdStatus: e.target.value as CSRDStatus })}
              options={csrdOptions}
            />
            <Select
              label="VSME Adoption"
              value={form.vsmeAdoption}
              onChange={(e) => setForm({ ...form, vsmeAdoption: e.target.value as VSMEAdoption })}
              options={vsmeOptions}
            />
          </div>
          <Select
            label="Overall Regulatory Pressure"
            value={form.regulatoryPressure}
            onChange={(e) =>
              setForm({ ...form, regulatoryPressure: e.target.value as PressureLevel })
            }
            options={pressureOptions}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Check className="w-4 h-4 mr-2" />
          Save External Context
        </Button>
      </div>
    </div>
  );
}

// ============ FINANCIAL CONTEXT TAB ============
function FinancialContextTab({
  financialContext,
  company,
  onSave,
  showToast,
}: {
  financialContext: FinancialContext | null;
  company: { id: string; revenueBand?: string } | null;
  onSave: (data: FinancialContext) => void;
  showToast: (message: string) => void;
}) {
  const [form, setForm] = useState<Partial<FinancialContext>>(
    financialContext || {
      companyId: company?.id || '',
      revenueBand: (company?.revenueBand as RevenueBand) || '1m-5m',
      grossMarginBand: '20-40',
      profitabilityTrend: 'stable',
      cashPosition: 'adequate',
      budgetType: 'none',
      capexCapacity12mo: 'limited',
      investmentPriority: 'low',
      primaryCostConcerns: [],
      costPressureLevel: 'medium',
      financingRelationships: [],
      sustainabilityLinkedFinancing: 'no',
      lenderEsgRequirements: 'none',
    }
  );

  const costConcerns: { value: CostConcern; label: string }[] = [
    { value: 'energy', label: 'Energy' },
    { value: 'materials', label: 'Materials' },
    { value: 'labor', label: 'Labor' },
    { value: 'waste', label: 'Waste' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'compliance', label: 'Compliance' },
  ];

  const toggleCostConcern = (concern: CostConcern) => {
    const current = form.primaryCostConcerns || [];
    if (current.includes(concern)) {
      setForm({
        ...form,
        primaryCostConcerns: current.filter((c) => c !== concern),
      });
    } else {
      setForm({
        ...form,
        primaryCostConcerns: [...current, concern],
      });
    }
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    onSave({
      ...form,
      id: financialContext?.id || crypto.randomUUID(),
      companyId: company?.id || '',
      updatedAt: now,
    } as FinancialContext);
    showToast('Financial context saved');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Financial Position</CardTitle>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Revenue Band"
              value={form.revenueBand}
              onChange={(e) => setForm({ ...form, revenueBand: e.target.value as RevenueBand })}
              options={revenueBandOptions}
            />
            <Select
              label="Gross Margin Band"
              value={form.grossMarginBand}
              onChange={(e) =>
                setForm({ ...form, grossMarginBand: e.target.value as GrossMarginBand })
              }
              options={grossMarginOptions}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Profitability Trend"
              value={form.profitabilityTrend}
              onChange={(e) =>
                setForm({ ...form, profitabilityTrend: e.target.value as ProfitabilityTrend })
              }
              options={profitabilityOptions}
            />
            <Select
              label="Cash Position"
              value={form.cashPosition}
              onChange={(e) =>
                setForm({ ...form, cashPosition: e.target.value as CashPosition })
              }
              options={cashPositionOptions}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Sustainability Investment Capacity</CardTitle>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Budget Type"
              value={form.budgetType}
              onChange={(e) => setForm({ ...form, budgetType: e.target.value as BudgetType })}
              options={budgetTypeOptions}
            />
            <Input
              label="Annual Sustainability Budget"
              type="number"
              value={form.sustainabilityBudgetAnnual || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  sustainabilityBudgetAnnual: parseFloat(e.target.value) || undefined,
                })
              }
              hint="Optional"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="CapEx Capacity (12 months)"
              value={form.capexCapacity12mo}
              onChange={(e) =>
                setForm({ ...form, capexCapacity12mo: e.target.value as CapexCapacity })
              }
              options={capexOptions}
            />
            <Select
              label="Sustainability Investment Priority"
              value={form.investmentPriority}
              onChange={(e) =>
                setForm({ ...form, investmentPriority: e.target.value as InvestmentPriority })
              }
              options={investmentPriorityOptions}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Cost Pressures</CardTitle>
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Cost Concerns</label>
            <div className="flex flex-wrap gap-2">
              {costConcerns.map((concern) => (
                <button
                  key={concern.value}
                  onClick={() => toggleCostConcern(concern.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    (form.primaryCostConcerns || []).includes(concern.value)
                      ? 'bg-forest-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {concern.label}
                </button>
              ))}
            </div>
          </div>
          <Select
            label="Cost Pressure Level"
            value={form.costPressureLevel}
            onChange={(e) =>
              setForm({ ...form, costPressureLevel: e.target.value as PressureLevel })
            }
            options={pressureOptions}
          />
        </div>
      </Card>

      <Card>
        <CardTitle>External Financing</CardTitle>
        <div className="space-y-4 mt-4">
          <Select
            label="Sustainability-Linked Financing"
            value={form.sustainabilityLinkedFinancing}
            onChange={(e) =>
              setForm({
                ...form,
                sustainabilityLinkedFinancing: e.target.value as SustainabilityLinkedFinancing,
              })
            }
            options={sustainabilityFinancingOptions}
          />
          <Select
            label="Lender ESG Requirements"
            value={form.lenderEsgRequirements}
            onChange={(e) =>
              setForm({
                ...form,
                lenderEsgRequirements: e.target.value as LenderESGRequirements,
              })
            }
            options={lenderEsgOptions}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.insuranceEsgQuestions || false}
              onChange={(e) =>
                setForm({ ...form, insuranceEsgQuestions: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Insurance companies asking ESG questions</span>
          </label>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Check className="w-4 h-4 mr-2" />
          Save Financial Context
        </Button>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function ContextPage() {
  const { company } = useAppStore();
  const { externalContext, financialContext, setExternalContext, setFinancialContext } = useDataStore();

  const [activeTab, setActiveTab] = useState<ContextTab>('all');

  const [toastMessage, setToastMessage] = useState('');
  const [showToastState, setShowToastState] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setShowToastState(true);
  }, []);

  const progress = (externalContext ? 50 : 0) + (financialContext ? 50 : 0);

  const tabs = [
    { id: 'all' as ContextTab, label: 'All + Insights', icon: ChartBar },
    { id: 'external' as ContextTab, label: 'External', icon: GlobeHemisphereWest, complete: !!externalContext },
    { id: 'financial' as ContextTab, label: 'Financial', icon: CurrencyDollar, complete: !!financialContext },
  ];

  return (
    <div className="animate-fade-in">
      <Toast message={toastMessage} show={showToastState} onClose={() => setShowToastState(false)} />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <Link
            href="/data"
            className="mt-1 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-dark to-primary shadow-sm flex items-center justify-center">
                <GlobeHemisphereWest className="w-5 h-5 text-white" weight="duotone" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Context</h1>
            </div>
            <p className="text-gray-500 ml-13">Provide external and financial context to personalize recommendations</p>
          </div>
        </div>
      </div>

      {/* Compact Inline Stats */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-gray-500">Completeness</span>
          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-bold text-primary">{progress}%</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1.5">
          <GlobeHemisphereWest className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{externalContext ? 'Complete' : 'Incomplete'}</span> external</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1.5">
          <CurrencyDollar className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{financialContext ? 'Complete' : 'Incomplete'}</span> financial</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && (
        <AllInsightsTab
          externalContext={externalContext}
          financialContext={financialContext}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === 'external' && (
        <ExternalContextTab
          externalContext={externalContext}
          company={company}
          onSave={setExternalContext}
          showToast={showToast}
        />
      )}
      {activeTab === 'financial' && (
        <FinancialContextTab
          financialContext={financialContext}
          company={company}
          onSave={setFinancialContext}
          showToast={showToast}
        />
      )}

    </div>
  );
}
