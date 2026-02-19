"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, ShieldCheck, GraduationCap, Question, Check, ArrowLeft,
  ChartBar, TrendUp, Calendar, Warning
} from '@phosphor-icons/react';
import { Card, Button } from '@/components/ui';
import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils/cn';
import type {
  Workforce,
  HealthSafety,
  Training,
  ConfidenceLevel,
  DataSource,
} from '@/types';

type WorkforceTab = 'all' | 'headcount' | 'safety' | 'training';

const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const dataSourceOptions = [
  { value: 'erp', label: 'HR' },
  { value: 'other', label: 'Manual' },
  { value: 'estimate', label: 'Est.' },
];

const confidenceOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Med' },
  { value: 'low', label: 'Low' },
];

// Row definitions
interface RowConfig {
  id: string;
  label: string;
  unit: string;
  tip: string;
}

const headcountRows: RowConfig[] = [
  { id: 'totalFte', label: 'Total FTE', unit: 'FTE', tip: 'Full-time equivalent headcount' },
  { id: 'totalHoursWorked', label: 'Hours Worked', unit: 'hrs', tip: 'Total hours worked in month' },
  { id: 'permanentEmployees', label: 'Permanent', unit: '', tip: 'Permanent employees' },
  { id: 'temporaryEmployees', label: 'Temporary', unit: '', tip: 'Temporary/contract employees' },
  { id: 'contractors', label: 'Contractors', unit: '', tip: 'External contractors' },
  { id: 'femalePercent', label: 'Female %', unit: '%', tip: 'Percentage female employees' },
];

const safetyRows: RowConfig[] = [
  { id: 'recordableIncidents', label: 'Recordable', unit: '', tip: 'Total recordable incidents' },
  { id: 'lostTimeIncidents', label: 'Lost Time', unit: '', tip: 'Lost time incidents (LTI)' },
  { id: 'fatalities', label: 'Fatalities', unit: '', tip: 'Work-related fatalities' },
  { id: 'nearMisses', label: 'Near Misses', unit: '', tip: 'Reported near miss events' },
  { id: 'lostDays', label: 'Lost Days', unit: 'days', tip: 'Days lost due to incidents' },
];

