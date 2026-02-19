"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Lightning,
  Flame,
  Drop,
  Question,
  Check,
  ArrowLeft,
  ChartBar,
  TrendUp,
  Calendar,
  CurrencyDollar,
} from '@phosphor-icons/react';
import { Card, Button } from '@/components/ui';
import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils/cn';
import type {
  EnergyElectricity,
  EnergyFuel,
  EnergyWater,
  ConfidenceLevel,
  DataSource,
  FuelType,
  WaterSource,
} from '@/types';

type EnergyTab = 'all' | 'electricity' | 'fuels' | 'water';

const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

// Grid emission factor (kg CO2/kWh)
const GRID_FACTOR = 0.4;

const dataSourceOptions = [
  { value: 'bill', label: 'Bill' },
  { value: 'meter', label: 'Meter' },
  { value: 'erp', label: 'ERP' },
  { value: 'estimate', label: 'Est.' },
];

const confidenceOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Med' },
  { value: 'low', label: 'Low' },
];

// Row definitions with tooltips
interface RowConfig {
  id: string;
  label: string;
  unit: string;
  type: 'number' | 'checkbox';
  sum: boolean;
  tip: string;
  fuelType?: FuelType;
}

const electricityRows: RowConfig[] = [
  { id: 'consumptionKwh', label: 'Consumption', unit: 'kWh', type: 'number', sum: true,
    tip: 'Total electricity consumed from all sources' },
  { id: 'sourceGridPercent', label: 'Grid', unit: '%', type: 'number', sum: false,
    tip: 'Percentage from standard grid (default 100%)' },
  { id: 'sourceOnsiteRenewablePercent', label: 'On-site RE', unit: '%', type: 'number', sum: false,
    tip: 'Solar panels, wind turbines on your premises' },
  { id: 'sourcePpaPercent', label: 'PPA', unit: '%', type: 'number', sum: false,
    tip: 'Power Purchase Agreement with renewable supplier' },
  { id: 'greenTariff', label: 'Green Tariff', unit: '', type: 'checkbox', sum: false,
    tip: 'Check if your grid supplier provides certified renewable energy' },
  { id: 'cost', label: 'Cost', unit: '€', type: 'number', sum: true,
    tip: 'Total electricity cost for the month' },
];

const fuelRows: RowConfig[] = [
  { id: 'natural_gas', label: 'Natural Gas', unit: 'kWh', type: 'number', sum: true, fuelType: 'natural_gas',
    tip: 'Gas for heating or processes' },
  { id: 'diesel', label: 'Diesel', unit: 'L', type: 'number', sum: true, fuelType: 'diesel',
    tip: 'Diesel for vehicles or generators' },
  { id: 'petrol', label: 'Petrol', unit: 'L', type: 'number', sum: true, fuelType: 'petrol',
    tip: 'Petrol/gasoline for vehicles' },
  { id: 'lpg', label: 'LPG', unit: 'L', type: 'number', sum: true, fuelType: 'lpg',
    tip: 'Liquefied petroleum gas' },
  { id: 'heating_oil', label: 'Heating Oil', unit: 'L', type: 'number', sum: true, fuelType: 'heating_oil',
    tip: 'Oil for heating systems' },
];

