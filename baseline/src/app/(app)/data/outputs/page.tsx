"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Trash, Package, Question, Check, ArrowLeft,
  ChartBar, TrendUp, Calendar, Recycle, CurrencyDollar,
  Plant, Cow, PencilSimple, Plus, TrashSimple
} from '@phosphor-icons/react';
import { Card, Button, Modal, EmptyState, Combobox } from '@/components/ui';
import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils/cn';
import { isAgriculturalIndustry } from '@/lib/utils/industry';
import {
  cropTypeOptions as centralCropTypeOptions,
  livestockTypeOptions as centralLivestockTypeOptions,
} from '@/lib/options';
import type {
  Waste,
  ProductOutput,
  WasteCategory,
  DisposalRoute,
  ConfidenceLevel,
  DataSource,
  CropOutput,
  CropType,
  LivestockRecord,
  LivestockType,
} from '@/types';
import { getLivestockEmissionFactors } from '@/types';
import { calculateLivestockEmissions, calculateLivestockUnits } from '@/lib/agricultural-calculations';

type OutputsTab = 'all' | 'waste' | 'products' | 'crops' | 'livestock';

const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const dataSourceOptions = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'erp', label: 'ERP' },
  { value: 'supplier', label: 'Partner' },
  { value: 'estimate', label: 'Est.' },
];

const confidenceOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Med' },
  { value: 'low', label: 'Low' },
];

const cropTypeOptions = centralCropTypeOptions;

const cropDestinationOptions: { value: NonNullable<CropOutput['destination']>; label: string }[] = [
  { value: 'sold', label: 'Sold' },
  { value: 'stored', label: 'Stored' },
  { value: 'feed', label: 'Feed' },
  { value: 'waste', label: 'Waste' },
  { value: 'other', label: 'Other' },
];

const livestockTypeOptions = centralLivestockTypeOptions;

// Row definitions
interface RowConfig {
  id: string;
  label: string;
  unit: string;
  tip: string;
}

const wasteRows: RowConfig[] = [
  { id: 'general', label: 'General', unit: 'kg', tip: 'General non-recyclable waste' },
  { id: 'recyclable', label: 'Recyclable', unit: 'kg', tip: 'Recyclable waste' },
  { id: 'organic', label: 'Organic', unit: 'kg', tip: 'Organic/food waste' },
  { id: 'hazardous', label: 'Hazardous', unit: 'kg', tip: 'Hazardous waste' },
];

const productRows: RowConfig[] = [
  { id: 'units', label: 'Units Produced', unit: '', tip: 'Number of units produced' },
  { id: 'weight', label: 'Output Weight', unit: 'kg', tip: 'Weight of goods produced' },
  { id: 'revenue', label: 'Revenue', unit: '\u20ac', tip: 'Sales revenue for products' },
];

// Emission factors for waste disposal (kg CO2e per kg waste)
const WASTE_EMISSION_FACTORS: Record<DisposalRoute, number> = {
  landfill: 0.58,
  incineration: 0.04,
  recycling: 0.02,
  composting: 0.01,
  reuse: 0.005,
  other: 0.3,
};

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

