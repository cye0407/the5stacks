"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck, ArrowDownLeft, ArrowUpRight, ArrowsLeftRight, Question, Check, ArrowLeft,
  ChartBar, TrendUp, Path
} from '@phosphor-icons/react';
import { Card, Button, Combobox } from '@/components/ui';
import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils/cn';
import { transportModeOptions as centralTransportModeOptions } from '@/lib/options';
import type {
  TransportLog,
  TransportDirection,
  TransportMode,
  ConfidenceLevel,
  DataSource,
} from '@/types';

type TransportTab = 'all' | 'inbound' | 'outbound' | 'internal';

const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

// Emission factors (kg CO2e per tkm) - simplified
const EMISSION_FACTORS: Record<string, number> = {
  road: 0.1,
  rail: 0.03,
  sea: 0.02,
  air: 0.6,
  multimodal: 0.08,
};

const dataSourceOptions = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'erp', label: 'ERP' },
  { value: 'supplier', label: 'Carrier' },
  { value: 'estimate', label: 'Est.' },
];

const confidenceOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Med' },
  { value: 'low', label: 'Low' },
];

const modeOptions = centralTransportModeOptions;

// Row definitions
interface RowConfig {
  id: string;
  label: string;
  unit: string;
  tip: string;
}

const transportRows: RowConfig[] = [
  { id: 'distanceKm', label: 'Distance', unit: 'km', tip: 'Total distance traveled' },
  { id: 'weightT', label: 'Weight', unit: 't', tip: 'Total weight transported' },
  { id: 'tkm', label: 'Tonne-km', unit: 'tkm', tip: 'Distance × Weight (calculated)' },
  { id: 'spend', label: 'Spend', unit: '€', tip: 'Total transport cost' },
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

function formatNumber(n: number): string {
  if (n === 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ============ ALL/INSIGHTS TAB CONTENT ============
function AllInsightsTab({
  transportLogs,
  onNavigate,
  selectedYear,
  setSelectedYear,
  sites,
  selectedSiteId,
  setSelectedSiteId,
}: {
  transportLogs: TransportLog[];
  onNavigate: (tab: TransportTab) => void;
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
    const inboundLogs = transportLogs.filter(l => l.direction === 'inbound');
    const outboundLogs = transportLogs.filter(l => l.direction === 'outbound');
    const internalLogs = transportLogs.filter(l => l.direction === 'internal');

    const totalTkm = transportLogs.reduce((sum, l) => sum + (l.tkm || 0), 0);
    const totalSpend = transportLogs.reduce((sum, l) => sum + (l.spend || 0), 0);

    // Calculate emissions
    const emissions = transportLogs.reduce((sum, l) => {
      const tkm = l.tkm || 0;
      const factor = EMISSION_FACTORS[l.mode] || 0.1;
      return sum + (tkm * factor / 1000);
    }, 0);

    return {
      inbound: { entries: inboundLogs.length, tkm: inboundLogs.reduce((s, l) => s + (l.tkm || 0), 0) },
      outbound: { entries: outboundLogs.length, tkm: outboundLogs.reduce((s, l) => s + (l.tkm || 0), 0) },
      internal: { entries: internalLogs.length, tkm: internalLogs.reduce((s, l) => s + (l.tkm || 0), 0) },
      totalTkm,
      totalSpend,
      emissions,
    };
  }, [transportLogs]);

  // Periods for table
  const periods = useMemo(() => {
    return MONTHS_SHORT.map((short, i) => ({
      short,
      period: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
      isFuture: selectedYear === currentYear && i > currentMonth,
    }));
  }, [selectedYear, currentYear, currentMonth]);

  // Get value for combined table
  const getValueForPeriod = useCallback((period: string, direction: TransportDirection, field: string): number => {
    const logs = transportLogs.filter(l => l.siteId === selectedSiteId && l.period === period && l.direction === direction);
    if (field === 'distanceKm') return logs.reduce((s, l) => s + (l.distanceKm || 0), 0);
    if (field === 'weightT') return logs.reduce((s, l) => s + (l.weightT || 0), 0);
    if (field === 'tkm') return logs.reduce((s, l) => s + (l.tkm || 0), 0);
    if (field === 'spend') return logs.reduce((s, l) => s + (l.spend || 0), 0);
    if (field === 'emissions') {
      return logs.reduce((s, l) => {
        const tkm = l.tkm || 0;
        const factor = EMISSION_FACTORS[l.mode] || 0.1;
        return s + (tkm * factor / 1000);
      }, 0);
    }
    return 0;
  }, [transportLogs, selectedSiteId]);

  const getRowTotal = useCallback((direction: TransportDirection, field: string): number => {
    return periods.reduce((sum, { period }) => sum + getValueForPeriod(period, direction, field), 0);
  }, [periods, getValueForPeriod]);

  const categories = [
    {
      id: 'inbound' as TransportTab,
      title: 'Inbound',
      icon: ArrowDownLeft,
      gradient: 'from-stack-1 to-stack-3',
      value: formatNumber(totals.inbound.tkm),
      unit: 'tkm',
      entries: totals.inbound.entries,
      subtitle: 'Suppliers to site',
    },
    {
      id: 'outbound' as TransportTab,
      title: 'Outbound',
      icon: ArrowUpRight,
      gradient: 'from-stack-1 to-stack-3',
      value: formatNumber(totals.outbound.tkm),
      unit: 'tkm',
      entries: totals.outbound.entries,
      subtitle: 'Site to customers',
    },
    {
      id: 'internal' as TransportTab,
      title: 'Internal',
      icon: ArrowsLeftRight,
      gradient: 'from-stack-1 to-stack-3',
      value: formatNumber(totals.internal.tkm),
      unit: 'tkm',
      entries: totals.internal.entries,
      subtitle: 'Between sites',
    },
  ];

  // Combined table rows with icons
  const combinedRows = [
    { id: 'inbound', label: 'Inbound', field: 'tkm', unit: 'tkm', icon: ArrowDownLeft, iconColor: 'text-gray-400' },
    { id: 'outbound', label: 'Outbound', field: 'tkm', unit: 'tkm', icon: ArrowUpRight, iconColor: 'text-gray-400' },
    { id: 'internal', label: 'Internal', field: 'tkm', unit: 'tkm', icon: ArrowsLeftRight, iconColor: 'text-gray-400' },
    { id: 'emissions', label: 'Emissions', field: 'emissions', unit: 'tCO₂e', icon: TrendUp, iconColor: 'text-primary' },
  ];

  return (
    <div className="space-y-4">
      {/* Category Cards */}
      <div className="grid grid-cols-3 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onNavigate(cat.id)}
              className={cn(
                'text-left bg-white border-2 rounded-lg p-3 transition-all',
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

              <h3 className="font-medium text-gray-900 text-sm">{cat.title}</h3>
              <p className="text-xs text-gray-500">{cat.subtitle}</p>

              <div className="flex items-end justify-between mt-1">
                <div>
                  <span className="text-lg font-bold text-gray-900">{cat.value}</span>
                  <span className="text-xs text-gray-500 ml-1">{cat.unit}</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-primary font-medium">Click to enter data →</span>
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
            ←
          </button>
          <span className="text-sm font-semibold text-primary w-12 text-center">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= currentYear}
            className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            →
          </button>
        </div>
      </div>

      {/* Combined Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-3 font-medium text-gray-600 w-32">Direction</th>
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
                const rowTotal = row.id === 'emissions'
                  ? (['inbound', 'outbound', 'internal'] as TransportDirection[]).reduce((s, d) => s + getRowTotal(d, 'emissions'), 0)
                  : getRowTotal(row.id as TransportDirection, row.field);
                const isClickable = row.id !== 'emissions';
                return (
                  <tr
                    key={row.id}
                    onClick={isClickable ? () => onNavigate(row.id as TransportTab) : undefined}
                    className={cn(
                      'border-b border-gray-50',
                      idx % 2 === 1 && 'bg-gray-50/30',
                      row.id === 'emissions' && 'bg-primary-100 border-t border-primary',
                      isClickable && 'cursor-pointer hover:bg-gray-50/70 transition-colors'
                    )}
                  >
                    <td className="py-1 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', row.iconColor)} />
                        <span className="font-medium">{row.label}</span>
                        <span className="text-gray-400 text-xs">({row.unit})</span>
                      </div>
                    </td>
                    {periods.map(({ period, isFuture }) => {
                      const value = row.id === 'emissions'
                        ? (['inbound', 'outbound', 'internal'] as TransportDirection[]).reduce((s, d) => s + getValueForPeriod(period, d, 'emissions'), 0)
                        : getValueForPeriod(period, row.id as TransportDirection, row.field);
                      const hasValue = value > 0;
                      return (
                        <td key={period} className="py-0.5 px-0.5">
                          <div className={cn(
                            'w-full h-7 flex items-center justify-center text-center text-xs border rounded',
                            isFuture ? 'bg-gray-50 border-gray-100 text-gray-300'
                              : hasValue ? 'bg-primary-100 border-primary-light text-gray-700'
                              : 'bg-white border-gray-200 text-gray-300'
                          )}>
                            {!isFuture && hasValue ? (row.id === 'emissions' ? value.toFixed(1) : formatNumber(value)) : ''}
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
      {transportLogs.length === 0 && (
        <Card className="bg-primary-100 border-primary border-l-4">
          <h3 className="font-semibold text-gray-900 mb-1">Getting Started</h3>
          <p className="text-sm text-gray-600">
            Click on any category above to start entering transport data. Start with inbound (supplier deliveries) or outbound (customer shipments).
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
                  <span className="text-gray-400 text-xs ml-1">({row.unit})</span>
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
                        disabled={isFuture || row.id === 'tkm'}
                        className={cn(
                          'w-full h-7 text-center text-xs border rounded focus:outline-none transition-colors',
                          row.id === 'tkm' ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                            : isFuture ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
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
                  Emissions <span className="text-primary/70 ml-1">(tCO₂e)</span>
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

// ============ MAIN COMPONENT ============
export default function TransportPage() {
  const { sites } = useAppStore();
  const { transportLogs, addTransportLog, updateTransportLog } = useDataStore();

  const [activeTab, setActiveTab] = useState<TransportTab>('all');
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || '');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMode, setSelectedMode] = useState<TransportMode>('road-hgv');
  const [dataSource, setDataSource] = useState<DataSource>('invoice');
  const [confidence, setConfidence] = useState<ConfidenceLevel>('medium');
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

  const currentDirection = activeTab === 'all' ? undefined : activeTab;

  // Get value for a cell
  const getValue = useCallback((period: string, field: string): string => {
    if (gridData[period]?.[field] !== undefined) {
      return gridData[period][field];
    }

    if (!currentDirection) return '';

    const logs = transportLogs.filter(
      l => l.siteId === selectedSiteId && l.period === period && l.direction === currentDirection
    );

    if (field === 'distanceKm') return logs.reduce((s, l) => s + (l.distanceKm || 0), 0).toString() || '';
    if (field === 'weightT') return logs.reduce((s, l) => s + (l.weightT || 0), 0).toString() || '';
    if (field === 'tkm') return logs.reduce((s, l) => s + (l.tkm || 0), 0).toString() || '';
    if (field === 'spend') return logs.reduce((s, l) => s + (l.spend || 0), 0).toString() || '';

    return '';
  }, [gridData, currentDirection, selectedSiteId, transportLogs]);

  const setValue = useCallback((period: string, field: string, value: string) => {
    setGridData(prev => {
      const newData = {
        ...prev,
        [period]: {
          ...prev[period],
          [field]: value,
        },
      };
      // Auto-calculate tkm
      const distance = parseFloat(newData[period]?.distanceKm || getValue(period, 'distanceKm')) || 0;
      const weight = parseFloat(newData[period]?.weightT || getValue(period, 'weightT')) || 0;
      newData[period] = {
        ...newData[period],
        tkm: (distance * weight).toString(),
      };
      return newData;
    });
    setHasChanges(true);
  }, [getValue]);

  const getRowTotal = useCallback((field: string): number => {
    let total = 0;
    periods.forEach(({ period }) => {
      const val = getValue(period, field);
      total += parseFloat(val) || 0;
    });
    return total;
  }, [periods, getValue]);

  const calculateEmissions = useCallback((period: string): number => {
    const tkmVal = getValue(period, 'tkm');
    const tkm = parseFloat(tkmVal) || 0;
    const factor = EMISSION_FACTORS[selectedMode] || 0.1;
    return tkm * factor / 1000;
  }, [getValue, selectedMode]);

  const totalEmissions = useMemo(() => {
    return periods.reduce((sum, { period }) => sum + calculateEmissions(period), 0);
  }, [periods, calculateEmissions]);

  // Save handler
  const handleSave = async () => {
    if (!currentDirection) return;

    const now = new Date().toISOString();

    Object.entries(gridData).forEach(([period, values]) => {
      const hasData = Object.values(values).some(v => v !== '' && v !== '0');
      if (!hasData) return;

      const existing = transportLogs.find(
        l => l.siteId === selectedSiteId && l.period === period && l.direction === currentDirection
      );

      const distanceKm = parseFloat(values.distanceKm) || 0;
      const weightT = parseFloat(values.weightT) || 0;
      const tkm = distanceKm * weightT;
      const spend = parseFloat(values.spend) || 0;

      const record: Partial<TransportLog> = {
        siteId: selectedSiteId,
        period,
        direction: currentDirection,
        mode: selectedMode,
        distanceKm: distanceKm || undefined,
        weightT: weightT || undefined,
        tkm: tkm || undefined,
        spend: spend || undefined,
        dataType: distanceKm > 0 ? 'activity_based' : 'spend_based',
        source: dataSource,
        confidence,
        lastUpdated: now,
      };

      if (existing) {
        updateTransportLog(existing.id, record);
      } else if (tkm > 0 || spend > 0) {
        addTransportLog({
          ...record,
          id: crypto.randomUUID(),
        } as TransportLog);
      }
    });

    setGridData({});
    setHasChanges(false);
    setShowToast(true);
  };

  const totalEntries = transportLogs.length;
  const progress = Math.min(100, totalEntries * 5);

  const tabs = [
    { id: 'all' as TransportTab, label: 'All', icon: ChartBar },
    { id: 'inbound' as TransportTab, label: 'Inbound', icon: ArrowDownLeft },
    { id: 'outbound' as TransportTab, label: 'Outbound', icon: ArrowUpRight },
    { id: 'internal' as TransportTab, label: 'Internal', icon: ArrowsLeftRight },
  ];

  const handleTabChange = (tab: TransportTab) => {
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stack-1 to-stack-3 shadow-sm flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Transport & Logistics</h1>
              </div>
              <p className="text-gray-500 ml-13">Inbound, outbound, and internal transport</p>
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
            <Truck className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{totalEntries}</span> logs</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <Path className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{formatNumber(transportLogs.reduce((s, l) => s + (l.tkm || 0), 0))}</span> tkm</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <TrendUp className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{transportLogs.reduce((s, l) => { const tkm = l.tkm || 0; const factor = EMISSION_FACTORS[l.mode] || 0.1; return s + (tkm * factor / 1000); }, 0).toFixed(1)}</span> tCO₂e</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
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
            transportLogs={transportLogs}
            onNavigate={handleTabChange}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
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
                <button onClick={() => setSelectedYear(y => y - 1)} disabled={selectedYear <= currentYear - 5} className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">←</button>
                <span className="text-sm font-semibold text-primary w-12 text-center">{selectedYear}</span>
                <button onClick={() => setSelectedYear(y => y + 1)} disabled={selectedYear >= currentYear} className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">→</button>
              </div>

              <div className="flex items-center gap-1.5 min-w-[200px]">
                <span className="text-xs text-gray-500">Mode:</span>
                <div className="flex-1">
                  <Combobox
                    value={selectedMode}
                    onChange={value => setSelectedMode(value as TransportMode)}
                    options={modeOptions}
                    placeholder="Search transport mode..."
                  />
                </div>
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
              rows={transportRows}
              periods={periods}
              getValue={getValue}
              setValue={setValue}
              getRowTotal={getRowTotal}
              gridData={gridData}
              showEmissions={true}
              calculateEmissions={calculateEmissions}
              totalEmissions={totalEmissions}
            />

            <div className="mt-2 flex justify-end">
              <button className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">
                <Question className="w-3 h-3" />
                Help with {activeTab} transport
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