const waterRows: RowConfig[] = [
  { id: 'withdrawalM3', label: 'Withdrawal', unit: 'm³', type: 'number', sum: true,
    tip: 'Total water intake from all sources' },
  { id: 'dischargeM3', label: 'Discharge', unit: 'm³', type: 'number', sum: true,
    tip: 'Water returned to environment or sewer' },
  { id: 'cost', label: 'Cost', unit: '€', type: 'number', sum: true,
    tip: 'Total water and wastewater cost' },
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
        <Check className="w-4 h-4" weight="bold" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

// Format large numbers compactly
function formatNumber(n: number): string {
  if (n === 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ============ ALL/INSIGHTS TAB CONTENT ============
function AllInsightsTab({
  energyElectricity,
  energyFuels,
  energyWater,
  onNavigate,
  selectedYear,
  setSelectedYear,
  sites,
  selectedSiteId,
  setSelectedSiteId,
}: {
  energyElectricity: EnergyElectricity[];
  energyFuels: EnergyFuel[];
  energyWater: EnergyWater[];
  onNavigate: (tab: EnergyTab) => void;
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
    const electricityTotal = energyElectricity.reduce((sum, e) => sum + (e.consumptionKwh || 0), 0);
    const electricityCost = energyElectricity.reduce((sum, e) => sum + (e.cost || 0), 0);
    const fuelTotal = energyFuels.reduce((sum, f) => sum + (f.quantity || 0), 0);
    const fuelCost = energyFuels.reduce((sum, f) => sum + (f.cost || 0), 0);
    const waterTotal = energyWater.reduce((sum, w) => sum + (w.withdrawalM3 || 0), 0);
    const waterCost = energyWater.reduce((sum, w) => sum + (w.cost || 0), 0);

    // Calculate Scope 2 estimate
    const scope2 = energyElectricity.reduce((sum, e) => {
      const gridPercent = e.greenTariff ? 0 : (e.sourceGridPercent || 100);
      return sum + (e.consumptionKwh * (gridPercent / 100) * GRID_FACTOR / 1000);
    }, 0);

    return {
      electricity: { total: electricityTotal, cost: electricityCost, entries: energyElectricity.length },
      fuels: { total: fuelTotal, cost: fuelCost, entries: energyFuels.length },
      water: { total: waterTotal, cost: waterCost, entries: energyWater.length },
      scope2,
      totalCost: electricityCost + fuelCost + waterCost,
    };
  }, [energyElectricity, energyFuels, energyWater]);

  // Generate periods for the combined table
  const periods = useMemo(() => {
    return MONTHS_SHORT.map((short, i) => ({
      short,
      period: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
      isFuture: selectedYear === currentYear && i > currentMonth,
    }));
  }, [selectedYear, currentYear, currentMonth]);

  // Get value for combined table
  const getValueForPeriod = useCallback((period: string, field: string): number => {
    if (field === 'electricity') {
      const record = energyElectricity.find(e => e.siteId === selectedSiteId && e.period === period);
      return record?.consumptionKwh || 0;
    } else if (field === 'natural_gas' || field === 'diesel' || field === 'petrol' || field === 'lpg' || field === 'heating_oil') {
      const record = energyFuels.find(f => f.siteId === selectedSiteId && f.period === period && f.fuelType === field);
      return record?.quantity || 0;
    } else if (field === 'water') {
      const record = energyWater.find(w => w.siteId === selectedSiteId && w.period === period);
      return record?.withdrawalM3 || 0;
    } else if (field === 'scope2') {
      const record = energyElectricity.find(e => e.siteId === selectedSiteId && e.period === period);
      if (!record) return 0;
      const gridPercent = record.greenTariff ? 0 : (record.sourceGridPercent || 100);
      return record.consumptionKwh * (gridPercent / 100) * GRID_FACTOR / 1000;
    }
    return 0;
  }, [energyElectricity, energyFuels, energyWater, selectedSiteId]);

  // Row total for combined table
  const getRowTotal = useCallback((field: string): number => {
    return periods.reduce((sum, { period }) => sum + getValueForPeriod(period, field), 0);
  }, [periods, getValueForPeriod]);

  const categories = [
    {
      id: 'electricity' as EnergyTab,
      title: 'Electricity',
      icon: Lightning,
      value: formatNumber(totals.electricity.total),
      unit: 'kWh',
      entries: totals.electricity.entries,
      cost: totals.electricity.cost,
    },
    {
      id: 'fuels' as EnergyTab,
      title: 'Fuels',
      icon: Flame,
      value: formatNumber(totals.fuels.total),
      unit: 'kWh/L',
      entries: totals.fuels.entries,
      cost: totals.fuels.cost,
    },
    {
      id: 'water' as EnergyTab,
      title: 'Water',
      icon: Drop,
      value: formatNumber(totals.water.total),
      unit: 'm³',
      entries: totals.water.entries,
      cost: totals.water.cost,
    },
  ];

  // Combined table rows with icons
  const combinedRows = [
    { id: 'electricity', label: 'Electricity', unit: 'kWh', icon: Lightning, iconColor: 'text-gray-400' },
    { id: 'natural_gas', label: 'Natural Gas', unit: 'kWh', icon: Flame, iconColor: 'text-gray-400' },
    { id: 'diesel', label: 'Diesel', unit: 'L', icon: Flame, iconColor: 'text-gray-400' },
    { id: 'petrol', label: 'Petrol', unit: 'L', icon: Flame, iconColor: 'text-gray-400' },
    { id: 'lpg', label: 'LPG', unit: 'L', icon: Flame, iconColor: 'text-gray-400' },
    { id: 'heating_oil', label: 'Heating Oil', unit: 'L', icon: Flame, iconColor: 'text-gray-400' },
    { id: 'water', label: 'Water', unit: 'm³', icon: Drop, iconColor: 'text-gray-400' },
    { id: 'scope2', label: 'Scope 2', unit: 'tCO₂e', icon: TrendUp, iconColor: 'text-primary' },
  ];

  return (
    <div className="space-y-4">
      {/* Category Cards - Smaller, clickable */}
      <div className="grid grid-cols-3 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onNavigate(cat.id)}
              className={cn(
                'text-left bg-white border-2 rounded-lg p-3 transition-all',
                'border-gray-200',
                'hover:border-primary/40',
                'hover:shadow-sm'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-stack-3 to-stack-4">
                  <Icon className="w-4 h-4 text-white" weight="duotone" />
                </div>
                <span className="text-xs text-gray-400">{cat.entries} entries</span>
              </div>

              <h3 className="font-medium text-gray-900 text-sm">{cat.title}</h3>

              <div className="flex items-end justify-between mt-1">
                <div>
                  <span className="text-lg font-bold text-gray-900">{cat.value}</span>
                  <span className="text-xs text-gray-500 ml-1">{cat.unit}</span>
                </div>
                {cat.cost > 0 && (
                  <span className="text-xs text-gray-500">€{formatNumber(cat.cost)}</span>
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-primary font-medium">Click to enter data →</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls Row for Table */}
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
            className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <span className="text-sm font-semibold text-primary w-12 text-center">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= currentYear}
            className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>

      {/* Combined Data Table (Read-only overview) - matching individual tab style */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-3 font-medium text-gray-600 w-32">
                  Metric
                </th>
                {periods.map(({ short, period, isFuture }) => (
                  <th
                    key={period}
                    className={cn(
                      'py-2 px-0.5 font-medium text-center w-12',
                      isFuture ? 'text-gray-300' : 'text-gray-500'
                    )}
                  >
                    {short}
                  </th>
                ))}
                <th className="py-2 px-3 font-medium text-gray-600 text-right w-16">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {combinedRows.map((row, idx) => {
                const rowTotal = getRowTotal(row.id);
                const Icon = row.icon;
                return (
                  <tr key={row.id} className={cn(
                    'border-b border-gray-50',
                    idx % 2 === 1 && 'bg-gray-50/30',
                    row.id === 'scope2' && 'bg-primary-100 border-t border-primary'
                  )}>
                    <td className="py-1 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', row.iconColor)} />
                        <span className="font-medium">{row.label}</span>
                        <span className="text-gray-400 text-xs">({row.unit})</span>
                      </div>
                    </td>
                    {periods.map(({ period, isFuture }) => {
                      const value = getValueForPeriod(period, row.id);
                      const hasValue = value > 0;
                      return (
                        <td key={period} className="py-0.5 px-0.5">
                          <div
                            className={cn(
                              'w-full h-7 flex items-center justify-center text-center text-xs border rounded',
                              isFuture
                                ? 'bg-gray-50 border-gray-100 text-gray-300'
                                : hasValue
                                  ? 'bg-primary-100 border-primary-light text-gray-700'
                                  : 'bg-white border-gray-200 text-gray-300'
                            )}
                          >
                            {!isFuture && hasValue ? (row.id === 'scope2' ? value.toFixed(1) : formatNumber(value)) : ''}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-1 px-3 text-right font-medium text-gray-700 text-xs">
                      {rowTotal > 0 ? (row.id === 'scope2' ? rowTotal.toFixed(1) : formatNumber(rowTotal)) : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============ DATA ENTRY GRID COMPONENT ============
function DataEntryGrid({
  rows,
  periods,
  getValue,
  setValue,
  getRowTotal,
  gridData,
  showScope2,
  calculateScope2,
  totalScope2,
}: {
  rows: RowConfig[];
  periods: { short: string; period: string; isFuture: boolean }[];
  getValue: (period: string, field: string) => string | boolean;
  setValue: (period: string, field: string, value: string | boolean) => void;
  getRowTotal: (field: string) => number;
  gridData: Record<string, Record<string, string | boolean>>;
  showScope2?: boolean;
  calculateScope2?: (period: string) => number;
  totalScope2?: number;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-2 px-3 font-medium text-gray-600 w-32">
                Metric
              </th>
              {periods.map(({ short, period, isFuture }) => (
                <th
                  key={period}
                  className={cn(
                    'py-2 px-0.5 font-medium text-center w-12',
                    isFuture ? 'text-gray-300' : 'text-gray-500'
                  )}
                >
                  {short}
                </th>
              ))}
              <th className="py-2 px-3 font-medium text-gray-600 text-right w-16">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={cn(
                'border-b border-gray-50',
                idx % 2 === 1 && 'bg-gray-50/30'
              )}>
                <td className="py-1 px-3 text-gray-700">
                  <span
                    className="cursor-help border-b border-dotted border-gray-300"
                    title={row.tip}
                  >
                    {row.label}
                  </span>
                  {row.unit && (
                    <span className="text-gray-400 text-xs ml-1">({row.unit})</span>
                  )}
                </td>
                {periods.map(({ period, isFuture }) => {
                  const cellValue = getValue(period, row.id);
                  const hasValue = row.type === 'checkbox'
                    ? cellValue === true
                    : cellValue !== '' && cellValue !== '0';
                  const isModified = gridData[period]?.[row.id] !== undefined;

                  return (
                    <td key={period} className="py-0.5 px-0.5">
                      {row.type === 'checkbox' ? (
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={cellValue === true}
                            onChange={e => setValue(period, row.id, e.target.checked)}
                            disabled={isFuture}
                            className="rounded border-gray-300 text-primary focus:ring-primary w-3.5 h-3.5"
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={typeof cellValue === 'string' ? cellValue : ''}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setValue(period, row.id, val);
                          }}
                          disabled={isFuture}
                          className={cn(
                            'w-full h-7 text-center text-xs border rounded focus:outline-none transition-colors',
                            isFuture
                              ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                              : isModified
                                ? 'bg-amber-50 border-amber-300 focus:border-primary focus:ring-1 focus:ring-primary/20'
                                : hasValue
                                  ? 'bg-primary-100 border-primary-light focus:border-primary focus:ring-1 focus:ring-primary/20'
                                  : 'bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20'
                          )}
                        />
                      )}
                    </td>
                  );
                })}
                <td className="py-1 px-3 text-right font-medium text-gray-700 text-xs">
                  {row.sum && row.type === 'number' ? formatNumber(getRowTotal(row.id)) : ''}
                </td>
              </tr>
            ))}

            {/* Scope 2 Row for Electricity */}
            {showScope2 && calculateScope2 && (
              <tr className="bg-primary-100 border-t border-primary">
                <td className="py-1.5 px-3 text-primary font-medium text-xs">
                  Scope 2
                  <span className="text-primary/70 ml-1">(tCO₂e)</span>
                </td>
                {periods.map(({ period, isFuture }) => {
                  const scope2 = calculateScope2(period);
                  return (
                    <td key={period} className={cn(
                      'py-1.5 px-0.5 text-center text-xs font-medium',
                      isFuture ? 'text-gray-300' : 'text-primary'
                    )}>
                      {!isFuture && scope2 > 0 ? scope2.toFixed(1) : ''}
                    </td>
                  );
                })}
                <td className="py-1.5 px-3 text-right font-bold text-primary text-xs">
                  {totalScope2 && totalScope2 > 0 ? totalScope2.toFixed(1) : ''}
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
export default function EnergyPage() {
  const { sites } = useAppStore();
  const {
    energyElectricity,
    energyFuels,
    energyWater,
    addEnergyElectricity,
    updateEnergyElectricity,
    addEnergyFuel,
    updateEnergyFuel,
    addEnergyWater,
    updateEnergyWater,
  } = useDataStore();

  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<EnergyTab>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['all', 'electricity', 'fuels', 'water'].includes(tabParam)) {
      return tabParam as EnergyTab;
    }
    return 'all';
  });
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || '');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dataSource, setDataSource] = useState<DataSource>('bill');
  const [confidence, setConfidence] = useState<ConfidenceLevel>('high');
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [gridData, setGridData] = useState<Record<string, Record<string, string | boolean>>>({});

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const periods = useMemo(() => {
    return MONTHS_SHORT.map((short, i) => ({
      short,
      period: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
      isFuture: selectedYear === currentYear && i > currentMonth,
    }));
  }, [selectedYear, currentYear, currentMonth]);

  // Get value for a cell
  const getValue = useCallback((period: string, field: string): string | boolean => {
    if (gridData[period]?.[field] !== undefined) {
      return gridData[period][field];
    }

    if (activeTab === 'electricity') {
      const record = energyElectricity.find(
        e => e.siteId === selectedSiteId && e.period === period
      );
      if (!record) return '';
      const value = record[field as keyof EnergyElectricity];
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value.toString();
      return '';
    } else if (activeTab === 'fuels') {
      const record = energyFuels.find(
        f => f.siteId === selectedSiteId && f.period === period && f.fuelType === field
      );
      return record?.quantity?.toString() ?? '';
    } else {
      const record = energyWater.find(
        w => w.siteId === selectedSiteId && w.period === period
      );
      if (!record) return '';
      const value = record[field as keyof EnergyWater];
      if (typeof value === 'number') return value.toString();
      return '';
    }
  }, [gridData, activeTab, selectedSiteId, energyElectricity, energyFuels, energyWater]);

  const setValue = useCallback((period: string, field: string, value: string | boolean) => {
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
      if (typeof val === 'string') {
        total += parseFloat(val) || 0;
      }
    });
    return total;
  }, [periods, getValue]);

  const calculateScope2 = useCallback((period: string): number => {
    const kwhVal = getValue(period, 'consumptionKwh');
    const gridPercentVal = getValue(period, 'sourceGridPercent');
    const greenTariffVal = getValue(period, 'greenTariff');

    const kwh = typeof kwhVal === 'string' ? parseFloat(kwhVal) || 0 : 0;
    const gridPercent = typeof gridPercentVal === 'string' ? parseFloat(gridPercentVal) || 100 : 100;
    const greenTariff = greenTariffVal === true;

    const effectiveGridPercent = greenTariff ? 0 : gridPercent;
    const gridKwh = kwh * (effectiveGridPercent / 100);

    return gridKwh * GRID_FACTOR / 1000;
  }, [getValue]);

  const totalScope2 = useMemo(() => {
    return periods.reduce((sum, { period }) => sum + calculateScope2(period), 0);
  }, [periods, calculateScope2]);

  // Save handler
  const handleSave = async () => {
    const now = new Date().toISOString();

    if (activeTab === 'electricity') {
      Object.entries(gridData).forEach(([period, values]) => {
        const hasData = Object.values(values).some(v => v !== '' && v !== false);
        if (!hasData) return;

        const existing = energyElectricity.find(
          e => e.siteId === selectedSiteId && e.period === period
        );

        const existingValues = existing || {};

        const record: Partial<EnergyElectricity> = {
          siteId: selectedSiteId,
          period,
          consumptionKwh: parseFloat(values.consumptionKwh as string) || (existingValues as EnergyElectricity).consumptionKwh || 0,
          sourceGridPercent: parseFloat(values.sourceGridPercent as string) || (existingValues as EnergyElectricity).sourceGridPercent || 100,
          sourceOnsiteRenewablePercent: parseFloat(values.sourceOnsiteRenewablePercent as string) || (existingValues as EnergyElectricity).sourceOnsiteRenewablePercent || 0,
          sourcePpaPercent: parseFloat(values.sourcePpaPercent as string) || (existingValues as EnergyElectricity).sourcePpaPercent || 0,
          greenTariff: typeof values.greenTariff === 'boolean' ? values.greenTariff : (existingValues as EnergyElectricity).greenTariff || false,
          cost: parseFloat(values.cost as string) || (existingValues as EnergyElectricity).cost || undefined,
          source: dataSource,
          confidence,
          lastUpdated: now,
        };

        if (existing) {
          updateEnergyElectricity(existing.id, record);
        } else if (record.consumptionKwh && record.consumptionKwh > 0) {
          addEnergyElectricity({
            ...record,
            id: crypto.randomUUID(),
          } as EnergyElectricity);
        }
      });
    } else if (activeTab === 'fuels') {
      Object.entries(gridData).forEach(([period, values]) => {
        Object.entries(values).forEach(([fuelType, quantity]) => {
          if (quantity === '' || quantity === false) return;

          const existing = energyFuels.find(
            f => f.siteId === selectedSiteId && f.period === period && f.fuelType === fuelType
          );

          const quantityNum = parseFloat(quantity as string) || 0;
          if (quantityNum === 0 && !existing) return;

          const record: Partial<EnergyFuel> = {
            siteId: selectedSiteId,
            period,
            fuelType: fuelType as FuelType,
            quantity: quantityNum,
            unit: fuelType === 'natural_gas' || fuelType === 'lpg' ? 'kwh' : 'L',
            purpose: 'heating',
            source: dataSource,
            confidence,
            lastUpdated: now,
          };

          if (existing) {
            updateEnergyFuel(existing.id, record);
          } else if (quantityNum > 0) {
            addEnergyFuel({
              ...record,
              id: crypto.randomUUID(),
            } as EnergyFuel);
          }
        });
      });
    } else if (activeTab === 'water') {
      Object.entries(gridData).forEach(([period, values]) => {
        const hasData = Object.values(values).some(v => v !== '' && v !== false);
        if (!hasData) return;

        const existing = energyWater.find(
          w => w.siteId === selectedSiteId && w.period === period
        );

        const existingValues = existing || {};

        const record: Partial<EnergyWater> = {
          siteId: selectedSiteId,
          period,
          withdrawalM3: parseFloat(values.withdrawalM3 as string) || (existingValues as EnergyWater).withdrawalM3 || 0,
          dischargeM3: parseFloat(values.dischargeM3 as string) || (existingValues as EnergyWater).dischargeM3 || 0,
          waterSource: 'municipal' as WaterSource,
          cost: parseFloat(values.cost as string) || (existingValues as EnergyWater).cost || undefined,
          source: dataSource,
          confidence,
          lastUpdated: now,
        };

        if (existing) {
          updateEnergyWater(existing.id, record);
        } else if (record.withdrawalM3 && record.withdrawalM3 > 0) {
          addEnergyWater({
            ...record,
            id: crypto.randomUUID(),
          } as EnergyWater);
        }
      });
    }

    setGridData({});
    setHasChanges(false);
    setShowToast(true);
  };

  const rows = activeTab === 'electricity' ? electricityRows : activeTab === 'fuels' ? fuelRows : waterRows;
  const totalEntries = energyElectricity.length + energyFuels.length + energyWater.length;
  const progress = Math.min(100, totalEntries * 3);
  const siteOptions = sites.map(s => ({ value: s.id, label: s.siteName }));

  const tabs = [
    { id: 'all' as EnergyTab, label: 'All', icon: ChartBar },
    { id: 'electricity' as EnergyTab, label: 'Electricity', icon: Lightning },
    { id: 'fuels' as EnergyTab, label: 'Fuels', icon: Flame },
    { id: 'water' as EnergyTab, label: 'Water', icon: Drop },
  ];

  const handleTabChange = (tab: EnergyTab) => {
    if (hasChanges) {
      // Could add confirmation dialog here
    }
    setActiveTab(tab);
    setGridData({});
    setHasChanges(false);
  };

  // Inline stats - totals calculated here for the header
  const headerTotals = useMemo(() => {
    const electricityTotal = energyElectricity.reduce((sum, e) => sum + (e.consumptionKwh || 0), 0);
    const scope2 = energyElectricity.reduce((sum, e) => {
      const gridPercent = e.greenTariff ? 0 : (e.sourceGridPercent || 100);
      return sum + (e.consumptionKwh * (gridPercent / 100) * GRID_FACTOR / 1000);
    }, 0);
    return { electricityTotal, scope2 };
  }, [energyElectricity]);

  const coverage = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const coveredMonths = new Set([
      ...energyElectricity.map(e => e.period),
      ...energyFuels.map(f => f.period),
      ...energyWater.map(w => w.period),
    ]);

    const covered = months.filter(m => coveredMonths.has(m)).length;
    return { covered, total: 12, percent: Math.round((covered / 12) * 100) };
  }, [energyElectricity, energyFuels, energyWater]);

  return (
    <>
      <Toast message="Changes saved" show={showToast} onClose={() => setShowToast(false)} />

      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <Link
              href="/data"
              className="mt-1 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" weight="bold" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stack-3 to-stack-4 flex items-center justify-center shadow-sm">
                  <Lightning className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Energy & Utilities</h1>
              </div>
              <p className="text-gray-500 ml-13">Track electricity, fuels, and water consumption across your sites</p>
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
            <Lightning className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{energyElectricity.length}</span> electricity</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{energyFuels.length}</span> fuel</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <Drop className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{energyWater.length}</span> water</span>
          </div>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{formatNumber(headerTotals.electricityTotal)}</span> kWh</span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{headerTotals.scope2.toFixed(1)}</span> tCO₂e</span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-500">{coverage.covered}/{coverage.total} months</span>
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
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="w-4 h-4" weight="duotone" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'all' ? (
          <AllInsightsTab
            energyElectricity={energyElectricity}
            energyFuels={energyFuels}
            energyWater={energyWater}
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
                  onChange={e => {
                    setSelectedSiteId(e.target.value);
                    setGridData({});
                    setHasChanges(false);
                  }}
                  className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:border-primary focus:outline-none"
                >
                  {siteOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedYear(y => y - 1)}
                  disabled={selectedYear <= currentYear - 5}
                  className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <span className="text-sm font-semibold text-primary w-12 text-center">{selectedYear}</span>
                <button
                  onClick={() => setSelectedYear(y => y + 1)}
                  disabled={selectedYear >= currentYear}
                  className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Source:</span>
                <select
                  value={dataSource}
                  onChange={e => setDataSource(e.target.value as DataSource)}
                  className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:border-primary focus:outline-none"
                >
                  {dataSourceOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Confidence:</span>
                <select
                  value={confidence}
                  onChange={e => setConfidence(e.target.value as ConfidenceLevel)}
                  className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:border-primary focus:outline-none"
                >
                  {confidenceOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1" />

              {hasChanges && (
                <span className="text-xs text-amber-600 font-medium">Unsaved</span>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                Save
              </Button>
            </div>

            {/* Data Grid */}
            <DataEntryGrid
              rows={rows}
              periods={periods}
              getValue={getValue}
              setValue={setValue}
              getRowTotal={getRowTotal}
              gridData={gridData}
              showScope2={activeTab === 'electricity'}
              calculateScope2={calculateScope2}
              totalScope2={totalScope2}
            />

            {/* Help link */}
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
