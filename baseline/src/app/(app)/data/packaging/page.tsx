"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag, Package, Stack, Check, ArrowLeft,
  ChartBar, Calendar, Plus, PencilSimple, Trash, Recycle, BoundingBox
} from '@phosphor-icons/react';
import { Card, Button, Modal, Input, Select, Combobox, EmptyState } from '@/components/ui';
import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils/cn';
import { packagingMaterialOptions as centralPackagingMaterialOptions } from '@/lib/options';
import type { Packaging, PackagingInput, PackagingLevel, PackagingMaterial } from '@/types';

type PackagingTab = 'all' | 'primary' | 'secondary' | 'tertiary';

const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const levelOptions = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'tertiary', label: 'Tertiary' },
];

const materialOptions = centralPackagingMaterialOptions;


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
  packaging,
  packagingInputs,
  onNavigate,
  selectedYear,
  setSelectedYear,
  sites,
  selectedSiteId,
  setSelectedSiteId,
  onAddPackaging,
}: {
  packaging: Packaging[];
  packagingInputs: PackagingInput[];
  onNavigate: (tab: PackagingTab) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  sites: { id: string; siteName: string }[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  onAddPackaging: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Calculate totals by level
  const totals = useMemo(() => {
    const primary = packaging.filter(p => p.packagingLevel === 'primary');
    const secondary = packaging.filter(p => p.packagingLevel === 'secondary');
    const tertiary = packaging.filter(p => p.packagingLevel === 'tertiary');

    const getInputsForPackaging = (pkgs: Packaging[]) => {
      const pkgIds = new Set(pkgs.map(p => p.id));
      return packagingInputs.filter(i => pkgIds.has(i.packagingId) && i.siteId === selectedSiteId);
    };

    const primaryInputs = getInputsForPackaging(primary);
    const secondaryInputs = getInputsForPackaging(secondary);
    const tertiaryInputs = getInputsForPackaging(tertiary);

    const totalWeight = packagingInputs
      .filter(i => i.siteId === selectedSiteId)
      .reduce((sum, i) => sum + (i.totalWeightKg || 0), 0);

    const totalUnits = packagingInputs
      .filter(i => i.siteId === selectedSiteId)
      .reduce((sum, i) => sum + (i.quantityUnits || 0), 0);

    // Calculate recyclability stats
    const allInputs = packagingInputs.filter(i => i.siteId === selectedSiteId);
    const recyclableWeight = allInputs
      .filter(i => {
        const pkg = packaging.find(p => p.id === i.packagingId);
        return pkg && i.recyclabilityClass === 'recyclable';
      })
      .reduce((sum, i) => sum + (i.totalWeightKg || 0), 0);

    return {
      primary: { count: primary.length, weight: primaryInputs.reduce((s, i) => s + (i.totalWeightKg || 0), 0) },
      secondary: { count: secondary.length, weight: secondaryInputs.reduce((s, i) => s + (i.totalWeightKg || 0), 0) },
      tertiary: { count: tertiary.length, weight: tertiaryInputs.reduce((s, i) => s + (i.totalWeightKg || 0), 0) },
      totalWeight,
      totalUnits,
      recyclablePercent: totalWeight > 0 ? Math.round((recyclableWeight / totalWeight) * 100) : 0,
    };
  }, [packaging, packagingInputs, selectedSiteId]);

  // Coverage by month
  const coverage = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const coveredMonths = new Set(packagingInputs.filter(i => i.siteId === selectedSiteId).map(i => i.period));
    const covered = months.filter(m => coveredMonths.has(m)).length;
    return { covered, total: 12, percent: Math.round((covered / 12) * 100) };
  }, [packagingInputs, selectedSiteId]);

  // Periods for table
  const periods = useMemo(() => {
    return MONTHS_SHORT.map((short, i) => ({
      short,
      period: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
      isFuture: selectedYear === currentYear && i > currentMonth,
    }));
  }, [selectedYear, currentYear, currentMonth]);

  // Get value for combined table
  const getValueForPeriod = useCallback((period: string, level: PackagingLevel): number => {
    const pkgs = packaging.filter(p => p.packagingLevel === level);
    const pkgIds = new Set(pkgs.map(p => p.id));
    return packagingInputs
      .filter(i => pkgIds.has(i.packagingId) && i.siteId === selectedSiteId && i.period === period)
      .reduce((s, i) => s + (i.totalWeightKg || 0), 0);
  }, [packaging, packagingInputs, selectedSiteId]);

  const getRowTotal = useCallback((level: PackagingLevel): number => {
    return periods.reduce((sum, { period }) => sum + getValueForPeriod(period, level), 0);
  }, [periods, getValueForPeriod]);

  const categories = [
    {
      id: 'primary' as PackagingTab,
      title: 'Primary',
      icon: Package,
      gradient: 'from-stack-2 to-stack-3',
      value: formatNumber(totals.primary.weight),
      unit: 'kg',
      entries: totals.primary.count,
      subtitle: 'Product packaging',
    },
    {
      id: 'secondary' as PackagingTab,
      title: 'Secondary',
      icon: BoundingBox,
      gradient: 'from-stack-2 to-stack-3',
      value: formatNumber(totals.secondary.weight),
      unit: 'kg',
      entries: totals.secondary.count,
      subtitle: 'Boxes, cases',
    },
    {
      id: 'tertiary' as PackagingTab,
      title: 'Tertiary',
      icon: Stack,
      gradient: 'from-stack-2 to-stack-3',
      value: formatNumber(totals.tertiary.weight),
      unit: 'kg',
      entries: totals.tertiary.count,
      subtitle: 'Pallets, wrap',
    },
  ];

  // Combined table rows
  const tableRows = [
    { level: 'primary' as PackagingLevel, label: 'Primary', icon: Package, iconColor: 'text-gray-400' },
    { level: 'secondary' as PackagingLevel, label: 'Secondary', icon: BoundingBox, iconColor: 'text-gray-400' },
    { level: 'tertiary' as PackagingLevel, label: 'Tertiary', icon: Stack, iconColor: 'text-gray-400' },
  ];

  if (packaging.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="No packaging types defined yet"
        description="Start by defining the packaging types you use, then add quantity records."
        actionLabel="Add First Packaging Type"
        onAction={onAddPackaging}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Cards */}
      <div className="grid grid-cols-3 gap-4">
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
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br', cat.gradient)}>
                  <Icon className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{cat.title}</div>
                  <div className="text-xs text-gray-500">{cat.subtitle}</div>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{cat.value}</span>
                <span className="text-sm text-gray-500">{cat.unit}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{cat.entries} types</div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.siteName}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Combined Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-48">Level</th>
                {periods.map(({ short, isFuture }, i) => (
                  <th
                    key={i}
                    className={cn(
                      'text-center py-3 px-2 font-medium w-14',
                      isFuture ? 'text-gray-300' : 'text-gray-600'
                    )}
                  >
                    {short}
                  </th>
                ))}
                <th className="text-right py-3 px-4 font-medium text-gray-600 w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => {
                const Icon = row.icon;
                const rowTotal = getRowTotal(row.level);
                return (
                  <tr key={row.level} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate(row.level as PackagingTab)}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', row.iconColor)} />
                        <span className="font-medium text-gray-900 hover:text-primary transition-colors">{row.label}</span>
                      </div>
                    </td>
                    {periods.map(({ period, isFuture }, i) => {
                      const val = getValueForPeriod(period, row.level);
                      return (
                        <td key={i} className="text-center py-2 px-1">
                          <div
                            className={cn(
                              'inline-flex items-center justify-center min-w-[44px] px-2 py-1 rounded border text-xs font-medium',
                              isFuture
                                ? 'bg-gray-50 border-gray-100 text-gray-300'
                                : val > 0
                                ? 'bg-primary-100 border-primary-200 text-gray-900'
                                : 'bg-white border-gray-200 text-gray-400'
                            )}
                          >
                            {isFuture ? '—' : val > 0 ? formatNumber(val) : '—'}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-right py-3 px-4">
                      <span className="font-semibold text-gray-900">{formatNumber(rowTotal)} kg</span>
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

// ============ PACKAGING LEVEL TAB CONTENT ============
function LevelTab({
  level,
  packaging,
  packagingInputs,
  sites,
  selectedSiteId,
  setSelectedSiteId,
  selectedYear,
  setSelectedYear,
  onAddPackaging,
  onEditPackaging,
  onDeletePackaging,
  onSaveInput,
  showToast,
}: {
  level: PackagingLevel;
  packaging: Packaging[];
  packagingInputs: PackagingInput[];
  sites: { id: string; siteName: string }[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  onAddPackaging: () => void;
  onEditPackaging: (pkg: Packaging) => void;
  onDeletePackaging: (id: string) => void;
  onSaveInput: (packagingId: string, period: string, units: number, weight: number) => void;
  showToast: (message: string) => void;
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const levelPackaging = packaging.filter(p => p.packagingLevel === level);

  // Local grid state for unsaved changes
  const [localChanges, setLocalChanges] = useState<Record<string, Record<string, { units: number; weight: number }>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const periods = useMemo(() => {
    return MONTHS_SHORT.map((short, i) => ({
      short,
      period: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
      isFuture: selectedYear === currentYear && i > currentMonth,
    }));
  }, [selectedYear, currentYear, currentMonth]);

  const getInputValue = useCallback((packagingId: string, period: string): { units: number; weight: number } => {
    // Check local changes first
    if (localChanges[packagingId]?.[period] !== undefined) {
      return localChanges[packagingId][period];
    }
    // Then check stored data
    const input = packagingInputs.find(
      i => i.packagingId === packagingId && i.siteId === selectedSiteId && i.period === period
    );
    return { units: input?.quantityUnits || 0, weight: input?.totalWeightKg || 0 };
  }, [packagingInputs, selectedSiteId, localChanges]);

  const handleCellChange = (packagingId: string, period: string, field: 'units' | 'weight', value: string) => {
    const numValue = parseFloat(value) || 0;
    const current = getInputValue(packagingId, period);
    setLocalChanges(prev => ({
      ...prev,
      [packagingId]: {
        ...(prev[packagingId] || {}),
        [period]: {
          ...current,
          [field]: numValue,
        },
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = () => {
    Object.entries(localChanges).forEach(([packagingId, periods]) => {
      Object.entries(periods).forEach(([period, { units, weight }]) => {
        onSaveInput(packagingId, period, units, weight);
      });
    });
    setLocalChanges({});
    setHasUnsavedChanges(false);
    showToast('Packaging data saved');
  };

  const getPackagingTotal = useCallback((packagingId: string): number => {
    return periods.reduce((sum, { period }) => sum + getInputValue(packagingId, period).weight, 0);
  }, [periods, getInputValue]);

  const levelLabels: Record<PackagingLevel, { title: string; icon: typeof Tag; color: string }> = {
    primary: { title: 'Primary Packaging', icon: Package, color: 'bg-purple-100 text-purple-700' },
    secondary: { title: 'Secondary Packaging', icon: BoundingBox, color: 'bg-blue-100 text-blue-700' },
    tertiary: { title: 'Tertiary Packaging', icon: Stack, color: 'bg-amber-100 text-amber-700' },
  };

  const { title, icon: Icon, color } = levelLabels[level];

  if (levelPackaging.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title={`No ${title.toLowerCase()} defined yet`}
        description="Add your first packaging type to start tracking."
        actionLabel="Add Packaging Type"
        onAction={onAddPackaging}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.siteName}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
          )}
          <Button onClick={onAddPackaging} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Type
          </Button>
          <Button onClick={handleSaveAll} disabled={!hasUnsavedChanges}>
            <Check className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Data Entry Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-56">Packaging</th>
                <th className="text-center py-3 px-2 font-medium text-gray-500 w-20">Material</th>
                {periods.map(({ short, isFuture }, i) => (
                  <th
                    key={i}
                    className={cn(
                      'text-center py-3 px-1 font-medium w-16',
                      isFuture ? 'text-gray-300' : 'text-gray-600'
                    )}
                  >
                    {short}
                  </th>
                ))}
                <th className="text-right py-3 px-4 font-medium text-gray-600 w-24">Total</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {levelPackaging.map((pkg) => {
                const rowTotal = getPackagingTotal(pkg.id);
                const materialLabel = materialOptions.find(m => m.value === pkg.materialType)?.label || pkg.materialType;
                return (
                  <tr key={pkg.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{pkg.packagingName}</div>
                          {pkg.materialDetail && (
                            <div className="text-xs text-gray-500">{pkg.materialDetail}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-2 px-2">
                      <span className="text-xs text-gray-500">{materialLabel}</span>
                    </td>
                    {periods.map(({ period, isFuture }, i) => {
                      const { weight } = getInputValue(pkg.id, period);
                      const isModified = localChanges[pkg.id]?.[period] !== undefined;
                      return (
                        <td key={i} className="py-1 px-1">
                          {isFuture ? (
                            <div className="w-14 h-8 mx-auto rounded border border-gray-100 bg-gray-50" />
                          ) : (
                            <input
                              type="number"
                              value={weight || ''}
                              onChange={(e) => handleCellChange(pkg.id, period, 'weight', e.target.value)}
                              placeholder="—"
                              title="Weight (kg)"
                              className={cn(
                                'w-14 h-8 text-center text-xs border rounded focus:outline-none focus:ring-2 focus:ring-primary/50',
                                isModified
                                  ? 'bg-amber-50 border-amber-300'
                                  : weight > 0
                                  ? 'bg-primary-100 border-primary-200'
                                  : 'bg-white border-gray-200'
                              )}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="text-right py-2 px-4">
                      <span className="font-semibold text-gray-900">{formatNumber(rowTotal)} kg</span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditPackaging(pkg)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <PencilSimple className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePackaging(pkg.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash className="w-3.5 h-3.5" />
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
    </div>
  );
}

// ============ MAIN PAGE ============
export default function PackagingPage() {
  const { sites, company } = useAppStore();
  const {
    packaging,
    packagingInputs,
    addPackaging,
    updatePackaging,
    removePackaging,
    addPackagingInput,
    updatePackagingInput,
    removePackagingInput,
  } = useDataStore();

  const [activeTab, setActiveTab] = useState<PackagingTab>('all');
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || '');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showPackagingModal, setShowPackagingModal] = useState(false);
  const [editingPackaging, setEditingPackaging] = useState<Packaging | null>(null);

  const [toastMessage, setToastMessage] = useState('');
  const [showToastState, setShowToastState] = useState(false);

  const [packagingForm, setPackagingForm] = useState<Partial<Packaging>>({
    packagingName: '',
    packagingLevel: 'primary',
    materialType: 'cardboard',
    materialDetail: '',
  });

  const progress = useMemo(() => {
    if (packaging.length === 0) return 0;
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const coveredMonths = new Set(packagingInputs.map(i => i.period));
    const covered = months.filter(m => coveredMonths.has(m)).length;
    return Math.round((covered / 12) * 100);
  }, [packaging, packagingInputs]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setShowToastState(true);
  }, []);

  const handleAddPackaging = (level?: PackagingLevel) => {
    setEditingPackaging(null);
    setPackagingForm({
      packagingName: '',
      packagingLevel: level || (activeTab !== 'all' ? activeTab as PackagingLevel : 'primary'),
      materialType: 'cardboard',
      materialDetail: '',
    });
    setShowPackagingModal(true);
  };

  const handleEditPackaging = (pkg: Packaging) => {
    setEditingPackaging(pkg);
    setPackagingForm(pkg);
    setShowPackagingModal(true);
  };

  const handleSavePackaging = () => {
    const now = new Date().toISOString();
    if (editingPackaging) {
      updatePackaging(editingPackaging.id, { ...packagingForm, updatedAt: now });
      showToast('Packaging updated');
    } else {
      addPackaging({
        ...packagingForm,
        id: crypto.randomUUID(),
        companyId: company?.id || '',
        createdAt: now,
        updatedAt: now,
      } as Packaging);
      showToast('Packaging added');
    }
    setShowPackagingModal(false);
  };

  const handleDeletePackaging = (id: string) => {
    removePackaging(id);
    packagingInputs.filter((i) => i.packagingId === id).forEach((i) => removePackagingInput(i.id));
    showToast('Packaging deleted');
  };

  const handleSaveInput = (packagingId: string, period: string, units: number, weight: number) => {
    const existing = packagingInputs.find(
      i => i.packagingId === packagingId && i.siteId === selectedSiteId && i.period === period
    );
    const now = new Date().toISOString();

    if (existing) {
      updatePackagingInput(existing.id, { quantityUnits: units, totalWeightKg: weight, lastUpdated: now });
    } else if (weight > 0 || units > 0) {
      addPackagingInput({
        id: crypto.randomUUID(),
        packagingId,
        siteId: selectedSiteId,
        period,
        quantityUnits: units,
        totalWeightKg: weight,
        source: 'estimate',
        confidence: 'medium',
        lastUpdated: now,
      } as PackagingInput);
    }
  };

  const tabs = [
    { id: 'all' as PackagingTab, label: 'All', icon: ChartBar },
    { id: 'primary' as PackagingTab, label: 'Primary', icon: Package },
    { id: 'secondary' as PackagingTab, label: 'Secondary', icon: BoundingBox },
    { id: 'tertiary' as PackagingTab, label: 'Tertiary', icon: Stack },
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stack-2 to-stack-3 shadow-sm flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" weight="duotone" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Packaging</h1>
            </div>
            <p className="text-gray-500 ml-13">Track primary, secondary, and tertiary packaging materials</p>
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
          <Tag className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{packaging.length}</span> types</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1.5">
          <ChartBar className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{formatNumber(packagingInputs.reduce((s, i) => s + (i.totalWeightKg || 0), 0))}</span> kg total</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{packagingInputs.length}</span> records</span>
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
      {activeTab === 'all' ? (
        <AllInsightsTab
          packaging={packaging}
          packagingInputs={packagingInputs}
          onNavigate={setActiveTab}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          sites={sites}
          selectedSiteId={selectedSiteId}
          setSelectedSiteId={setSelectedSiteId}
          onAddPackaging={() => handleAddPackaging()}
        />
      ) : (
        <LevelTab
          level={activeTab as PackagingLevel}
          packaging={packaging}
          packagingInputs={packagingInputs}
          sites={sites}
          selectedSiteId={selectedSiteId}
          setSelectedSiteId={setSelectedSiteId}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          onAddPackaging={() => handleAddPackaging(activeTab as PackagingLevel)}
          onEditPackaging={handleEditPackaging}
          onDeletePackaging={handleDeletePackaging}
          onSaveInput={handleSaveInput}
          showToast={showToast}
        />
      )}

      {/* Packaging Definition Modal */}
      <Modal
        isOpen={showPackagingModal}
        onClose={() => setShowPackagingModal(false)}
        title={editingPackaging ? 'Edit Packaging Type' : 'Add Packaging Type'}
      >
        <div className="space-y-4">
          <Input
            label="Packaging Name"
            value={packagingForm.packagingName || ''}
            onChange={(e) => setPackagingForm({ ...packagingForm, packagingName: e.target.value })}
            placeholder="e.g., Product boxes, Shrink wrap"
          />
          <Select
            label="Packaging Level"
            value={packagingForm.packagingLevel}
            onChange={(e) => setPackagingForm({ ...packagingForm, packagingLevel: e.target.value as PackagingLevel })}
            options={levelOptions}
          />
          <Combobox
            label="Material Type"
            value={packagingForm.materialType as string}
            onChange={(value) => setPackagingForm({ ...packagingForm, materialType: value as PackagingMaterial })}
            options={materialOptions}
            placeholder="Search or type a material..."
          />
          <Input
            label="Material Detail"
            value={packagingForm.materialDetail || ''}
            onChange={(e) => setPackagingForm({ ...packagingForm, materialDetail: e.target.value })}
            placeholder="e.g., Corrugated, HDPE"
            hint="Specific type or grade (optional)"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowPackagingModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSavePackaging}>{editingPackaging ? 'Update' : 'Add Packaging'}</Button>
        </div>
      </Modal>

      {/* Tips Card */}
      <Card className="mt-8 bg-cream border-forest-300">
        <div className="font-semibold text-forest-700 mb-3">Tips for Better Data</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-900 mb-1">Cover all levels</p>
            <p className="text-gray-600">Primary touches the product, secondary groups products, tertiary is for transport.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Track by weight</p>
            <p className="text-gray-600">Weight data is most useful for emissions calculations.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Note recyclability</p>
            <p className="text-gray-600">Understanding packaging end-of-life helps identify improvement opportunities.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