const trainingRows: RowConfig[] = [
  { id: 'totalTrainingHours', label: 'Training Hours', unit: 'hrs', tip: 'Total training hours delivered' },
  { id: 'employeesTrained', label: 'Employees Trained', unit: '', tip: 'Number of employees trained' },
  { id: 'safetyTrainingHours', label: 'Safety Training', unit: 'hrs', tip: 'Hours of safety training' },
  { id: 'sustainabilityTrainingHours', label: 'Sustainability', unit: 'hrs', tip: 'Sustainability training hours' },
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

function formatNumber(n: number): string {
  if (n === 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ============ ALL/INSIGHTS TAB CONTENT ============
function AllInsightsTab({
  workforce,
  healthSafety,
  training,
  onNavigate,
  selectedYear,
  setSelectedYear,
  sites,
  selectedSiteId,
  setSelectedSiteId,
}: {
  workforce: Workforce[];
  healthSafety: HealthSafety[];
  training: Training[];
  onNavigate: (tab: WorkforceTab) => void;
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
    const latestWorkforce = workforce.sort((a, b) => b.period.localeCompare(a.period))[0];
    const avgFte = latestWorkforce?.totalFte || 0;
    const totalHours = workforce.reduce((sum, w) => sum + (w.totalHoursWorked || 0), 0);

    const totalIncidents = healthSafety.reduce((sum, h) => sum + (h.recordableIncidents || 0), 0);
    const totalLti = healthSafety.reduce((sum, h) => sum + (h.lostTimeIncidents || 0), 0);

    // Calculate TRIR (Total Recordable Incident Rate) = (incidents * 200,000) / hours worked
    const trir = totalHours > 0 ? (totalIncidents * 200000) / totalHours : 0;

    const totalTrainingHours = training.reduce((sum, t) => sum + (t.totalTrainingHours || 0), 0);
    const trainingPerFte = avgFte > 0 ? totalTrainingHours / avgFte : 0;

    const avgFemalePercent = workforce.length > 0
      ? workforce.reduce((sum, w) => sum + (w.femalePercent || 0), 0) / workforce.length
      : 0;

    return {
      headcount: { entries: workforce.length, avgFte, totalHours },
      safety: { entries: healthSafety.length, totalIncidents, totalLti, trir },
      training: { entries: training.length, totalHours: totalTrainingHours, perFte: trainingPerFte },
      avgFemalePercent,
    };
  }, [workforce, healthSafety, training]);

  // Coverage by month
  const coverage = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const coveredMonths = new Set([
      ...workforce.map(w => w.period),
      ...healthSafety.map(h => h.period),
      ...training.map(t => t.period),
    ]);
    const covered = months.filter(m => coveredMonths.has(m)).length;
    return { covered, total: 12, percent: Math.round((covered / 12) * 100) };
  }, [workforce, healthSafety, training]);

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
    if (field === 'totalFte') {
      const record = workforce.find(w => w.siteId === selectedSiteId && w.period === period);
      return record?.totalFte || 0;
    } else if (field === 'totalHoursWorked') {
      const record = workforce.find(w => w.siteId === selectedSiteId && w.period === period);
      return record?.totalHoursWorked || 0;
    } else if (field === 'recordableIncidents') {
      const record = healthSafety.find(h => h.siteId === selectedSiteId && h.period === period);
      return record?.recordableIncidents || 0;
    } else if (field === 'lostTimeIncidents') {
      const record = healthSafety.find(h => h.siteId === selectedSiteId && h.period === period);
      return record?.lostTimeIncidents || 0;
    } else if (field === 'totalTrainingHours') {
      const record = training.find(t => t.siteId === selectedSiteId && t.period === period);
      return record?.totalTrainingHours || 0;
    } else if (field === 'trir') {
      const wf = workforce.find(w => w.siteId === selectedSiteId && w.period === period);
      const hs = healthSafety.find(h => h.siteId === selectedSiteId && h.period === period);
      if (!wf || !hs) return 0;
      const hours = wf.totalHoursWorked || 0;
      const incidents = hs.recordableIncidents || 0;
      return hours > 0 ? (incidents * 200000) / hours : 0;
    }
    return 0;
  }, [workforce, healthSafety, training, selectedSiteId]);

  const getRowTotal = useCallback((field: string): number => {
    return periods.reduce((sum, { period }) => sum + getValueForPeriod(period, field), 0);
  }, [periods, getValueForPeriod]);

  const categories = [
    {
      id: 'headcount' as WorkforceTab,
      title: 'Headcount',
      icon: Users,
      gradient: 'from-stack-2 to-stack-4',
      value: formatNumber(totals.headcount.avgFte),
      unit: 'FTE',
      entries: totals.headcount.entries,
      subtitle: 'Employees & hours',
    },
    {
      id: 'safety' as WorkforceTab,
      title: 'Health & Safety',
      icon: ShieldCheck,
      gradient: 'from-stack-2 to-stack-4',
      value: totals.safety.totalIncidents.toString(),
      unit: 'incidents',
      entries: totals.safety.entries,
      subtitle: 'Incidents & metrics',
    },
    {
      id: 'training' as WorkforceTab,
      title: 'Training',
      icon: GraduationCap,
      gradient: 'from-stack-2 to-stack-4',
      value: formatNumber(totals.training.totalHours),
      unit: 'hours',
      entries: totals.training.entries,
      subtitle: 'Development hours',
    },
  ];

  // Combined table rows with icons
  const combinedRows = [
    { id: 'totalFte', label: 'Total FTE', unit: '', icon: Users, iconColor: 'text-gray-400', tab: 'headcount' as WorkforceTab },
    { id: 'totalHoursWorked', label: 'Hours Worked', unit: 'hrs', icon: Users, iconColor: 'text-gray-400', tab: 'headcount' as WorkforceTab },
    { id: 'recordableIncidents', label: 'Incidents', unit: '', icon: ShieldCheck, iconColor: 'text-gray-400', tab: 'safety' as WorkforceTab },
    { id: 'lostTimeIncidents', label: 'Lost Time', unit: '', icon: Warning, iconColor: 'text-gray-400', tab: 'safety' as WorkforceTab },
    { id: 'totalTrainingHours', label: 'Training', unit: 'hrs', icon: GraduationCap, iconColor: 'text-gray-400', tab: 'training' as WorkforceTab },
    { id: 'trir', label: 'TRIR', unit: '', icon: TrendUp, iconColor: 'text-primary', tab: 'safety' as WorkforceTab },
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
                const rowTotal = row.id === 'trir'
                  ? totals.safety.trir
                  : getRowTotal(row.id);
                return (
                  <tr
                    key={row.id}
                    onClick={() => onNavigate(row.tab)}
                    className={cn(
                    'border-b border-gray-50 cursor-pointer hover:bg-gray-50/60 transition-colors',
                    idx % 2 === 1 && 'bg-gray-50/30',
                    row.id === 'trir' && 'bg-primary-100 border-t border-primary hover:bg-primary-200/60'
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
                            {!isFuture && hasValue ? (row.id === 'trir' ? value.toFixed(2) : formatNumber(value)) : ''}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-1 px-3 text-right font-medium text-gray-700 text-xs">
                      {rowTotal > 0 ? (row.id === 'trir' ? rowTotal.toFixed(2) : formatNumber(rowTotal)) : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Getting Started */}
      {workforce.length + healthSafety.length + training.length === 0 && (
        <Card className="bg-primary-100 border-primary border-l-4">
          <h3 className="font-semibold text-gray-900 mb-1">Getting Started</h3>
          <p className="text-sm text-gray-600">
            Click on any category above to start entering workforce data. Start with headcount for basic FTE and hours worked.
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
  showTrir,
  calculateTrir,
  totalTrir,
}: {
  rows: RowConfig[];
  periods: { short: string; period: string; isFuture: boolean }[];
  getValue: (period: string, field: string) => string;
  setValue: (period: string, field: string, value: string) => void;
  getRowTotal: (field: string) => number;
  gridData: Record<string, Record<string, string>>;
  showTrir?: boolean;
  calculateTrir?: (period: string) => number;
  totalTrir?: number;
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

            {showTrir && calculateTrir && (
              <tr className="bg-primary-100 border-t border-primary">
                <td className="py-1.5 px-3 text-primary font-medium text-xs">
                  TRIR <span className="text-primary/70 ml-1">(rate)</span>
                </td>
                {periods.map(({ period, isFuture }) => {
                  const trir = calculateTrir(period);
                  return (
                    <td key={period} className={cn('py-1.5 px-0.5 text-center text-xs font-medium', isFuture ? 'text-gray-300' : 'text-primary')}>
                      {!isFuture && trir > 0 ? trir.toFixed(2) : ''}
                    </td>
                  );
                })}
                <td className="py-1.5 px-3 text-right font-bold text-primary text-xs">
                  {totalTrir && totalTrir > 0 ? totalTrir.toFixed(2) : ''}
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
export default function WorkforcePage() {
  const { sites } = useAppStore();
  const {
    workforce,
    healthSafety,
    training,
    addWorkforce,
    updateWorkforce,
    addHealthSafety,
    updateHealthSafety,
    addTraining,
    updateTraining,
  } = useDataStore();

  const [activeTab, setActiveTab] = useState<WorkforceTab>('all');
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || '');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dataSource, setDataSource] = useState<DataSource>('erp');
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

  const rows = activeTab === 'headcount' ? headcountRows : activeTab === 'safety' ? safetyRows : trainingRows;

  // Get value for a cell
  const getValue = useCallback((period: string, field: string): string => {
    if (gridData[period]?.[field] !== undefined) {
      return gridData[period][field];
    }

    if (activeTab === 'headcount') {
      const record = workforce.find(w => w.siteId === selectedSiteId && w.period === period);
      if (!record) return '';
      const value = record[field as keyof Workforce];
      if (typeof value === 'number') return value.toString();
      return '';
    } else if (activeTab === 'safety') {
      const record = healthSafety.find(h => h.siteId === selectedSiteId && h.period === period);
      if (!record) return '';
      const value = record[field as keyof HealthSafety];
      if (typeof value === 'number') return value.toString();
      return '';
    } else {
      const record = training.find(t => t.siteId === selectedSiteId && t.period === period);
      if (!record) return '';
      const value = record[field as keyof Training];
      if (typeof value === 'number') return value.toString();
      return '';
    }
  }, [gridData, activeTab, selectedSiteId, workforce, healthSafety, training]);

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

  // Calculate TRIR for safety tab
  const calculateTrir = useCallback((period: string): number => {
    const wf = workforce.find(w => w.siteId === selectedSiteId && w.period === period);
    const hours = wf?.totalHoursWorked || 0;

    const incidentsVal = gridData[period]?.recordableIncidents ?? getValue(period, 'recordableIncidents');
    const incidents = parseFloat(incidentsVal) || 0;

    return hours > 0 ? (incidents * 200000) / hours : 0;
  }, [workforce, selectedSiteId, gridData, getValue]);

  const totalTrir = useMemo(() => {
    const totalHours = workforce
      .filter(w => w.siteId === selectedSiteId && w.period.startsWith(selectedYear.toString()))
      .reduce((sum, w) => sum + (w.totalHoursWorked || 0), 0);
    const totalIncidents = healthSafety
      .filter(h => h.siteId === selectedSiteId && h.period.startsWith(selectedYear.toString()))
      .reduce((sum, h) => sum + (h.recordableIncidents || 0), 0);
    return totalHours > 0 ? (totalIncidents * 200000) / totalHours : 0;
  }, [workforce, healthSafety, selectedSiteId, selectedYear]);

  // Save handler
  const handleSave = async () => {
    if (activeTab === 'all') return;

    const now = new Date().toISOString();

    if (activeTab === 'headcount') {
      Object.entries(gridData).forEach(([period, values]) => {
        const hasData = Object.values(values).some(v => v !== '');
        if (!hasData) return;

        const existing = workforce.find(w => w.siteId === selectedSiteId && w.period === period);
        const existingValues = existing || {};

        const record: Partial<Workforce> = {
          siteId: selectedSiteId,
          period,
          totalFte: parseFloat(values.totalFte) || (existingValues as Workforce).totalFte || 0,
          totalHoursWorked: parseFloat(values.totalHoursWorked) || (existingValues as Workforce).totalHoursWorked || 0,
          permanentEmployees: parseFloat(values.permanentEmployees) || (existingValues as Workforce).permanentEmployees || undefined,
          temporaryEmployees: parseFloat(values.temporaryEmployees) || (existingValues as Workforce).temporaryEmployees || undefined,
          contractors: parseFloat(values.contractors) || (existingValues as Workforce).contractors || undefined,
          femalePercent: parseFloat(values.femalePercent) || (existingValues as Workforce).femalePercent || undefined,
          source: dataSource,
          confidence,
          lastUpdated: now,
        };

        if (existing) {
          updateWorkforce(existing.id, record);
        } else if (record.totalFte && record.totalFte > 0) {
          addWorkforce({
            ...record,
            id: crypto.randomUUID(),
          } as Workforce);
        }
      });
    } else if (activeTab === 'safety') {
      Object.entries(gridData).forEach(([period, values]) => {
        const hasData = Object.values(values).some(v => v !== '');
        if (!hasData) return;

        const existing = healthSafety.find(h => h.siteId === selectedSiteId && h.period === period);
        const existingValues = existing || {};

        // Get hours from workforce for TRIR calculation
        const wf = workforce.find(w => w.siteId === selectedSiteId && w.period === period);
        const hours = wf?.totalHoursWorked || 0;
        const recordable = parseFloat(values.recordableIncidents) || (existingValues as HealthSafety).recordableIncidents || 0;
        const lti = parseFloat(values.lostTimeIncidents) || (existingValues as HealthSafety).lostTimeIncidents || 0;

        const record: Partial<HealthSafety> = {
          siteId: selectedSiteId,
          period,
          recordableIncidents: recordable,
          lostTimeIncidents: lti,
          fatalities: parseFloat(values.fatalities) || (existingValues as HealthSafety).fatalities || 0,
          nearMisses: parseFloat(values.nearMisses) || (existingValues as HealthSafety).nearMisses || undefined,
          lostDays: parseFloat(values.lostDays) || (existingValues as HealthSafety).lostDays || undefined,
          trir: hours > 0 ? (recordable * 200000) / hours : undefined,
          ltir: hours > 0 ? (lti * 200000) / hours : undefined,
          source: dataSource,
          confidence,
          lastUpdated: now,
        };

        if (existing) {
          updateHealthSafety(existing.id, record);
        } else {
          addHealthSafety({
            ...record,
            id: crypto.randomUUID(),
          } as HealthSafety);
        }
      });
    } else if (activeTab === 'training') {
      Object.entries(gridData).forEach(([period, values]) => {
        const hasData = Object.values(values).some(v => v !== '');
        if (!hasData) return;

        const existing = training.find(t => t.siteId === selectedSiteId && t.period === period);
        const existingValues = existing || {};

        // Get FTE for training per FTE calculation
        const wf = workforce.find(w => w.siteId === selectedSiteId && w.period === period);
        const fte = wf?.totalFte || 0;
        const totalHours = parseFloat(values.totalTrainingHours) || (existingValues as Training).totalTrainingHours || 0;

        const record: Partial<Training> = {
          siteId: selectedSiteId,
          period,
          totalTrainingHours: totalHours,
          employeesTrained: parseFloat(values.employeesTrained) || (existingValues as Training).employeesTrained || undefined,
          safetyTrainingHours: parseFloat(values.safetyTrainingHours) || (existingValues as Training).safetyTrainingHours || undefined,
          sustainabilityTrainingHours: parseFloat(values.sustainabilityTrainingHours) || (existingValues as Training).sustainabilityTrainingHours || undefined,
          trainingHoursPerFte: fte > 0 ? totalHours / fte : undefined,
          source: dataSource,
          confidence,
          lastUpdated: now,
        };

        if (existing) {
          updateTraining(existing.id, record);
        } else if (totalHours > 0) {
          addTraining({
            ...record,
            id: crypto.randomUUID(),
          } as Training);
        }
      });
    }

    setGridData({});
    setHasChanges(false);
    setShowToast(true);
  };

  const totalEntries = workforce.length + healthSafety.length + training.length;
  const progress = Math.min(100, totalEntries * 5);

  const tabs = [
    { id: 'all' as WorkforceTab, label: 'All', icon: ChartBar },
    { id: 'headcount' as WorkforceTab, label: 'Headcount', icon: Users },
    { id: 'safety' as WorkforceTab, label: 'Health & Safety', icon: ShieldCheck },
    { id: 'training' as WorkforceTab, label: 'Training', icon: GraduationCap },
  ];

  const handleTabChange = (tab: WorkforceTab) => {
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stack-2 to-stack-4 shadow-sm flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Workforce</h1>
              </div>
              <p className="text-gray-500 ml-13">Employees, safety, and training</p>
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
            <Users className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{workforce.length}</span> workforce</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{healthSafety.length}</span> H&S</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{training.length}</span> training</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <ChartBar className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
            <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{totalEntries}</span> total</span>
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
            workforce={workforce}
            healthSafety={healthSafety}
            training={training}
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
              showTrir={activeTab === 'safety'}
              calculateTrir={calculateTrir}
              totalTrir={totalTrir}
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
