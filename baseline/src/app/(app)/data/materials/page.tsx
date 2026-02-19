"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Cube, Stack, Package, Wrench, DotsThree, Check, ArrowLeft,
  ChartBar, TrendUp, Calendar, Plus, PencilSimple, Trash, Plant
} from '@phosphor-icons/react';
import { Card, Button, Modal, Input, Select, Combobox, EmptyState } from '@/components/ui';
import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils/cn';
import { isAgriculturalIndustry } from '@/lib/utils/industry';
import { calculateFertiliserEmissions, calculateNBalance } from '@/lib/agricultural-calculations';
import {
  fertiliserTypeOptions as centralFertiliserTypeOptions,
  materialCategoryOptions as centralMaterialCategoryOptions,
} from '@/lib/options';
import type { Material, MaterialInput, MaterialCategory, UnitOfMeasure } from '@/types';
import type { FertiliserApplication, FertiliserType } from '@/types';

type MaterialTab = 'all' | 'raw_material' | 'component' | 'consumable' | 'other' | 'fertiliser';

const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const categoryOptions = [
  { value: 'raw_material', label: 'Raw Material' },
  { value: 'component', label: 'Component' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'other', label: 'Other' },
];

const unitOptions = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 't', label: 'Tonnes (t)' },
  { value: 'L', label: 'Litres (L)' },
  { value: 'm3', label: 'Cubic metres (m³)' },
  { value: 'units', label: 'Units' },
];