function formatNumber(n: number): string {
  if (n === 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ============ ALL/INSIGHTS TAB CONTENT ============
function AllInsightsTab({
  waste,
  productOutputs,
  cropOutputs,
  livestockRecords,
  onNavigate,
  selectedYear,
  setSelectedYear,
  sites,
  selectedSiteId,
  setSelectedSiteId,
}: {
  waste: Waste[];
  productOutputs: ProductOutput[];
  cropOutputs: CropOutput[];
  livestockRecords: LivestockRecord[];
  onNavigate: (tab: OutputsTab) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  sites: { id: string; siteName: string }[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Calculate totals
  const totals = useMemo(() => {
    const totalWasteKg = waste.reduce((sum, w) => sum + (w.quantityKg || 0), 0);
    const recycledKg = waste
      .filter(w => ['recycling', 'composting', 'reuse'].includes(w.disposalRoute))
      .reduce((sum, w) => sum + (w.quantityKg || 0), 0);
    const diversionRate = totalWasteKg > 0 ? (recycledKg / totalWasteKg) * 100 : 0;

    // Calculate emissions
    const wasteEmissions = waste.reduce((sum, w) => {
      const factor = WASTE_EMISSION_FACTORS[w.disposalRoute] || 0.3;
      return sum + ((w.quantityKg || 0) * factor / 1000);
    }, 0);

    const totalRevenue = productOutputs.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const totalUnits = productOutputs.reduce((sum, p) => sum + (p.quantity || 0), 0);

    // Crop totals
    const totalCropArea = cropOutputs.reduce((sum, c) => sum + (c.areaHa || 0), 0);
    const totalCropYield = cropOutputs.reduce((sum, c) => sum + (c.yieldTonnes || 0), 0);

    // Livestock totals
    const totalHead = livestockRecords.reduce((sum, l) => sum + (l.headcount || 0), 0);
    const totalLU = calculateLivestockUnits(livestockRecords);

    return {
      waste: { entries: waste.length, totalKg: totalWasteKg, recycledKg, diversionRate, emissions: wasteEmissions },
      products: { entries: productOutputs.length, totalUnits, totalRevenue },
      crops: { entries: cropOutputs.length, totalArea: totalCropArea, totalYield: totalCropYield },
      livestock: { entries: livestockRecords.length, totalHead, totalLU },
    };
  }, [waste, productOutputs, cropOutputs, livestockRecords]);

  // Coverage by month
  const coverage = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const coveredMonths = new Set([
      ...waste.map(w => w.period),
      ...productOutputs.map(p => p.period),
      ...cropOutputs.map(c => c.period),
      ...livestockRecords.map(l => l.period),
    ]);
    const covered = months.filter(m => coveredMonths.has(m)).length;
    return { covered, total: 12, percent: Math.round((covered / 12) * 100) };
  }, [waste, productOutputs, cropOutputs, livestockRecords]);

  // Periods for table
  const periods = useMemo(() => {
    return MONTHS_SHORT.map((short, i) => ({
      short,
      period: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
      isFuture: selectedYear === currentYear && i > currentMonth,
    }));
  }, [selectedYear, currentYear, currentMonth]);

  // Get value for combined table
  const getValueForPeriod = useCallback((period: string, field: string): number => {
    if (field === 'totalWaste') {
      return waste
        .filter(w => w.siteId === selectedSiteId && w.period === period)
        .reduce((sum, w) => sum + (w.quantityKg || 0), 0);
    } else if (field === 'diverted') {
      return waste
        .filter(w => w.siteId === selectedSiteId && w.period === period && ['recycling', 'composting', 'reuse'].includes(w.disposalRoute))
        .reduce((sum, w) => sum + (w.quantityKg || 0), 0);
    } else if (field === 'landfill') {
      return waste
        .filter(w => w.siteId === selectedSiteId && w.period === period && w.disposalRoute === 'landfill')
        .reduce((sum, w) => sum + (w.quantityKg || 0), 0);
    } else if (field === 'production') {
      return productOutputs
        .filter(p => p.siteId === selectedSiteId && p.period === period)
        .reduce((sum, p) => sum + (p.quantity || 0), 0);
    } else if (field === 'revenue') {
      return productOutputs
        .filter(p => p.siteId === selectedSiteId && p.period === period)
        .reduce((sum, p) => sum + (p.revenue || 0), 0);
    } else if (field === 'emissions') {
      return waste
        .filter(w => w.siteId === selectedSiteId && w.period === period)
        .reduce((sum, w) => {
          const factor = WASTE_EMISSION_FACTORS[w.disposalRoute] || 0.3;
          return sum + ((w.quantityKg || 0) * factor / 1000);
        }, 0);
    }
    return 0;
  }, [waste, productOutputs, selectedSiteId]);

  const getRowTotal = useCallback((field: string): number => {
    return periods.reduce((sum, { period }) => sum + getValueForPeriod(period, field), 0);
  }, [periods, getValueForPeriod]);

  const categories = [
    {
      id: 'waste' as OutputsTab,
      title: 'Waste',
      icon: Trash,
      gradient: 'from-stack-3 to-stack-5',
      value: formatNumber(totals.waste.totalKg),
      unit: 'kg',
      entries: totals.waste.entries,
      subtitle: 'Waste by category',
    },
    {
      id: 'products' as OutputsTab,
      title: 'Products',
      icon: Package,
      gradient: 'from-stack-3 to-stack-5',
      value: formatNumber(totals.products.totalUnits),
      unit: 'units',
      entries: totals.products.entries,
      subtitle: 'Production output',
    },
    {
      id: 'crops' as OutputsTab,
      title: 'Crops',
      icon: Plant,
      gradient: 'from-stack-3 to-stack-5',
      value: formatNumber(totals.crops.totalYield),
      unit: 't',
      entries: totals.crops.entries,
      subtitle: 'Crop outputs',
    },
    {
      id: 'livestock' as OutputsTab,
      title: 'Livestock',
      icon: Cow,
      gradient: 'from-stack-3 to-stack-5',
      value: formatNumber(totals.livestock.totalHead),
      unit: 'head',
      entries: totals.livestock.entries,
      subtitle: 'Livestock records',
    },
  ];

  // Combined table rows with icons
  const combinedRows = [
    { id: 'totalWaste', label: 'Total Waste', unit: 'kg', icon: Trash, iconColor: 'text-gray-400' },
    { id: 'diverted', label: 'Diverted', unit: 'kg', icon: Recycle, iconColor: 'text-gray-400' },
    { id: 'landfill', label: 'Landfill', unit: 'kg', icon: Trash, iconColor: 'text-gray-400' },
    { id: 'production', label: 'Production', unit: '', icon: Package, iconColor: 'text-gray-400' },
    { id: 'emissions', label: 'Emissions', unit: 'tCO\u2082e', icon: TrendUp, iconColor: 'text-primary' },
  ];

  return (
    <div className="space-y-4">
      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onNavigate(cat.id)}
              className={cn(
                'text-left bg-white border-2 rounded-lg p-3 transition-all cursor-pointer',
                'border-gray-200 hover:border-primary/40',
                'hover:shadow-sm'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br', cat.gradient)}>
                  <Icon className="w-4 h-4 text-white" weight="duotone" />
                </div>
                <span className="text-xs text-gray-400">{cat.entries} entries</span>
              </div>

              <h3 className="font-medium text-gray-900 text-sm hover:text-primary transition-colors">{cat.title}</h3>
              <p className="text-xs text-gray-500">{cat.subtitle}</p>

              <div className="flex items-end justify-between mt-1">
                <div>
                  <span className="text-lg font-bold text-gray-900">{cat.value}</span>
                  <span className="text-xs text-gray-500 ml-1">{cat.unit}</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-primary font-medium">Click to enter data &rarr;</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Site:</span>
          <select
            value={selectedSiteId}
            onChange={e => setSelectedSiteId(e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:border-primary focus:outline-none"
          >
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.siteName}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            disabled={selectedYear <= currentYear - 5}
            className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            &larr;
          </button>
          <span className="text-sm font-semibold text-primary w-12 text-center">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= currentYear}
            className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            &rarr;
          </button>
        </div>
      </div>

      {/* Combined Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-3 font-medium text-gray-600 w-32">Metric</th>
                {periods.map(({ short, period, isFuture }) => (
                  <th key={period} className={cn('py-2 px-0.5 font-medium text-center w-12', isFuture ? 'text-gray-300' : 'text-gray-500')}>
                    {short}
                  </th>
                ))}
                <th className="py-2 px-3 font-medium text-gray-600 text-right w-16">Total</th>
              </tr>
            </thead>
            <tbody>
              {combinedRows.map((row, idx) => {
                const Icon = row.icon;
                const rowTotal = getRowTotal(row.id);
                return (
                  <tr key={row.id} className={cn(
                    'border-b border-gray-50',
                    idx % 2 === 1 && 'bg-gray-50/30',
                    row.id === 'emissions' && 'bg-primary-100 border-t border-primary'
                  )}>
                    <td className="py-1 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', row.iconColor)} />
                        <span className="font-medium">{row.label}</span>
                        {row.unit && <span className="text-gray-400 text-xs">({row.unit})</span>}
                      </div>
                    </td>
                    {periods.map(({ period, isFuture }) => {
                      const value = getValueForPeriod(period, row.id);
                      const hasValue = value > 0;
                      return (
                        <td key={period} className="py-0.5 px-0.5">
                          <div className={cn(
                            'w-full h-7 flex items-center justify-center text-center text-xs border rounded',
                            isFuture ? 'bg-gray-50 border-gray-100 text-gray-300'
                              : hasValue ? 'bg-primary-100 border-primary-light text-gray-700'
                              : 'bg-white border-gray-200 text-gray-300'
                          )}>
                            {!isFuture && hasValue ? (row.id === 'emissions' ? value.toFixed(2) : formatNumber(value)) : ''}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-1 px-3 text-right font-medium text-gray-700 text-xs">
                      {rowTotal > 0 ? (row.id === 'emissions' ? rowTotal.toFixed(1) : formatNumber(rowTotal)) : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Getting Started */}
      {waste.length + productOutputs.length + cropOutputs.length + livestockRecords.length === 0 && (
        <Card className="bg-primary-100 border-primary border-l-4">
          <h3 className="font-semibold text-gray-900 mb-1">Getting Started</h3>
          <p className="text-sm text-gray-600">
            Click on any category above to start entering output data. Start with waste for environmental tracking.
          </p>
        </Card>
      )}
    </div>
  );
}

// ============ DATA ENTRY GRID ============
function DataEntryGrid({
  rows,
  periods,
  getValue,
  setValue,
  getRowTotal,
  gridData,
  showEmissions,
  calculateEmissions,
  totalEmissions,
}: {
  rows: RowConfig[];
  periods: { short: string; period: string; isFuture: boolean }[];
  getValue: (period: string, field: string) => string;
  setValue: (period: string, field: string, value: string) => void;
  getRowTotal: (field: string) => number;
  gridData: Record<string, Record<string, string>>;
  showEmissions?: boolean;
  calculateEmissions?: (period: string) => number;
  totalEmissions?: number;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-2 px-3 font-medium text-gray-600 w-32">Metric</th>
              {periods.map(({ short, period, isFuture }) => (
                <th key={period} className={cn('py-2 px-0.5 font-medium text-center w-12', isFuture ? 'text-gray-300' : 'text-gray-500')}>
                  {short}
                </th>
              ))}
              <th className="py-2 px-3 font-medium text-gray-600 text-right w-16">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={cn('border-b border-gray-50', idx % 2 === 1 && 'bg-gray-50/30')}>
                <td className="py-1 px-3 text-gray-700">
                  <span className="cursor-help border-b border-dotted border-gray-300" title={row.tip}>
                    {row.label}
                  </span>
                  {row.unit && <span className="text-gray-400 text-xs ml-1">({row.unit})</span>}
                </td>
                {periods.map(({ period, isFuture }) => {
                  const cellValue = getValue(period, row.id);
                  const hasValue = cellValue !== '' && cellValue !== '0';
                  const isModified = gridData[period]?.[row.id] !== undefined;

                  return (
                    <td key={period} className="py-0.5 px-0.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cellValue}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          setValue(period, row.id, val);
                        }}
                        disabled={isFuture}
                        className={cn(
                          'w-full h-7 text-center text-xs border rounded focus:outline-none transition-colors',
                          isFuture ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                            : isModified ? 'bg-amber-50 border-amber-300 focus:border-primary'
                            : hasValue ? 'bg-primary-100 border-primary-light focus:border-primary'
                            : 'bg-white border-gray-200 focus:border-primary'
                        )}
                      />
                    </td>
                  );
                })}
                <td className="py-1 px-3 text-right font-medium text-gray-700 text-xs">
                  {formatNumber(getRowTotal(row.id))}
                </td>
              </tr>
            ))}

            {showEmissions && calculateEmissions && (
              <tr className="bg-primary-100 border-t border-primary">
                <td className="py-1.5 px-3 text-primary font-medium text-xs">
                  Emissions <span className="text-primary/70 ml-1">(tCO\u2082e)</span>
                </td>
                {periods.map(({ period, isFuture }) => {
                  const emissions = calculateEmissions(period);
                  return (
                    <td key={period} className={cn('py-1.5 px-0.5 text-center text-xs font-medium', isFuture ? 'text-gray-300' : 'text-primary')}>
                      {!isFuture && emissions > 0 ? emissions.toFixed(2) : ''}
                    </td>
                  );
                })}
                <td className="py-1.5 px-3 text-right font-bold text-primary text-xs">
                  {totalEmissions && totalEmissions > 0 ? totalEmissions.toFixed(1) : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ============ CROP OUTPUTS TAB ============
function CropOutputsTab({
  sites,
  selectedSiteId,
  setSelectedSiteId,
}: {
  sites: { id: string; siteName: string }[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
}) {
  const {
    cropOutputs,
    addCropOutput,
    updateCropOutput,
    removeCropOutput,
  } = useDataStore();

  const { company } = useAppStore();
  const isAgri = isAgriculturalIndustry(company?.industryCode);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [quickForm, setQuickForm] = useState({
    cropType: 'wheat' as CropType,
    cropName: '',
    areaHa: '',
    yieldTonnes: '',
  });

  // Form state
  const emptyForm = {
    cropType: 'wheat' as CropType,
    cropName: '',
    areaHa: '',
    yieldTonnes: '',
    revenue: '',
    destination: 'sold' as NonNullable<CropOutput['destination']>,
    period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    source: 'invoice' as DataSource,
    confidence: 'high' as ConfidenceLevel,
  };
  const [form, setForm] = useState(emptyForm);

  const filteredRecords = useMemo(
    () => cropOutputs.filter(c => c.siteId === selectedSiteId),
    [cropOutputs, selectedSiteId]
  );

  // Summary stats
  const summary = useMemo(() => {
    const totalArea = filteredRecords.reduce((sum, c) => sum + (c.areaHa || 0), 0);
    const totalYield = filteredRecords.reduce((sum, c) => sum + (c.yieldTonnes || 0), 0);
    const avgYieldPerHa = totalArea > 0 ? totalYield / totalArea : 0;
    return { totalArea, totalYield, avgYieldPerHa };
  }, [filteredRecords]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (record: CropOutput) => {
    setEditingId(record.id);
    setForm({
      cropType: record.cropType,
      cropName: record.cropName,
      areaHa: String(record.areaHa),
      yieldTonnes: String(record.yieldTonnes),
      revenue: record.revenue != null ? String(record.revenue) : '',
      destination: record.destination || 'sold',
      period: record.period,
      source: record.source,
      confidence: record.confidence,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const areaHa = parseFloat(form.areaHa) || 0;
    const yieldTonnes = parseFloat(form.yieldTonnes) || 0;
    const revenue = form.revenue ? parseFloat(form.revenue) : undefined;
    const yieldPerHa = areaHa > 0 ? yieldTonnes / areaHa : undefined;
    const now = new Date().toISOString();

    if (!form.cropName.trim() || areaHa <= 0 || yieldTonnes <= 0) return;

    const record: Omit<CropOutput, 'id'> = {
      siteId: selectedSiteId,
      period: form.period,
      cropType: form.cropType,
      cropName: form.cropName.trim(),
      areaHa,
      yieldTonnes,
      yieldPerHa,
      revenue,
      destination: form.destination,
      source: form.source,
      confidence: form.confidence,
      lastUpdated: now,
    };

    if (editingId) {
      updateCropOutput(editingId, record);
      setToastMessage('Crop record updated');
    } else {
      addCropOutput({ ...record, id: crypto.randomUUID() } as CropOutput);
      setToastMessage('Crop record added');
    }

    setShowModal(false);
    setShowToast(true);
  };

  const handleDelete = (id: string) => {
    removeCropOutput(id);
    setToastMessage('Crop record deleted');
    setShowToast(true);
  };

  const yieldPerHaDisplay = useMemo(() => {
    const area = parseFloat(form.areaHa) || 0;
    const yieldT = parseFloat(form.yieldTonnes) || 0;
    if (area > 0 && yieldT > 0) return (yieldT / area).toFixed(2);
    return '-';
  }, [form.areaHa, form.yieldTonnes]);

  return (
    <>
      <Toast message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />

      {/* Controls */}
      <div className="flex items-center gap-3 mb-3 flex-wrap text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Site:</span>
          <select
            value={selectedSiteId}
            onChange={e => setSelectedSiteId(e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:border-primary focus:outline-none"
          >
            {sites.map(s => <option key={s.id} value={s.id}>{s.siteName}</option>)}
          </select>
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-1" />
          Add Crop
        </Button>
      </div>

      {/* Summary Card */}
      {filteredRecords.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white border border-emerald-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-0.5">Total Area</div>
            <div className="text-lg font-bold text-gray-900">{summary.totalArea.toFixed(1)} <span className="text-xs font-normal text-gray-500">ha</span></div>
          </div>
          <div className="bg-white border border-emerald-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-0.5">Total Yield</div>
            <div className="text-lg font-bold text-gray-900">{summary.totalYield.toFixed(1)} <span className="text-xs font-normal text-gray-500">t</span></div>
          </div>
          <div className="bg-white border border-emerald-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-0.5">Avg Yield/ha</div>
            <div className="text-lg font-bold text-emerald-700">{summary.avgYieldPerHa.toFixed(2)} <span className="text-xs font-normal text-gray-500">t/ha</span></div>
          </div>
        </div>
      )}

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        isAgri ? (
          <div className="border-2 border-dashed border-primary/30 bg-primary-100/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Quick Add — Crop Record</h3>
            <p className="text-sm text-gray-500 mb-4">Add your first crop with just the basics. You can add detail later.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <Combobox
                  label="Crop Type"
                  value={quickForm.cropType}
                  onChange={value => setQuickForm(prev => ({ ...prev, cropType: value as CropType }))}
                  options={cropTypeOptions}
                  placeholder="Search or type a crop..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Crop Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={quickForm.cropName}
                  onChange={e => setQuickForm(prev => ({ ...prev, cropName: e.target.value }))}
                  placeholder="e.g. Winter Wheat"
                  className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Area (hectares)</label>
                <input
                  type="number"
                  step="0.1"
                  value={quickForm.areaHa}
                  onChange={e => setQuickForm(prev => ({ ...prev, areaHa: e.target.value }))}
                  placeholder="0"
                  className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Yield (tonnes)</label>
                <input
                  type="number"
                  step="0.1"
                  value={quickForm.yieldTonnes}
                  onChange={e => setQuickForm(prev => ({ ...prev, yieldTonnes: e.target.value }))}
                  placeholder="0"
                  className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            {parseFloat(quickForm.areaHa) > 0 && parseFloat(quickForm.yieldTonnes) > 0 && (
              <p className="text-xs text-gray-400 mb-3">
                Yield/ha: {(parseFloat(quickForm.yieldTonnes) / parseFloat(quickForm.areaHa)).toFixed(2)} t/ha
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                disabled={!quickForm.cropName.trim() || parseFloat(quickForm.areaHa) === 0 || !quickForm.areaHa}
                onClick={() => {
                  const areaHa = parseFloat(quickForm.areaHa) || 0;
                  const yieldTonnes = parseFloat(quickForm.yieldTonnes) || 0;
                  const yieldPerHa = areaHa > 0 && yieldTonnes > 0 ? yieldTonnes / areaHa : undefined;
                  addCropOutput({
                    id: crypto.randomUUID(),
                    siteId: selectedSiteId,
                    period: new Date().toISOString().slice(0, 7),
                    cropType: quickForm.cropType,
                    cropName: quickForm.cropName.trim(),
                    areaHa,
                    yieldTonnes,
                    yieldPerHa,
                    source: 'estimate' as DataSource,
                    confidence: 'medium' as ConfidenceLevel,
                    lastUpdated: new Date().toISOString(),
                  } as CropOutput);
                  setQuickForm({ cropType: 'wheat', cropName: '', areaHa: '', yieldTonnes: '' });
                  setToastMessage('Crop record added');
                  setShowToast(true);
                }}
              >
                Save & Add More
              </Button>
              <button
                type="button"
                onClick={openAddModal}
                className="text-sm text-primary hover:underline"
              >
                Use full form instead
              </button>
            </div>
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={Plant}
              title="No crop records yet"
              description="Add crop output records to track yields, revenue and destinations."
              actionLabel="Add Crop Record"
              onAction={openAddModal}
            />
          </Card>
        )
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Period</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Crop Name</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Area (ha)</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Yield (t)</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Yield/ha</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Dest.</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Revenue</th>
                  <th className="py-2 px-3 font-medium text-gray-600 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, idx) => {
                  const yph = record.areaHa > 0 ? (record.yieldTonnes / record.areaHa).toFixed(2) : '-';
                  return (
                    <tr key={record.id} className={cn('border-b border-gray-50', idx % 2 === 1 && 'bg-gray-50/30')}>
                      <td className="py-1.5 px-3 text-gray-600 text-xs">{record.period}</td>
                      <td className="py-1.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          {cropTypeOptions.find(o => o.value === record.cropType)?.label || record.cropType}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-gray-900 font-medium">{record.cropName}</td>
                      <td className="py-1.5 px-3 text-right text-gray-700">{record.areaHa}</td>
                      <td className="py-1.5 px-3 text-right text-gray-700">{record.yieldTonnes}</td>
                      <td className="py-1.5 px-3 text-right text-emerald-700 font-medium">{yph}</td>
                      <td className="py-1.5 px-3 text-gray-600 text-xs capitalize">{record.destination || '-'}</td>
                      <td className="py-1.5 px-3 text-right text-gray-700">{record.revenue != null ? `\u20ac${formatNumber(record.revenue)}` : '-'}</td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEditModal(record)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                            <PencilSimple className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(record.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                            <TrashSimple className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Crop Record' : 'Add Crop Record'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Period + Source + Confidence */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Period</label>
              <input
                type="month"
                value={form.period}
                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
              <select
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value as DataSource }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              >
                {dataSourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confidence</label>
              <select
                value={form.confidence}
                onChange={e => setForm(f => ({ ...f, confidence: e.target.value as ConfidenceLevel }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              >
                {confidenceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Crop Type + Crop Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Combobox
                label="Crop Type"
                value={form.cropType}
                onChange={value => setForm(f => ({ ...f, cropType: value as CropType }))}
                options={cropTypeOptions}
                placeholder="Search or type a crop..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Crop Name</label>
              <input
                type="text"
                placeholder="e.g. Winter Wheat"
                value={form.cropName}
                onChange={e => setForm(f => ({ ...f, cropName: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Area + Yield + Yield/ha (readonly) */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Area (ha)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={form.areaHa}
                onChange={e => setForm(f => ({ ...f, areaHa: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Yield (tonnes)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={form.yieldTonnes}
                onChange={e => setForm(f => ({ ...f, yieldTonnes: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Yield/ha (auto)</label>
              <div className="w-full text-sm border border-gray-100 rounded-md px-2 py-1.5 bg-gray-50 text-emerald-700 font-medium">
                {yieldPerHaDisplay} <span className="text-gray-400 text-xs font-normal">t/ha</span>
              </div>
            </div>
          </div>

          {/* Revenue + Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Revenue (\u20ac) <span className="text-gray-400">optional</span></label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.revenue}
                onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Destination</label>
              <select
                value={form.destination}
                onChange={e => setForm(f => ({ ...f, destination: e.target.value as NonNullable<CropOutput['destination']> }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              >
                {cropDestinationOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.cropName.trim() || !(parseFloat(form.areaHa) > 0) || !(parseFloat(form.yieldTonnes) > 0)}
            >
              {editingId ? 'Update' : 'Add'} Record
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ============ LIVESTOCK TAB ============
function LivestockTab({
  sites,
  selectedSiteId,
  setSelectedSiteId,
}: {
  sites: { id: string; siteName: string }[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
}) {
  const {
    livestockRecords,
    addLivestockRecord,
    updateLivestockRecord,
    removeLivestockRecord,
  } = useDataStore();

  const { company } = useAppStore();
  const isAgri = isAgriculturalIndustry(company?.industryCode);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [quickForm, setQuickForm] = useState({
    livestockType: 'cattle-dairy' as LivestockType,
    headcount: '',
  });

  const emptyForm = {
    livestockType: 'cattle-dairy' as LivestockType,
    headcount: '',
    averageWeightKg: '',
    grazingMonths: '',
    notes: '',
    period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    source: 'invoice' as DataSource,
    confidence: 'high' as ConfidenceLevel,
  };
  const [form, setForm] = useState(emptyForm);

  const filteredRecords = useMemo(
    () => livestockRecords.filter(l => l.siteId === selectedSiteId),
    [livestockRecords, selectedSiteId]
  );

  // Summary stats
  const summary = useMemo(() => {
    const totalHead = filteredRecords.reduce((sum, l) => sum + (l.headcount || 0), 0);
    const totalLU = calculateLivestockUnits(filteredRecords);
    const emissions = calculateLivestockEmissions(filteredRecords);
    return { totalHead, totalLU, totalEmissions: emissions.totalTco2e };
  }, [filteredRecords]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (record: LivestockRecord) => {
    setEditingId(record.id);
    setForm({
      livestockType: record.livestockType,
      headcount: String(record.headcount),
      averageWeightKg: record.averageWeightKg != null ? String(record.averageWeightKg) : '',
      grazingMonths: record.grazingMonths != null ? String(record.grazingMonths) : '',
      notes: record.notes || '',
      period: record.period,
      source: record.source,
      confidence: record.confidence,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const headcount = parseInt(form.headcount) || 0;
    const averageWeightKg = form.averageWeightKg ? parseFloat(form.averageWeightKg) : undefined;
    const grazingMonths = form.grazingMonths ? parseFloat(form.grazingMonths) : undefined;
    const now = new Date().toISOString();

    if (headcount <= 0) return;

    const luFactor = getLivestockEmissionFactors(form.livestockType).luFactor;
    const livestockUnits = headcount * luFactor;

    const record: Omit<LivestockRecord, 'id'> = {
      siteId: selectedSiteId,
      period: form.period,
      livestockType: form.livestockType,
      headcount,
      livestockUnits,
      averageWeightKg,
      grazingMonths,
      notes: form.notes.trim() || undefined,
      source: form.source,
      confidence: form.confidence,
      lastUpdated: now,
    };

    if (editingId) {
      updateLivestockRecord(editingId, record);
      setToastMessage('Livestock record updated');
    } else {
      addLivestockRecord({ ...record, id: crypto.randomUUID() } as LivestockRecord);
      setToastMessage('Livestock record added');
    }

    setShowModal(false);
    setShowToast(true);
  };

  const handleDelete = (id: string) => {
    removeLivestockRecord(id);
    setToastMessage('Livestock record deleted');
    setShowToast(true);
  };

  // Auto-calculated LU display for modal
  const luDisplay = useMemo(() => {
    const headcount = parseInt(form.headcount) || 0;
    if (headcount <= 0) return '-';
    const factor = getLivestockEmissionFactors(form.livestockType).luFactor;
    return (headcount * factor).toFixed(2);
  }, [form.headcount, form.livestockType]);

  // Auto-calculated emissions display for modal
  const emissionsDisplay = useMemo(() => {
    const headcount = parseInt(form.headcount) || 0;
    if (headcount <= 0) return '-';
    const mockRecord = {
      livestockType: form.livestockType,
      headcount,
    } as LivestockRecord;
    const result = calculateLivestockEmissions([mockRecord]);
    return result.totalTco2e.toFixed(2);
  }, [form.headcount, form.livestockType]);

  return (
    <>
      <Toast message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />

      {/* Controls */}
      <div className="flex items-center gap-3 mb-3 flex-wrap text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Site:</span>
          <select
            value={selectedSiteId}
            onChange={e => setSelectedSiteId(e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:border-primary focus:outline-none"
          >
            {sites.map(s => <option key={s.id} value={s.id}>{s.siteName}</option>)}
          </select>
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-1" />
          Add Livestock
        </Button>
      </div>

      {/* Summary Card */}
      {filteredRecords.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white border border-amber-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-0.5">Total Head</div>
            <div className="text-lg font-bold text-gray-900">{formatNumber(summary.totalHead)} <span className="text-xs font-normal text-gray-500">head</span></div>
          </div>
          <div className="bg-white border border-amber-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-0.5">Total LU</div>
            <div className="text-lg font-bold text-gray-900">{summary.totalLU.toFixed(1)} <span className="text-xs font-normal text-gray-500">LU</span></div>
          </div>
          <div className="bg-white border border-amber-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-0.5">Total Emissions</div>
            <div className="text-lg font-bold text-amber-700">{summary.totalEmissions.toFixed(1)} <span className="text-xs font-normal text-gray-500">tCO&#x2082;e</span></div>
          </div>
        </div>
      )}

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        isAgri ? (
          <div className="border-2 border-dashed border-primary/30 bg-primary-100/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Quick Add — Livestock Record</h3>
            <p className="text-sm text-gray-500 mb-4">Add your first livestock entry. Emissions are calculated automatically.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <Combobox
                  label="Species"
                  value={quickForm.livestockType}
                  onChange={value => setQuickForm(prev => ({ ...prev, livestockType: value as LivestockType }))}
                  options={livestockTypeOptions}
                  placeholder="Search or type a species..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Headcount</label>
                <input
                  type="number"
                  min="1"
                  value={quickForm.headcount}
                  onChange={e => setQuickForm(prev => ({ ...prev, headcount: e.target.value }))}
                  placeholder="0"
                  className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            {parseInt(quickForm.headcount) > 0 && (
              <p className="text-xs text-gray-400 mb-3">
                LU: {(parseInt(quickForm.headcount) * getLivestockEmissionFactors(quickForm.livestockType).luFactor).toFixed(2)} | Est. emissions: {calculateLivestockEmissions([{ livestockType: quickForm.livestockType, headcount: parseInt(quickForm.headcount) } as LivestockRecord]).totalTco2e.toFixed(2)} tCO2e
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                disabled={!quickForm.headcount || parseInt(quickForm.headcount) <= 0}
                onClick={() => {
                  const headcount = parseInt(quickForm.headcount) || 0;
                  const luFactor = getLivestockEmissionFactors(quickForm.livestockType).luFactor;
                  const livestockUnits = headcount * luFactor;
                  addLivestockRecord({
                    id: crypto.randomUUID(),
                    siteId: selectedSiteId,
                    period: new Date().toISOString().slice(0, 7),
                    livestockType: quickForm.livestockType,
                    headcount,
                    livestockUnits,
                    source: 'estimate' as DataSource,
                    confidence: 'medium' as ConfidenceLevel,
                    lastUpdated: new Date().toISOString(),
                  } as LivestockRecord);
                  setQuickForm({ livestockType: 'cattle-dairy', headcount: '' });
                  setToastMessage('Livestock record added');
                  setShowToast(true);
                }}
              >
                Save & Add More
              </Button>
              <button
                type="button"
                onClick={openAddModal}
                className="text-sm text-primary hover:underline"
              >
                Use full form instead
              </button>
            </div>
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={Cow}
              title="No livestock records yet"
              description="Add livestock records to track headcount, livestock units, and estimated emissions."
              actionLabel="Add Livestock Record"
              onAction={openAddModal}
            />
          </Card>
        )
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Period</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Headcount</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">LU</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Avg Wt (kg)</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Grazing (mo)</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Emissions (tCO&#x2082;e)</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Notes</th>
                  <th className="py-2 px-3 font-medium text-gray-600 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, idx) => {
                  const luFactor = getLivestockEmissionFactors(record.livestockType).luFactor;
                  const lu = (record.headcount * luFactor).toFixed(1);
                  const emissions = calculateLivestockEmissions([record]);
                  return (
                    <tr key={record.id} className={cn('border-b border-gray-50', idx % 2 === 1 && 'bg-gray-50/30')}>
                      <td className="py-1.5 px-3 text-gray-600 text-xs">{record.period}</td>
                      <td className="py-1.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          {livestockTypeOptions.find(o => o.value === record.livestockType)?.label || record.livestockType}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right text-gray-900 font-medium">{formatNumber(record.headcount)}</td>
                      <td className="py-1.5 px-3 text-right text-gray-700">{lu}</td>
                      <td className="py-1.5 px-3 text-right text-gray-700">{record.averageWeightKg != null ? record.averageWeightKg : '-'}</td>
                      <td className="py-1.5 px-3 text-right text-gray-700">{record.grazingMonths != null ? record.grazingMonths : '-'}</td>
                      <td className="py-1.5 px-3 text-right text-amber-700 font-medium">{emissions.totalTco2e.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-gray-500 text-xs truncate max-w-[120px]">{record.notes || '-'}</td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEditModal(record)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                            <PencilSimple className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(record.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                            <TrashSimple className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Livestock Record' : 'Add Livestock Record'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Period + Source + Confidence */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Period</label>
              <input
                type="month"
                value={form.period}
                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
              <select
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value as DataSource }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              >
                {dataSourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confidence</label>
              <select
                value={form.confidence}
                onChange={e => setForm(f => ({ ...f, confidence: e.target.value as ConfidenceLevel }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              >
                {confidenceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Livestock Type + Headcount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Combobox
                label="Livestock Type"
                value={form.livestockType}
                onChange={value => setForm(f => ({ ...f, livestockType: value as LivestockType }))}
                options={livestockTypeOptions}
                placeholder="Search or type a species..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Headcount</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.headcount}
                onChange={e => setForm(f => ({ ...f, headcount: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Auto-calculated: LU + Emissions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Livestock Units (auto)</label>
              <div className="w-full text-sm border border-gray-100 rounded-md px-2 py-1.5 bg-gray-50 text-amber-700 font-medium">
                {luDisplay} <span className="text-gray-400 text-xs font-normal">LU</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Est. Emissions (auto)</label>
              <div className="w-full text-sm border border-gray-100 rounded-md px-2 py-1.5 bg-gray-50 text-amber-700 font-medium">
                {emissionsDisplay} <span className="text-gray-400 text-xs font-normal">tCO&#x2082;e</span>
              </div>
            </div>
          </div>

          {/* Average Weight + Grazing Months */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Avg Weight (kg) <span className="text-gray-400">optional</span></label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.averageWeightKg}
                onChange={e => setForm(f => ({ ...f, averageWeightKg: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Grazing Months (0-12) <span className="text-gray-400">optional</span></label>
              <input
                type="number"
                min="0"
                max="12"
                step="1"
                placeholder="0"
                value={form.grazingMonths}
                onChange={e => setForm(f => ({ ...f, grazingMonths: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes <span className="text-gray-400">optional</span></label>
            <textarea
              rows={2}
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!(parseInt(form.headcount) > 0)}
            >
              {editingId ? 'Update' : 'Add'} Record
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ============ MAIN COMPONENT ============
export default function OutputsPage() {
  const { sites, company } = useAppStore();
  const {
    waste,
    productOutputs,
    cropOutputs,
    livestockRecords,
    addWaste,
    updateWaste,
    addProductOutput,
    updateProductOutput,
  } = useDataStore();

  const isAgri = isAgriculturalIndustry(company?.industryCode);

  const [activeTab, setActiveTab] = useState<OutputsTab>('all');
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || '');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dataSource, setDataSource] = useState<DataSource>('invoice');
  const [confidence, setConfidence] = useState<ConfidenceLevel>('high');
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [gridData, setGridData] = useState<Record<string, Record<string, string>>>({});

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const periods = useMemo(() => {
    return MONTHS_SHORT.map((short, i) => ({
      short,
      period: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
      isFuture: selectedYear === currentYear && i > currentMonth,
    }));
  }, [selectedYear, currentYear, currentMonth]);

  const rows = activeTab === 'waste' ? wasteRows : productRows;

  // Get value for a cell
  const getValue = useCallback((period: string, field: string): string => {
    if (gridData[period]?.[field] !== undefined) {
      return gridData[period][field];
    }

    if (activeTab === 'waste') {
      const records = waste.filter(w => w.siteId === selectedSiteId && w.period === period);
      if (field === 'general') return records.filter(w => w.wasteCategory === 'general').reduce((s, w) => s + (w.quantityKg || 0), 0).toString() || '';
      if (field === 'recyclable') return records.filter(w => w.wasteCategory === 'recyclable').reduce((s, w) => s + (w.quantityKg || 0), 0).toString() || '';
      if (field === 'organic') return records.filter(w => w.wasteCategory === 'organic').reduce((s, w) => s + (w.quantityKg || 0), 0).toString() || '';
      if (field === 'hazardous') return records.filter(w => w.wasteCategory === 'hazardous').reduce((s, w) => s + (w.quantityKg || 0), 0).toString() || '';
      return '';
    } else {
      const records = productOutputs.filter(p => p.siteId === selectedSiteId && p.period === period);
      if (field === 'units') return records.reduce((s, p) => s + (p.quantity || 0), 0).toString() || '';
      if (field === 'weight') return records.reduce((s, p) => s + ((p as ProductOutput & { weightKg?: number }).weightKg || 0), 0).toString() || '';
      if (field === 'revenue') return records.reduce((s, p) => s + (p.revenue || 0), 0).toString() || '';
      return '';
    }
  }, [gridData, activeTab, selectedSiteId, waste, productOutputs]);

  const setValue = useCallback((period: string, field: string, value: string) => {
    setGridData(prev => ({
      ...prev,
      [period]: {
        ...prev[period],
        [field]: value,
      },
    }));
    setHasChanges(true);
  }, []);

  const getRowTotal = useCallback((field: string): number => {
    let total = 0;
    periods.forEach(({ period }) => {
      const val = getValue(period, field);
      total += parseFloat(val) || 0;
    });
    return total;
  }, [periods, getValue]);

  // Calculate emissions for waste tab
  const calculateEmissions = useCallback((period: string): number => {
    const general = parseFloat(gridData[period]?.general || getValue(period, 'general')) || 0;
    const recyclable = parseFloat(gridData[period]?.recyclable || getValue(period, 'recyclable')) || 0;
    const organic = parseFloat(gridData[period]?.organic || getValue(period, 'organic')) || 0;
    const hazardous = parseFloat(gridData[period]?.hazardous || getValue(period, 'hazardous')) || 0;

    // Assume general goes to landfill, recyclable to recycling, organic to composting
    const emissions = (
      general * WASTE_EMISSION_FACTORS.landfill +
      recyclable * WASTE_EMISSION_FACTORS.recycling +
      organic * WASTE_EMISSION_FACTORS.composting +
      hazardous * WASTE_EMISSION_FACTORS.incineration
    ) / 1000;

    return emissions;
  }, [gridData, getValue]);

  const totalEmissions = useMemo(() => {
    return periods.reduce((sum, { period }) => sum + calculateEmissions(period), 0);
  }, [periods, calculateEmissions]);

  // Save handler
  const handleSave = async () => {
    if (activeTab === 'all' || activeTab === 'crops' || activeTab === 'livestock') return;

    const now = new Date().toISOString();

    if (activeTab === 'waste') {
      Object.entries(gridData).forEach(([period, values]) => {
        const hasData = Object.values(values).some(v => v !== '');
        if (!hasData) return;

        // For each waste category that has data, create/update a record
        (['general', 'recyclable', 'organic', 'hazardous'] as WasteCategory[]).forEach(category => {
          const quantity = parseFloat(values[category]) || 0;
          if (quantity <= 0) return;

          const existing = waste.find(w =>
            w.siteId === selectedSiteId &&
            w.period === period &&
            w.wasteCategory === category
          );

          const route: DisposalRoute = category === 'recyclable' ? 'recycling'
            : category === 'organic' ? 'composting'
            : category === 'hazardous' ? 'incineration'
            : 'landfill';

          const record: Partial<Waste> = {
            siteId: selectedSiteId,
            period,
            wasteCategory: category,
            quantityKg: quantity,
            disposalRoute: route,
            hazardous: category === 'hazardous',
            source: dataSource,
            confidence,
            lastUpdated: now,
          };

          if (existing) {
            updateWaste(existing.id, record);
          } else {
            addWaste({
              ...record,
              id: crypto.randomUUID(),
            } as Waste);
          }
        });
      });
    } else if (activeTab === 'products') {
      Object.entries(gridData).forEach(([period, values]) => {
        const hasData = Object.values(values).some(v => v !== '');
        if (!hasData) return;

        const units = parseFloat(values.units) || 0;
        const weight = parseFloat(values.weight) || 0;
        const revenue = parseFloat(values.revenue) || 0;

        if (units <= 0 && weight <= 0 && revenue <= 0) return;

        const existing = productOutputs.find(p =>
          p.siteId === selectedSiteId &&
          p.period === period
        );

        const record: Partial<ProductOutput> = {
          siteId: selectedSiteId,
          period,
          productName: 'Total Output',
          quantity: units,
          unit: 'units',
          revenue: revenue || undefined,
          source: dataSource,
          confidence,
          lastUpdated: now,
        };

        if (existing) {
          updateProductOutput(existing.id, record);
        } else if (units > 0 || weight > 0 || revenue > 0) {
          addProductOutput({
            ...record,
            id: crypto.randomUUID(),
          } as ProductOutput);
        }
      });
    }

    setGridData({});
    setHasChanges(false);
    setShowToast(true);
  };

  const totalEntries = waste.length + productOutputs.length + cropOutputs.length + livestockRecords.length;
  const progress = Math.min(100, totalEntries * 5);

  const tabs = useMemo(() => {
    if (isAgri) {
      return [
        { id: 'all' as OutputsTab, label: 'All', icon: ChartBar },
        { id: 'crops' as OutputsTab, label: 'Crops', icon: Plant },
        { id: 'livestock' as OutputsTab, label: 'Livestock', icon: Cow },
        { id: 'waste' as OutputsTab, label: 'Waste', icon: Trash },
        { id: 'products' as OutputsTab, label: 'Products', icon: Package },
      ];
    }
    return [
      { id: 'all' as OutputsTab, label: 'All', icon: ChartBar },
      { id: 'waste' as OutputsTab, label: 'Waste', icon: Trash },
      { id: 'products' as OutputsTab, label: 'Products', icon: Package },
      { id: 'crops' as OutputsTab, label: 'Crops', icon: Plant },
      { id: 'livestock' as OutputsTab, label: 'Livestock', icon: Cow },
    ];
  }, [isAgri]);

  const handleTabChange = (tab: OutputsTab) => {
    setActiveTab(tab);
    setGridData({});
    setHasChanges(false);
  };

  return (
    <>
      <Toast message="Changes saved" show={showToast} onClose={() => setShowToast(false)} />

      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <Link href="/data" className="mt-1 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stack-3 to-stack-5 shadow-sm flex items-center justify-center">
                  <Trash className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Outputs</h1>
              </div>
              <p className="text-gray-500 ml-13">Waste, products, crops and livestock</p>
            </div>
          </div>
        </div>

        {/* Compact stats row */}
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
            <Trash className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{waste.length}</span> waste</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{productOutputs.length}</span> products</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <Plant className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{cropOutputs.length}</span> crops</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <Cow className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{livestockRecords.length}</span> livestock</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
                  isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'all' ? (
          <AllInsightsTab
            waste={waste}
            productOutputs={productOutputs}
            cropOutputs={cropOutputs}
            livestockRecords={livestockRecords}
            onNavigate={handleTabChange}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            sites={sites}
            selectedSiteId={selectedSiteId}
            setSelectedSiteId={setSelectedSiteId}
          />
        ) : activeTab === 'crops' ? (
          <CropOutputsTab
            sites={sites}
            selectedSiteId={selectedSiteId}
            setSelectedSiteId={setSelectedSiteId}
          />
        ) : activeTab === 'livestock' ? (
          <LivestockTab
            sites={sites}
            selectedSiteId={selectedSiteId}
            setSelectedSiteId={setSelectedSiteId}
          />
        ) : (
          <>
            {/* Controls Row */}
            <div className="flex items-center gap-3 mb-3 flex-wrap text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Site:</span>
                <select
                  value={selectedSiteId}
                  onChange={e => { setSelectedSiteId(e.target.value); setGridData({}); setHasChanges(false); }}
                  className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:border-primary focus:outline-none"
                >
                  {sites.map(s => <option key={s.id} value={s.id}>{s.siteName}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => setSelectedYear(y => y - 1)} disabled={selectedYear <= currentYear - 5} className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">&larr;</button>
                <span className="text-sm font-semibold text-primary w-12 text-center">{selectedYear}</span>
                <button onClick={() => setSelectedYear(y => y + 1)} disabled={selectedYear >= currentYear} className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">&rarr;</button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Source:</span>
                <select value={dataSource} onChange={e => setDataSource(e.target.value as DataSource)} className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:border-primary focus:outline-none">
                  {dataSourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Confidence:</span>
                <select value={confidence} onChange={e => setConfidence(e.target.value as ConfidenceLevel)} className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:border-primary focus:outline-none">
                  {confidenceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="flex-1" />

              {hasChanges && <span className="text-xs text-amber-600 font-medium">Unsaved</span>}
              <Button size="sm" onClick={handleSave} disabled={!hasChanges}>Save</Button>
            </div>

            {/* Data Grid */}
            <DataEntryGrid
              rows={rows}
              periods={periods}
              getValue={getValue}
              setValue={setValue}
              getRowTotal={getRowTotal}
              gridData={gridData}
              showEmissions={activeTab === 'waste'}
              calculateEmissions={calculateEmissions}
              totalEmissions={totalEmissions}
            />

            <div className="mt-2 flex justify-end">
              <button className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">
                <Question className="w-3 h-3" />
                Help with {activeTab} data
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