const fertiliserTypeOptions = centralFertiliserTypeOptions;


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
  materials,
  materialInputs,
  onNavigate,
  selectedYear,
  setSelectedYear,
  sites,
  selectedSiteId,
  setSelectedSiteId,
  onAddMaterial,
}: {
  materials: Material[];
  materialInputs: MaterialInput[];
  onNavigate: (tab: MaterialTab) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  sites: { id: string; siteName: string }[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  onAddMaterial: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Calculate totals by category
  const totals = useMemo(() => {
    const rawMaterials = materials.filter(m => m.materialCategory === 'raw_material');
    const components = materials.filter(m => m.materialCategory === 'component');
    const consumables = materials.filter(m => m.materialCategory === 'consumable');
    const others = materials.filter(m => m.materialCategory === 'other');

    const getInputsForMaterials = (mats: Material[]) => {
      const matIds = new Set(mats.map(m => m.id));
      return materialInputs.filter(i => matIds.has(i.materialId) && i.siteId === selectedSiteId);
    };

    const rawInputs = getInputsForMaterials(rawMaterials);
    const componentInputs = getInputsForMaterials(components);
    const consumableInputs = getInputsForMaterials(consumables);
    const otherInputs = getInputsForMaterials(others);

    const totalQuantity = materialInputs
      .filter(i => i.siteId === selectedSiteId)
      .reduce((sum, i) => sum + (i.quantity || 0), 0);

    const totalSpend = materialInputs
      .filter(i => i.siteId === selectedSiteId)
      .reduce((sum, i) => sum + (i.cost || 0), 0);

    return {
      raw: { count: rawMaterials.length, inputs: rawInputs.length, quantity: rawInputs.reduce((s, i) => s + (i.quantity || 0), 0) },
      component: { count: components.length, inputs: componentInputs.length, quantity: componentInputs.reduce((s, i) => s + (i.quantity || 0), 0) },
      consumable: { count: consumables.length, inputs: consumableInputs.length, quantity: consumableInputs.reduce((s, i) => s + (i.quantity || 0), 0) },
      other: { count: others.length, inputs: otherInputs.length, quantity: otherInputs.reduce((s, i) => s + (i.quantity || 0), 0) },
      totalQuantity,
      totalSpend,
    };
  }, [materials, materialInputs, selectedSiteId]);

  // Periods for table
  const periods = useMemo(() => {
    return MONTHS_SHORT.map((short, i) => ({
      short,
      period: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
      isFuture: selectedYear === currentYear && i > currentMonth,
    }));
  }, [selectedYear, currentYear, currentMonth]);

  // Get value for combined table
  const getValueForPeriod = useCallback((period: string, category: MaterialCategory): number => {
    const mats = materials.filter(m => m.materialCategory === category);
    const matIds = new Set(mats.map(m => m.id));
    return materialInputs
      .filter(i => matIds.has(i.materialId) && i.siteId === selectedSiteId && i.period === period)
      .reduce((s, i) => s + (i.quantity || 0), 0);
  }, [materials, materialInputs, selectedSiteId]);

  const getRowTotal = useCallback((category: MaterialCategory): number => {
    return periods.reduce((sum, { period }) => sum + getValueForPeriod(period, category), 0);
  }, [periods, getValueForPeriod]);

  const categories = [
    {
      id: 'raw_material' as MaterialTab,
      title: 'Raw Materials',
      icon: Stack,
      gradient: 'from-stack-1 to-stack-2',
      borderColor: 'border-stack-1',
      value: formatNumber(totals.raw.quantity),
      unit: 'kg',
      entries: totals.raw.count,
      subtitle: 'Base inputs',
    },
    {
      id: 'component' as MaterialTab,
      title: 'Components',
      icon: Package,
      gradient: 'from-stack-2 to-stack-3',
      borderColor: 'border-stack-2',
      value: formatNumber(totals.component.quantity),
      unit: 'units',
      entries: totals.component.count,
      subtitle: 'Pre-made parts',
    },
    {
      id: 'consumable' as MaterialTab,
      title: 'Consumables',
      icon: Wrench,
      gradient: 'from-stack-3 to-stack-4',
      borderColor: 'border-stack-3',
      value: formatNumber(totals.consumable.quantity),
      unit: 'units',
      entries: totals.consumable.count,
      subtitle: 'Used up in production',
    },
    {
      id: 'other' as MaterialTab,
      title: 'Other',
      icon: DotsThree,
      gradient: 'from-stack-4 to-stack-5',
      borderColor: 'border-stack-4',
      value: formatNumber(totals.other.quantity),
      unit: '',
      entries: totals.other.count,
      subtitle: 'Miscellaneous',
    },
  ];

  // Combined table rows
  const tableRows = [
    { category: 'raw_material' as MaterialCategory, label: 'Raw Materials', icon: Stack, gradient: 'from-stack-1 to-stack-2' },
    { category: 'component' as MaterialCategory, label: 'Components', icon: Package, gradient: 'from-stack-2 to-stack-3' },
    { category: 'consumable' as MaterialCategory, label: 'Consumables', icon: Wrench, gradient: 'from-stack-3 to-stack-4' },
    { category: 'other' as MaterialCategory, label: 'Other', icon: DotsThree, gradient: 'from-stack-4 to-stack-5' },
  ];

  if (materials.length === 0) {
    return (
      <EmptyState
        icon={Cube}
        title="No materials defined yet"
        description="Start by defining the materials your company purchases, then add quantity records."
        actionLabel="Add First Material"
        onAction={onAddMaterial}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Cards */}
      <div className="grid grid-cols-4 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onNavigate(cat.id)}
              className={cn(
                'text-left p-4 rounded-xl border-2 transition-all',
                cat.borderColor,
                'hover:shadow-md hover:-translate-y-0.5'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br', cat.gradient)}>
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
              <div className="text-xs text-gray-400 mt-1">{cat.entries} materials</div>
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
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-48">Category</th>
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
                const rowTotal = getRowTotal(row.category);
                return (
                  <tr key={row.category} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate(row.category as MaterialTab)}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br', row.gradient)}>
                          <Icon className="w-3.5 h-3.5 text-white" weight="duotone" />
                        </div>
                        <span className="font-medium text-gray-900 hover:text-primary transition-colors">{row.label}</span>
                      </div>
                    </td>
                    {periods.map(({ period, isFuture }, i) => {
                      const val = getValueForPeriod(period, row.category);
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
                      <span className="font-semibold text-gray-900">{formatNumber(rowTotal)}</span>
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

// ============ MATERIAL CATEGORY TAB CONTENT ============
function CategoryTab({
  category,
  materials,
  materialInputs,
  sites,
  selectedSiteId,
  setSelectedSiteId,
  selectedYear,
  setSelectedYear,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onSaveInput,
  showToast,
}: {
  category: MaterialCategory;
  materials: Material[];
  materialInputs: MaterialInput[];
  sites: { id: string; siteName: string }[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  onAddMaterial: () => void;
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (id: string) => void;
  onSaveInput: (materialId: string, period: string, quantity: number) => void;
  showToast: (message: string) => void;
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const categoryMaterials = materials.filter(m => m.materialCategory === category);

  // Local grid state for unsaved changes
  const [localChanges, setLocalChanges] = useState<Record<string, Record<string, number>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const periods = useMemo(() => {
    return MONTHS_SHORT.map((short, i) => ({
      short,
      period: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
      isFuture: selectedYear === currentYear && i > currentMonth,
    }));
  }, [selectedYear, currentYear, currentMonth]);

  const getInputValue = useCallback((materialId: string, period: string): number => {
    // Check local changes first
    if (localChanges[materialId]?.[period] !== undefined) {
      return localChanges[materialId][period];
    }
    // Then check stored data
    const input = materialInputs.find(
      i => i.materialId === materialId && i.siteId === selectedSiteId && i.period === period
    );
    return input?.quantity || 0;
  }, [materialInputs, selectedSiteId, localChanges]);

  const handleCellChange = (materialId: string, period: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalChanges(prev => ({
      ...prev,
      [materialId]: {
        ...(prev[materialId] || {}),
        [period]: numValue,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = () => {
    Object.entries(localChanges).forEach(([materialId, periods]) => {
      Object.entries(periods).forEach(([period, quantity]) => {
        onSaveInput(materialId, period, quantity);
      });
    });
    setLocalChanges({});
    setHasUnsavedChanges(false);
    showToast('Material data saved');
  };

  const getMaterialTotal = useCallback((materialId: string): number => {
    return periods.reduce((sum, { period }) => sum + getInputValue(materialId, period), 0);
  }, [periods, getInputValue]);

  const categoryLabels: Record<MaterialCategory, { title: string; icon: typeof Cube; gradient: string }> = {
    raw_material: { title: 'Raw Materials', icon: Stack, gradient: 'from-stack-1 to-stack-2' },
    component: { title: 'Components', icon: Package, gradient: 'from-stack-2 to-stack-3' },
    consumable: { title: 'Consumables', icon: Wrench, gradient: 'from-stack-3 to-stack-4' },
    other: { title: 'Other', icon: DotsThree, gradient: 'from-stack-4 to-stack-5' },
  };

  const { title, icon: Icon, gradient } = categoryLabels[category];

  if (categoryMaterials.length === 0) {
    return (
      <EmptyState
        icon={Cube}
        title={`No ${title.toLowerCase()} defined yet`}
        description="Add your first material to start tracking quantities."
        actionLabel="Add Material"
        onAction={onAddMaterial}
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
          <Button onClick={onAddMaterial} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" weight="bold" />
            Add Material
          </Button>
          <Button onClick={handleSaveAll} disabled={!hasUnsavedChanges}>
            <Check className="w-4 h-4 mr-1" weight="bold" />
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
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-56">Material</th>
                <th className="text-center py-3 px-2 font-medium text-gray-500 w-16">Unit</th>
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
              {categoryMaterials.map((material) => {
                const rowTotal = getMaterialTotal(material.id);
                return (
                  <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br', gradient)}>
                          <Icon className="w-4 h-4 text-white" weight="duotone" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{material.materialName}</div>
                          {material.materialType && (
                            <div className="text-xs text-gray-500">{material.materialType}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-2 px-2">
                      <span className="text-xs text-gray-500">{material.unitOfMeasure}</span>
                    </td>
                    {periods.map(({ period, isFuture }, i) => {
                      const val = getInputValue(material.id, period);
                      const isModified = localChanges[material.id]?.[period] !== undefined;
                      return (
                        <td key={i} className="py-1 px-1">
                          {isFuture ? (
                            <div className="w-14 h-8 mx-auto rounded border border-gray-100 bg-gray-50" />
                          ) : (
                            <input
                              type="number"
                              value={val || ''}
                              onChange={(e) => handleCellChange(material.id, period, e.target.value)}
                              placeholder="—"
                              className={cn(
                                'w-14 h-8 text-center text-xs border rounded focus:outline-none focus:ring-2 focus:ring-primary/50',
                                isModified
                                  ? 'bg-amber-50 border-amber-300'
                                  : val > 0
                                  ? 'bg-primary-100 border-primary-200'
                                  : 'bg-white border-gray-200'
                              )}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="text-right py-2 px-4">
                      <span className="font-semibold text-gray-900">{formatNumber(rowTotal)}</span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditMaterial(material)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <PencilSimple className="w-3.5 h-3.5" weight="duotone" />
                        </button>
                        <button
                          onClick={() => onDeleteMaterial(material.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash className="w-3.5 h-3.5" weight="duotone" />
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

// ============ FERTILISER TAB CONTENT ============
function FertiliserTab({
  sites,
  selectedSiteId,
  setSelectedSiteId,
  selectedYear,
  setSelectedYear,
  showToast,
}: {
  sites: { id: string; siteName: string }[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  showToast: (message: string) => void;
}) {
  const {
    fertiliserApplications,
    addFertiliserApplication,
    updateFertiliserApplication,
    removeFertiliserApplication,
    cropOutputs,
  } = useDataStore();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState<FertiliserApplication | null>(null);
  const [form, setForm] = useState<Partial<FertiliserApplication>>({
    fertiliserType: 'urea',
    productName: '',
    quantityKg: 0,
    areaAppliedHa: undefined,
    nitrogenContentPercent: undefined,
    phosphorusContentPercent: undefined,
    potassiumContentPercent: undefined,
    cost: undefined,
  });
  const [formPeriod, setFormPeriod] = useState(`${selectedYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

  const { company } = useAppStore();
  const isAgri = isAgriculturalIndustry(company?.industryCode);
  const [quickForm, setQuickForm] = useState({
    fertiliserType: 'urea' as FertiliserType,
    quantityKg: '',
    nitrogenContentPercent: '',
  });

  // Filter applications for selected site
  const siteApplications = useMemo(() => {
    return fertiliserApplications.filter(a => a.siteId === selectedSiteId);
  }, [fertiliserApplications, selectedSiteId]);

  // Filter crop outputs for selected site (for N-balance)
  const siteCropOutputs = useMemo(() => {
    return cropOutputs.filter(c => c.siteId === selectedSiteId);
  }, [cropOutputs, selectedSiteId]);

  // Applications for the selected year
  const yearApplications = useMemo(() => {
    return siteApplications.filter(a => a.period.startsWith(`${selectedYear}`));
  }, [siteApplications, selectedYear]);

  // Crop outputs for the selected year
  const yearCropOutputs = useMemo(() => {
    return siteCropOutputs.filter(c => c.period.startsWith(`${selectedYear}`));
  }, [siteCropOutputs, selectedYear]);

  // Emissions and N-balance calculations
  const emissions = useMemo(() => {
    return calculateFertiliserEmissions(yearApplications);
  }, [yearApplications]);

  const nBalance = useMemo(() => {
    return calculateNBalance(yearApplications, yearCropOutputs);
  }, [yearApplications, yearCropOutputs]);

  // Monthly periods
  const periods = useMemo(() => {
    return MONTHS_SHORT.map((short, i) => ({
      short,
      period: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
      isFuture: selectedYear === currentYear && i > currentMonth,
    }));
  }, [selectedYear, currentYear, currentMonth]);

  // Group applications by period for the grid
  const monthlyTotals = useMemo(() => {
    const totals: Record<string, { quantityKg: number; nKg: number; pKg: number; kKg: number; cost: number; count: number }> = {};
    periods.forEach(({ period }) => {
      const apps = yearApplications.filter(a => a.period === period);
      totals[period] = {
        quantityKg: apps.reduce((s, a) => s + a.quantityKg, 0),
        nKg: apps.reduce((s, a) => s + (a.quantityKg * (a.nitrogenContentPercent || 0)) / 100, 0),
        pKg: apps.reduce((s, a) => s + (a.quantityKg * (a.phosphorusContentPercent || 0)) / 100, 0),
        kKg: apps.reduce((s, a) => s + (a.quantityKg * (a.potassiumContentPercent || 0)) / 100, 0),
        cost: apps.reduce((s, a) => s + (a.cost || 0), 0),
        count: apps.length,
      };
    });
    return totals;
  }, [yearApplications, periods]);

  // Summary totals for N/P/K
  const npkTotals = useMemo(() => {
    return {
      totalN: yearApplications.reduce((s, a) => s + (a.quantityKg * (a.nitrogenContentPercent || 0)) / 100, 0),
      totalP: yearApplications.reduce((s, a) => s + (a.quantityKg * (a.phosphorusContentPercent || 0)) / 100, 0),
      totalK: yearApplications.reduce((s, a) => s + (a.quantityKg * (a.potassiumContentPercent || 0)) / 100, 0),
      totalQuantity: yearApplications.reduce((s, a) => s + a.quantityKg, 0),
      totalCost: yearApplications.reduce((s, a) => s + (a.cost || 0), 0),
    };
  }, [yearApplications]);

  const handleOpenAdd = () => {
    setEditingApplication(null);
    setForm({
      fertiliserType: 'urea',
      productName: '',
      quantityKg: 0,
      areaAppliedHa: undefined,
      nitrogenContentPercent: undefined,
      phosphorusContentPercent: undefined,
      potassiumContentPercent: undefined,
      cost: undefined,
    });
    setFormPeriod(`${selectedYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    setShowAddModal(true);
  };

  const handleOpenEdit = (app: FertiliserApplication) => {
    setEditingApplication(app);
    setForm({
      fertiliserType: app.fertiliserType,
      productName: app.productName || '',
      quantityKg: app.quantityKg,
      areaAppliedHa: app.areaAppliedHa,
      nitrogenContentPercent: app.nitrogenContentPercent,
      phosphorusContentPercent: app.phosphorusContentPercent,
      potassiumContentPercent: app.potassiumContentPercent,
      cost: app.cost,
    });
    setFormPeriod(app.period);
    setShowAddModal(true);
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    if (editingApplication) {
      updateFertiliserApplication(editingApplication.id, {
        ...form,
        period: formPeriod,
        lastUpdated: now,
      });
      showToast('Fertiliser application updated');
    } else {
      addFertiliserApplication({
        id: crypto.randomUUID(),
        siteId: selectedSiteId,
        period: formPeriod,
        fertiliserType: form.fertiliserType as FertiliserType,
        productName: form.productName || undefined,
        quantityKg: form.quantityKg || 0,
        areaAppliedHa: form.areaAppliedHa,
        nitrogenContentPercent: form.nitrogenContentPercent,
        phosphorusContentPercent: form.phosphorusContentPercent,
        potassiumContentPercent: form.potassiumContentPercent,
        cost: form.cost,
        source: 'estimate',
        confidence: 'medium',
        lastUpdated: now,
      } as FertiliserApplication);
      showToast('Fertiliser application added');
    }
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    removeFertiliserApplication(id);
    showToast('Fertiliser application removed');
  };

  // Get a label for fertiliser type
  const getFertiliserLabel = (type: FertiliserType): string => {
    return fertiliserTypeOptions.find(o => o.value === type)?.label || type;
  };

  // Period options for the modal
  const periodOptions = useMemo(() => {
    return MONTHS_SHORT.map((short, i) => {
      const month = String(i + 1).padStart(2, '0');
      const fullNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return { value: `${selectedYear}-${month}`, label: `${fullNames[i]} ${selectedYear}` };
    });
  }, [selectedYear]);

  // Grid rows: show individual fertiliser types that have data, plus summary
  const gridRows = useMemo(() => {
    const typesUsed = new Set(yearApplications.map(a => a.fertiliserType));
    return fertiliserTypeOptions.filter(o => typesUsed.has(o.value));
  }, [yearApplications]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-50 border-gray-200 py-3 px-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Plant className="w-4 h-4" weight="duotone" />
            <span className="text-xs font-medium">N Applied</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(Math.round(npkTotals.totalN))}</div>
          <div className="text-xs text-gray-500">kg nitrogen</div>
        </Card>
        <Card className="bg-gray-50 border-gray-200 py-3 px-4">
          <div className="flex items-center gap-2 text-gray-600">
            <TrendUp className="w-4 h-4" weight="duotone" />
            <span className="text-xs font-medium">N&#x2082;O Emissions</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{emissions.n2oEmissionsTco2e.toFixed(2)}</div>
          <div className="text-xs text-gray-500">tCO&#x2082;e</div>
        </Card>
        <Card className="bg-gray-50 border-gray-200 py-3 px-4">
          <div className="flex items-center gap-2 text-gray-600">
            <ChartBar className="w-4 h-4" weight="duotone" />
            <span className="text-xs font-medium">N Balance</span>
          </div>
          <div className={cn(
            'text-2xl font-bold mt-1',
            nBalance.nBalanceKg > 0 ? 'text-amber-800' : 'text-gray-900'
          )}>
            {nBalance.nBalanceKg > 0 ? '+' : ''}{formatNumber(Math.round(nBalance.nBalanceKg))}
          </div>
          <div className="text-xs text-gray-500">
            kg (applied {formatNumber(Math.round(nBalance.nAppliedKg))} - removed {formatNumber(Math.round(nBalance.nRemovedKg))})
          </div>
        </Card>
        <Card className="bg-gray-50 border-gray-200 py-3 px-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" weight="duotone" />
            <span className="text-xs font-medium">Applications</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{yearApplications.length}</div>
          <div className="text-xs text-gray-500">{formatNumber(Math.round(npkTotals.totalQuantity))} kg total</div>
        </Card>
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
        <Button onClick={handleOpenAdd} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" weight="bold" />
          Add Application
        </Button>
      </div>

      {/* Monthly Data Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-48">Metric</th>
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
              </tr>
            </thead>
            <tbody>
              {/* Quantity row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600">
                      <Plant className="w-3.5 h-3.5 text-white" weight="duotone" />
                    </div>
                    <span className="font-medium text-gray-900">Total Applied (kg)</span>
                  </div>
                </td>
                {periods.map(({ period, isFuture }, i) => {
                  const val = monthlyTotals[period]?.quantityKg || 0;
                  return (
                    <td key={i} className="text-center py-2 px-1">
                      <div
                        className={cn(
                          'inline-flex items-center justify-center min-w-[44px] px-2 py-1 rounded border text-xs font-medium',
                          isFuture
                            ? 'bg-gray-50 border-gray-100 text-gray-300'
                            : val > 0
                            ? 'bg-primary-100 border-primary-light text-gray-900'
                            : 'bg-white border-gray-200 text-gray-400'
                        )}
                      >
                        {isFuture ? '—' : val > 0 ? formatNumber(Math.round(val)) : '—'}
                      </div>
                    </td>
                  );
                })}
                <td className="text-right py-3 px-4">
                  <span className="font-semibold text-gray-900">{formatNumber(Math.round(npkTotals.totalQuantity))}</span>
                </td>
              </tr>

              {/* N row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                      <span className="text-[10px] font-bold text-white">N</span>
                    </div>
                    <span className="font-medium text-gray-900">Nitrogen (kg)</span>
                  </div>
                </td>
                {periods.map(({ period, isFuture }, i) => {
                  const val = monthlyTotals[period]?.nKg || 0;
                  return (
                    <td key={i} className="text-center py-2 px-1">
                      <div
                        className={cn(
                          'inline-flex items-center justify-center min-w-[44px] px-2 py-1 rounded border text-xs font-medium',
                          isFuture
                            ? 'bg-gray-50 border-gray-100 text-gray-300'
                            : val > 0
                            ? 'bg-primary-100 border-primary-light text-gray-900'
                            : 'bg-white border-gray-200 text-gray-400'
                        )}
                      >
                        {isFuture ? '—' : val > 0 ? formatNumber(Math.round(val)) : '—'}
                      </div>
                    </td>
                  );
                })}
                <td className="text-right py-3 px-4">
                  <span className="font-semibold text-gray-700">{formatNumber(Math.round(npkTotals.totalN))}</span>
                </td>
              </tr>

              {/* P row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600">
                      <span className="text-[10px] font-bold text-white">P</span>
                    </div>
                    <span className="font-medium text-gray-900">Phosphorus (kg)</span>
                  </div>
                </td>
                {periods.map(({ period, isFuture }, i) => {
                  const val = monthlyTotals[period]?.pKg || 0;
                  return (
                    <td key={i} className="text-center py-2 px-1">
                      <div
                        className={cn(
                          'inline-flex items-center justify-center min-w-[44px] px-2 py-1 rounded border text-xs font-medium',
                          isFuture
                            ? 'bg-gray-50 border-gray-100 text-gray-300'
                            : val > 0
                            ? 'bg-primary-100 border-primary-light text-gray-900'
                            : 'bg-white border-gray-200 text-gray-400'
                        )}
                      >
                        {isFuture ? '—' : val > 0 ? formatNumber(Math.round(val)) : '—'}
                      </div>
                    </td>
                  );
                })}
                <td className="text-right py-3 px-4">
                  <span className="font-semibold text-gray-700">{formatNumber(Math.round(npkTotals.totalP))}</span>
                </td>
              </tr>

              {/* K row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
                      <span className="text-[10px] font-bold text-white">K</span>
                    </div>
                    <span className="font-medium text-gray-900">Potassium (kg)</span>
                  </div>
                </td>
                {periods.map(({ period, isFuture }, i) => {
                  const val = monthlyTotals[period]?.kKg || 0;
                  return (
                    <td key={i} className="text-center py-2 px-1">
                      <div
                        className={cn(
                          'inline-flex items-center justify-center min-w-[44px] px-2 py-1 rounded border text-xs font-medium',
                          isFuture
                            ? 'bg-gray-50 border-gray-100 text-gray-300'
                            : val > 0
                            ? 'bg-primary-100 border-primary-light text-gray-900'
                            : 'bg-white border-gray-200 text-gray-400'
                        )}
                      >
                        {isFuture ? '—' : val > 0 ? formatNumber(Math.round(val)) : '—'}
                      </div>
                    </td>
                  );
                })}
                <td className="text-right py-3 px-4">
                  <span className="font-semibold text-gray-700">{formatNumber(Math.round(npkTotals.totalK))}</span>
                </td>
              </tr>

              {/* Summary row */}
              <tr className="bg-gray-50 font-medium">
                <td className="py-3 px-4">
                  <span className="font-semibold text-gray-700">Total N/P/K (kg)</span>
                </td>
                {periods.map(({ period, isFuture }, i) => {
                  const mt = monthlyTotals[period];
                  const val = mt ? mt.nKg + mt.pKg + mt.kKg : 0;
                  return (
                    <td key={i} className="text-center py-2 px-1">
                      <div
                        className={cn(
                          'inline-flex items-center justify-center min-w-[44px] px-2 py-1 rounded border text-xs font-semibold',
                          isFuture
                            ? 'bg-gray-50 border-gray-100 text-gray-300'
                            : val > 0
                            ? 'bg-gray-200 border-gray-300 text-gray-900'
                            : 'bg-white border-gray-200 text-gray-400'
                        )}
                      >
                        {isFuture ? '—' : val > 0 ? formatNumber(Math.round(val)) : '—'}
                      </div>
                    </td>
                  );
                })}
                <td className="text-right py-3 px-4">
                  <span className="font-bold text-gray-900">
                    {formatNumber(Math.round(npkTotals.totalN + npkTotals.totalP + npkTotals.totalK))}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Application Records List */}
      {yearApplications.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">Application Records ({selectedYear})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {yearApplications
              .sort((a, b) => a.period.localeCompare(b.period))
              .map((app) => (
                <div key={app.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600">
                      <Plant className="w-4 h-4 text-white" weight="duotone" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {getFertiliserLabel(app.fertiliserType)}
                        {app.productName && <span className="text-gray-500 font-normal"> — {app.productName}</span>}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{app.period}</span>
                        <span>·</span>
                        <span>{app.quantityKg} kg</span>
                        {app.areaAppliedHa && (
                          <>
                            <span>·</span>
                            <span>{app.areaAppliedHa} ha</span>
                          </>
                        )}
                        {app.nitrogenContentPercent != null && app.nitrogenContentPercent > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-blue-600">N {app.nitrogenContentPercent}%</span>
                          </>
                        )}
                        {app.phosphorusContentPercent != null && app.phosphorusContentPercent > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600">P {app.phosphorusContentPercent}%</span>
                          </>
                        )}
                        {app.potassiumContentPercent != null && app.potassiumContentPercent > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-purple-600">K {app.potassiumContentPercent}%</span>
                          </>
                        )}
                        {app.cost != null && app.cost > 0 && (
                          <>
                            <span>·</span>
                            <span>{formatNumber(app.cost)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(app)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <PencilSimple className="w-3.5 h-3.5" weight="duotone" />
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash className="w-3.5 h-3.5" weight="duotone" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      ) : isAgri ? (
        <div className="border-2 border-dashed border-primary/30 bg-primary-100/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Quick Add — Fertiliser Application</h3>
          <p className="text-sm text-gray-500 mb-4">Add your first application. N&#x2082;O emissions are calculated automatically.</p>
          <div className="space-y-3">
            <Combobox
              label="Fertiliser Type"
              value={quickForm.fertiliserType}
              onChange={(value) => setQuickForm({ ...quickForm, fertiliserType: value as FertiliserType })}
              options={fertiliserTypeOptions}
              placeholder="Search or type a fertiliser..."
            />
            <Input
              label="Quantity (kg)"
              type="number"
              min={0}
              value={quickForm.quantityKg}
              onChange={(e) => setQuickForm({ ...quickForm, quantityKg: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Nitrogen content (%)"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={quickForm.nitrogenContentPercent}
              onChange={(e) => setQuickForm({ ...quickForm, nitrogenContentPercent: e.target.value })}
              placeholder="e.g., 34"
            />
            {parseFloat(quickForm.quantityKg) > 0 && parseFloat(quickForm.nitrogenContentPercent) > 0 && (
              <p className="text-xs text-gray-400">
                Estimated N&#x2082;O emissions:{' '}
                {calculateFertiliserEmissions([{
                  id: 'preview',
                  siteId: '',
                  period: '',
                  fertiliserType: quickForm.fertiliserType,
                  quantityKg: parseFloat(quickForm.quantityKg),
                  nitrogenContentPercent: parseFloat(quickForm.nitrogenContentPercent),
                  source: 'estimate' as const,
                  confidence: 'medium' as const,
                  lastUpdated: '',
                }]).n2oEmissionsTco2e.toFixed(4)}{' '}
                tCO₂e
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Button
              onClick={() => {
                addFertiliserApplication({
                  id: crypto.randomUUID(),
                  siteId: selectedSiteId,
                  period: new Date().toISOString().slice(0, 7),
                  fertiliserType: quickForm.fertiliserType,
                  quantityKg: parseFloat(quickForm.quantityKg) || 0,
                  nitrogenContentPercent: parseFloat(quickForm.nitrogenContentPercent) || 0,
                  source: 'estimate',
                  confidence: 'medium',
                  lastUpdated: new Date().toISOString(),
                });
                showToast('Fertiliser application added');
                setQuickForm({ fertiliserType: 'urea', quantityKg: '', nitrogenContentPercent: '' });
              }}
              disabled={!quickForm.quantityKg || parseFloat(quickForm.quantityKg) === 0}
            >
              Save & Add More
            </Button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="text-sm text-primary hover:underline"
            >
              Use full form instead
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Plant}
          title="No fertiliser applications recorded"
          description="Add your first fertiliser or input application to start tracking nutrient usage and emissions."
          actionLabel="Add Application"
          onAction={handleOpenAdd}
        />
      )}

      {/* Add/Edit Fertiliser Application Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingApplication ? 'Edit Fertiliser Application' : 'Add Fertiliser Application'}
      >
        <div className="space-y-4">
          <Select
            label="Period"
            value={formPeriod}
            onChange={(e) => setFormPeriod(e.target.value)}
            options={periodOptions}
          />
          <Combobox
            label="Fertiliser Type"
            value={form.fertiliserType as string}
            onChange={(value) => setForm({ ...form, fertiliserType: value as FertiliserType })}
            options={fertiliserTypeOptions}
            placeholder="Search or type a fertiliser..."
          />
          <Input
            label="Product Name (optional)"
            value={form.productName || ''}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
            placeholder="e.g., CAN 27%, Farmyard Manure"
          />
          <Input
            label="Quantity (kg)"
            type="number"
            value={form.quantityKg || ''}
            onChange={(e) => setForm({ ...form, quantityKg: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
          <Input
            label="Area Applied (ha) — optional"
            type="number"
            value={form.areaAppliedHa ?? ''}
            onChange={(e) => setForm({ ...form, areaAppliedHa: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="0"
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="N %"
              type="number"
              value={form.nitrogenContentPercent ?? ''}
              onChange={(e) => setForm({ ...form, nitrogenContentPercent: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0"
              hint="Nitrogen"
            />
            <Input
              label="P %"
              type="number"
              value={form.phosphorusContentPercent ?? ''}
              onChange={(e) => setForm({ ...form, phosphorusContentPercent: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0"
              hint="Phosphorus"
            />
            <Input
              label="K %"
              type="number"
              value={form.potassiumContentPercent ?? ''}
              onChange={(e) => setForm({ ...form, potassiumContentPercent: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0"
              hint="Potassium"
            />
          </div>
          <Input
            label="Cost (optional)"
            type="number"
            value={form.cost ?? ''}
            onChange={(e) => setForm({ ...form, cost: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="0.00"
            hint="In your local currency"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!form.quantityKg || form.quantityKg <= 0}>
            {editingApplication ? 'Update' : 'Add Application'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function MaterialsPage() {
  const { sites, company } = useAppStore();
  const isAgri = isAgriculturalIndustry(company?.industryCode);
  const {
    materials,
    materialInputs,
    addMaterial,
    updateMaterial,
    removeMaterial,
    addMaterialInput,
    updateMaterialInput,
    removeMaterialInput,
  } = useDataStore();

  const [activeTab, setActiveTab] = useState<MaterialTab>('all');
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || '');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [_selectedCategory, _setSelectedCategory] = useState<MaterialCategory>('raw_material');

  const [toastMessage, setToastMessage] = useState('');
  const [showToastState, setShowToastState] = useState(false);

  const [materialForm, setMaterialForm] = useState<Partial<Material>>({
    materialName: '',
    materialCategory: 'raw_material',
    materialType: '',
    unitOfMeasure: 'kg',
  });

  const progress = useMemo(() => {
    if (materials.length === 0) return 0;
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const coveredMonths = new Set(materialInputs.map(i => i.period));
    const covered = months.filter(m => coveredMonths.has(m)).length;
    return Math.round((covered / 12) * 100);
  }, [materials, materialInputs]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setShowToastState(true);
  }, []);

  const handleAddMaterial = (category?: MaterialCategory) => {
    setEditingMaterial(null);
    setMaterialForm({
      materialName: '',
      materialCategory: category || (activeTab !== 'all' && activeTab !== 'fertiliser' ? activeTab as MaterialCategory : 'raw_material'),
      materialType: '',
      unitOfMeasure: 'kg',
    });
    setShowMaterialModal(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setMaterialForm(material);
    setShowMaterialModal(true);
  };

  const handleSaveMaterial = () => {
    const now = new Date().toISOString();
    if (editingMaterial) {
      updateMaterial(editingMaterial.id, { ...materialForm, updatedAt: now });
      showToast('Material updated');
    } else {
      addMaterial({
        ...materialForm,
        id: crypto.randomUUID(),
        companyId: company?.id || '',
        createdAt: now,
        updatedAt: now,
      } as Material);
      showToast('Material added');
    }
    setShowMaterialModal(false);
  };

  const handleDeleteMaterial = (id: string) => {
    removeMaterial(id);
    // Also remove all inputs for this material
    materialInputs.filter((i) => i.materialId === id).forEach((i) => removeMaterialInput(i.id));
    showToast('Material deleted');
  };

  const handleSaveInput = (materialId: string, period: string, quantity: number) => {
    const existing = materialInputs.find(
      i => i.materialId === materialId && i.siteId === selectedSiteId && i.period === period
    );
    const now = new Date().toISOString();

    if (existing) {
      updateMaterialInput(existing.id, { quantity, lastUpdated: now });
    } else if (quantity > 0) {
      const material = materials.find(m => m.id === materialId);
      addMaterialInput({
        id: crypto.randomUUID(),
        materialId,
        siteId: selectedSiteId,
        period,
        quantity,
        unit: material?.unitOfMeasure || 'kg',
        source: 'estimate',
        confidence: 'medium',
        lastUpdated: now,
      } as MaterialInput);
    }
  };

  const tabs = useMemo(() => {
    if (isAgri) {
      return [
        { id: 'all' as MaterialTab, label: 'All', icon: ChartBar },
        { id: 'fertiliser' as MaterialTab, label: 'Fertiliser & Inputs', icon: Plant },
        { id: 'raw_material' as MaterialTab, label: 'Raw Materials', icon: Stack },
        { id: 'component' as MaterialTab, label: 'Components', icon: Package },
        { id: 'consumable' as MaterialTab, label: 'Consumables', icon: Wrench },
        { id: 'other' as MaterialTab, label: 'Other', icon: DotsThree },
      ];
    }
    return [
      { id: 'all' as MaterialTab, label: 'All', icon: ChartBar },
      { id: 'raw_material' as MaterialTab, label: 'Raw Materials', icon: Stack },
      { id: 'component' as MaterialTab, label: 'Components', icon: Package },
      { id: 'consumable' as MaterialTab, label: 'Consumables', icon: Wrench },
      { id: 'other' as MaterialTab, label: 'Other', icon: DotsThree },
      { id: 'fertiliser' as MaterialTab, label: 'Fertiliser & Inputs', icon: Plant },
    ];
  }, [isAgri]);

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
            <ArrowLeft className="w-5 h-5" weight="bold" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stack-1 to-stack-2 flex items-center justify-center shadow-sm">
                <Cube className="w-5 h-5 text-white" weight="duotone" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Materials</h1>
            </div>
            <p className="text-gray-500 ml-13">Track raw materials, components, and consumables purchased</p>
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
          <Cube className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{materials.length}</span> materials</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1.5">
          <ChartBar className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{formatNumber(materialInputs.reduce((s, i) => s + (i.quantity || 0), 0))}</span> kg total</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{materialInputs.length}</span> records</span>
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
              <Icon className="w-4 h-4" weight="duotone" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'all' ? (
        <AllInsightsTab
          materials={materials}
          materialInputs={materialInputs}
          onNavigate={setActiveTab}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          sites={sites}
          selectedSiteId={selectedSiteId}
          setSelectedSiteId={setSelectedSiteId}
          onAddMaterial={() => handleAddMaterial()}
        />
      ) : activeTab === 'fertiliser' ? (
        <FertiliserTab
          sites={sites}
          selectedSiteId={selectedSiteId}
          setSelectedSiteId={setSelectedSiteId}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          showToast={showToast}
        />
      ) : (
        <CategoryTab
          category={activeTab as MaterialCategory}
          materials={materials}
          materialInputs={materialInputs}
          sites={sites}
          selectedSiteId={selectedSiteId}
          setSelectedSiteId={setSelectedSiteId}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          onAddMaterial={() => handleAddMaterial(activeTab as MaterialCategory)}
          onEditMaterial={handleEditMaterial}
          onDeleteMaterial={handleDeleteMaterial}
          onSaveInput={handleSaveInput}
          showToast={showToast}
        />
      )}

      {/* Material Definition Modal */}
      <Modal
        isOpen={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        title={editingMaterial ? 'Edit Material' : 'Add New Material'}
      >
        <div className="space-y-4">
          <Input
            label="Material Name"
            value={materialForm.materialName || ''}
            onChange={(e) => setMaterialForm({ ...materialForm, materialName: e.target.value })}
            placeholder="e.g., Steel coils, Plastic pellets"
          />
          <Select
            label="Category"
            value={materialForm.materialCategory}
            onChange={(e) => setMaterialForm({ ...materialForm, materialCategory: e.target.value as MaterialCategory })}
            options={categoryOptions}
          />
          <Combobox
            label="Material Type"
            value={materialForm.materialType || ''}
            onChange={(value) => setMaterialForm({ ...materialForm, materialType: value })}
            options={centralMaterialCategoryOptions}
            placeholder="e.g., Carbon steel, HDPE"
            hint="Specific type or grade"
          />
          <Select
            label="Unit of Measure"
            value={materialForm.unitOfMeasure}
            onChange={(e) => setMaterialForm({ ...materialForm, unitOfMeasure: e.target.value as UnitOfMeasure })}
            options={unitOptions}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowMaterialModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveMaterial}>{editingMaterial ? 'Update' : 'Add Material'}</Button>
        </div>
      </Modal>

    </div>
  );
}
