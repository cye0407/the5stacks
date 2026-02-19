"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Buildings, Factory, Wind, Truck, Monitor, DotsThree, Check, ArrowLeft,
  ChartBar, TrendUp, Plus, PencilSimple, Trash, Lightning, Tree, Drop
} from '@phosphor-icons/react';
import { Card, Button, Modal, Input, Select, TextArea, Badge, EmptyState, Combobox } from '@/components/ui';
import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils/cn';
import { isAgriculturalIndustry } from '@/lib/utils/industry';
import { landUseTypeOptions as centralLandUseTypeOptions } from '@/lib/options';
import type { Asset, AssetCategory, Criticality, MaintenanceFrequency, LandUse, LandType } from '@/types';

type InfrastructureTab = 'all' | 'production_equipment' | 'hvac' | 'vehicles' | 'it' | 'other' | 'land_use';

const categoryOptions = [
  { value: 'production_equipment', label: 'Production Equipment' },
  { value: 'hvac', label: 'HVAC Systems' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'it', label: 'IT Equipment' },
  { value: 'other', label: 'Other' },
];

const criticalityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const maintenanceOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'as_needed', label: 'As Needed' },
];

const landTypeOptions = centralLandUseTypeOptions;

const landTypeColorsMap: Record<string, { bg: string; text: string; border: string }> = {
  arable: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  pasture: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  woodland: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  orchard: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  set_aside: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300' },
  buildings_yards: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  other: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

const defaultLandTypeColor = { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };

function getLandTypeColors(lt: LandType): { bg: string; text: string; border: string } {
  return landTypeColorsMap[lt] || defaultLandTypeColor;
}

function landTypeLabel(lt: LandType): string {
  const found = landTypeOptions.find(o => o.value === lt);
  return found ? found.label : lt;
}

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
  assets,
  onNavigate,
  sites,
  selectedSiteId,
  setSelectedSiteId,
  onAddAsset,
}: {
  assets: Asset[];
  onNavigate: (tab: InfrastructureTab) => void;
  sites: { id: string; siteName: string }[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  onAddAsset: () => void;
}) {
  // Filter assets by site
  const siteAssets = useMemo(() => {
    return assets.filter(a => a.siteId === selectedSiteId);
  }, [assets, selectedSiteId]);

  // Calculate totals by category
  const totals = useMemo(() => {
    const production = siteAssets.filter(a => a.assetCategory === 'production_equipment');
    const hvac = siteAssets.filter(a => a.assetCategory === 'hvac');
    const vehicles = siteAssets.filter(a => a.assetCategory === 'vehicles');
    const it = siteAssets.filter(a => a.assetCategory === 'it');
    const other = siteAssets.filter(a => a.assetCategory === 'other');

    const getEnergy = (list: Asset[]) => list.reduce((s, a) => s + (a.energyConsumptionKwhYear || 0), 0);
    const getCount = (list: Asset[]) => list.reduce((s, a) => s + (a.quantity || 1), 0);

    const totalEnergy = getEnergy(siteAssets);
    const totalUnits = getCount(siteAssets);
    const criticalCount = siteAssets.filter(a => a.criticality === 'critical').length;

    return {
      production: { count: getCount(production), energy: getEnergy(production), assets: production.length },
      hvac: { count: getCount(hvac), energy: getEnergy(hvac), assets: hvac.length },
      vehicles: { count: getCount(vehicles), energy: getEnergy(vehicles), assets: vehicles.length },
      it: { count: getCount(it), energy: getEnergy(it), assets: it.length },
      other: { count: getCount(other), energy: getEnergy(other), assets: other.length },
      totalEnergy,
      totalUnits,
      criticalCount,
    };
  }, [siteAssets]);

  const categories = [
    {
      id: 'production_equipment' as InfrastructureTab,
      title: 'Production',
      icon: Factory,
      gradient: 'from-stack-4 to-stack-5',
      value: totals.production.count,
      unit: 'units',
      assets: totals.production.assets,
      energy: totals.production.energy,
      subtitle: 'Manufacturing equipment',
    },
    {
      id: 'hvac' as InfrastructureTab,
      title: 'HVAC',
      icon: Wind,
      gradient: 'from-stack-4 to-stack-5',
      value: totals.hvac.count,
      unit: 'units',
      assets: totals.hvac.assets,
      energy: totals.hvac.energy,
      subtitle: 'Heating & cooling',
    },
    {
      id: 'vehicles' as InfrastructureTab,
      title: 'Vehicles',
      icon: Truck,
      gradient: 'from-stack-4 to-stack-5',
      value: totals.vehicles.count,
      unit: 'units',
      assets: totals.vehicles.assets,
      energy: totals.vehicles.energy,
      subtitle: 'Fleet & transport',
    },
    {
      id: 'it' as InfrastructureTab,
      title: 'IT',
      icon: Monitor,
      gradient: 'from-stack-4 to-stack-5',
      value: totals.it.count,
      unit: 'units',
      assets: totals.it.assets,
      energy: totals.it.energy,
      subtitle: 'Servers & computers',
    },
    {
      id: 'other' as InfrastructureTab,
      title: 'Other',
      icon: DotsThree,
      gradient: 'from-stack-4 to-stack-5',
      value: totals.other.count,
      unit: 'units',
      assets: totals.other.assets,
      energy: totals.other.energy,
      subtitle: 'Miscellaneous',
    },
  ];

  // Table rows for assets by category
  const tableRows = [
    { category: 'production_equipment' as AssetCategory, label: 'Production Equipment', icon: Factory, iconColor: 'text-gray-400' },
    { category: 'hvac' as AssetCategory, label: 'HVAC Systems', icon: Wind, iconColor: 'text-gray-400' },
    { category: 'vehicles' as AssetCategory, label: 'Vehicles', icon: Truck, iconColor: 'text-gray-400' },
    { category: 'it' as AssetCategory, label: 'IT Equipment', icon: Monitor, iconColor: 'text-gray-400' },
    { category: 'other' as AssetCategory, label: 'Other', icon: DotsThree, iconColor: 'text-gray-400' },
  ];

  if (assets.length === 0) {
    return (
      <EmptyState
        icon={Buildings}
        title="No assets recorded yet"
        description="Add your major equipment and infrastructure assets."
        actionLabel="Add First Asset"
        onAction={onAddAsset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Cards */}
      <div className="grid grid-cols-5 gap-4">
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
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br', cat.gradient)}>
                  <Icon className="w-4 h-4 text-white" weight="duotone" />
                </div>
                <div className="font-semibold text-gray-900 text-sm">{cat.title}</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-900">{cat.value}</span>
                <span className="text-xs text-gray-500">{cat.unit}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{formatNumber(cat.energy)} kWh/yr</div>
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
        </div>
      </div>

      {/* Summary Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Assets</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Units</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Critical</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Est. Energy</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => {
                const Icon = row.icon;
                const categoryAssets = siteAssets.filter(a => a.assetCategory === row.category);
                const unitCount = categoryAssets.reduce((s, a) => s + (a.quantity || 1), 0);
                const criticalCount = categoryAssets.filter(a => a.criticality === 'critical').length;
                const energy = categoryAssets.reduce((s, a) => s + (a.energyConsumptionKwhYear || 0), 0);
                return (
                  <tr key={row.category} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate(row.category as InfrastructureTab)}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', row.iconColor)} />
                        <span className="font-medium text-gray-900 hover:text-primary transition-colors">{row.label}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-gray-700">{categoryAssets.length}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-gray-700">{unitCount}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {criticalCount > 0 ? (
                        <Badge variant="low">{criticalCount}</Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="font-medium text-gray-900">{formatNumber(energy)} kWh</span>
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

// ============ CATEGORY TAB CONTENT ============
function CategoryTab({
  category,
  assets,
  sites,
  selectedSiteId,
  setSelectedSiteId,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
}: {
  category: AssetCategory;
  assets: Asset[];
  sites: { id: string; siteName: string }[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  onAddAsset: () => void;
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
}) {
  const categoryAssets = assets.filter(a => a.assetCategory === category && a.siteId === selectedSiteId);

  const categoryLabels: Record<AssetCategory, { title: string; icon: typeof Buildings; color: string }> = {
    production_equipment: { title: 'Production Equipment', icon: Factory, color: 'bg-blue-100 text-blue-700' },
    hvac: { title: 'HVAC Systems', icon: Wind, color: 'bg-cyan-100 text-cyan-700' },
    vehicles: { title: 'Vehicles', icon: Truck, color: 'bg-amber-100 text-amber-700' },
    it: { title: 'IT Equipment', icon: Monitor, color: 'bg-purple-100 text-purple-700' },
    other: { title: 'Other', icon: DotsThree, color: 'bg-gray-100 text-gray-700' },
  };

  const { title, icon: Icon, color } = categoryLabels[category];

  if (categoryAssets.length === 0) {
    return (
      <EmptyState
        icon={Buildings}
        title={`No ${title.toLowerCase()} defined yet`}
        description="Add your first asset to start tracking."
        actionLabel="Add Asset"
        onAction={onAddAsset}
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
        </div>
        <Button onClick={onAddAsset} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Asset
        </Button>
      </div>

      {/* Asset List */}
      <div className="space-y-3">
        {categoryAssets.map((asset) => {
          return (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{asset.assetName}</span>
                      {asset.criticality && (
                        <Badge
                          variant={
                            asset.criticality === 'critical'
                              ? 'low'
                              : asset.criticality === 'high'
                              ? 'medium'
                              : 'high'
                          }
                        >
                          {asset.criticality}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {asset.assetType && `${asset.assetType} • `}
                      {asset.quantity > 1 ? `${asset.quantity} units` : '1 unit'}
                      {asset.acquisitionYear && ` • Acquired ${asset.acquisitionYear}`}
                    </p>
                    {asset.energyConsumptionKwhYear && (
                      <p className="text-xs text-gray-400 mt-1">
                        Est. {asset.energyConsumptionKwhYear.toLocaleString()} kWh/year
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEditAsset(asset)}>
                    <PencilSimple className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDeleteAsset(asset.id)}>
                    <Trash className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============ LAND USE TAB CONTENT ============
function LandUseTab({
  landUse,
  sites,
  selectedSiteId,
  setSelectedSiteId,
  onAddParcel,
  onEditParcel,
  onDeleteParcel,
}: {
  landUse: LandUse[];
  sites: { id: string; siteName: string }[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  onAddParcel: () => void;
  onEditParcel: (parcel: LandUse) => void;
  onDeleteParcel: (id: string) => void;
}) {
  const { company } = useAppStore();
  const isAgri = isAgriculturalIndustry(company?.industryCode);
  const { addLandUse } = useDataStore();
  const [quickForm, setQuickForm] = useState({
    landType: 'arable-cropland' as LandType,
    areaHa: '',
    fieldName: '',
  });

  const siteParcels = useMemo(() => {
    return landUse.filter(l => l.siteId === selectedSiteId);
  }, [landUse, selectedSiteId]);

  // Summary: total hectares by land type
  const summaryByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const parcel of siteParcels) {
      map[parcel.landType] = (map[parcel.landType] || 0) + parcel.areaHa;
    }
    return Object.entries(map)
      .map(([type, total]) => ({ type: type as LandType, total }))
      .sort((a, b) => b.total - a.total);
  }, [siteParcels]);

  const totalHa = useMemo(() => {
    return siteParcels.reduce((sum, p) => sum + p.areaHa, 0);
  }, [siteParcels]);

  if (siteParcels.length === 0) {
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
          </div>
        </div>
        {isAgri ? (
          <div className="border-2 border-dashed border-primary/30 bg-primary-100/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Quick Add — Land Parcel</h3>
            <p className="text-sm text-gray-500 mb-4">Add your first field with just the basics. You can add detail later.</p>
            <div className="space-y-4">
              <Combobox
                label="Land Type"
                value={quickForm.landType}
                onChange={(value) => setQuickForm({ ...quickForm, landType: value as LandType })}
                options={landTypeOptions}
                placeholder="Search or type a land use..."
              />
              <Input
                label="Area (hectares)"
                type="number"
                min={0}
                step={0.1}
                value={quickForm.areaHa}
                onChange={(e) => setQuickForm({ ...quickForm, areaHa: e.target.value })}
                placeholder="e.g., 12.5"
              />
              <Input
                label="Field Name (optional)"
                value={quickForm.fieldName}
                onChange={(e) => setQuickForm({ ...quickForm, fieldName: e.target.value })}
                placeholder="e.g., North Field"
              />
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => onAddParcel()}
                  className="text-sm text-primary hover:text-primary/80 underline underline-offset-2"
                >
                  Use full form instead
                </button>
                <Button
                  onClick={() => {
                    addLandUse({
                      id: crypto.randomUUID(),
                      siteId: selectedSiteId,
                      landType: quickForm.landType,
                      areaHa: parseFloat(quickForm.areaHa) || 0,
                      fieldName: quickForm.fieldName || undefined,
                      irrigated: false,
                      updatedAt: new Date().toISOString(),
                    } as LandUse);
                    setQuickForm({ landType: 'arable-cropland', areaHa: '', fieldName: '' });
                  }}
                  disabled={!quickForm.areaHa || parseFloat(quickForm.areaHa) === 0}
                >
                  Save & Add More
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Tree}
            title="No land parcels recorded yet"
            description="Add your land parcels to track land use across your site."
            actionLabel="Add First Parcel"
            onAction={onAddParcel}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
            <Tree className="w-5 h-5" weight="duotone" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Land Use Summary</h3>
            <p className="text-sm text-gray-500">
              {siteParcels.length} parcel{siteParcels.length !== 1 ? 's' : ''} — {totalHa.toFixed(1)} ha total
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {summaryByType.map(({ type, total }) => {
            const colors = getLandTypeColors(type);
            return (
              <div
                key={type}
                className={cn(
                  'rounded-xl border px-3 py-2',
                  colors.bg,
                  colors.border
                )}
              >
                <div className={cn('text-xs font-medium', colors.text)}>
                  {landTypeLabel(type)}
                </div>
                <div className="text-lg font-bold text-gray-900 mt-0.5">
                  {total.toFixed(1)}
                  <span className="text-xs font-normal text-gray-500 ml-1">ha</span>
                </div>
                <div className="text-xs text-gray-400">
                  {totalHa > 0 ? ((total / totalHa) * 100).toFixed(0) : 0}% of total
                </div>
              </div>
            );
          })}
        </div>
      </Card>

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
        </div>
        <Button onClick={onAddParcel} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Parcel
        </Button>
      </div>

      {/* Parcel List */}
      <div className="space-y-3">
        {siteParcels.map((parcel) => {
          const colors = getLandTypeColors(parcel.landType);
          return (
            <Card key={parcel.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.bg, colors.text)}>
                    <Tree className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {parcel.fieldName || landTypeLabel(parcel.landType)}
                      </span>
                      <Badge variant="high">
                        {landTypeLabel(parcel.landType)}
                      </Badge>
                      {parcel.irrigated && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          <Drop className="w-3 h-3" />
                          Irrigated
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {parcel.areaHa} ha
                      {parcel.soilOrganicMatterPercent != null && ` • SOM ${parcel.soilOrganicMatterPercent}%`}
                      {parcel.soilPh != null && ` • pH ${parcel.soilPh}`}
                    </p>
                    {parcel.notes && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{parcel.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEditParcel(parcel)}>
                    <PencilSimple className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDeleteParcel(parcel.id)}>
                    <Trash className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function InfrastructurePage() {
  const { sites, company } = useAppStore();
  const isAgri = isAgriculturalIndustry(company?.industryCode);
  const { assets, addAsset, updateAsset, removeAsset, landUse, addLandUse, updateLandUse, removeLandUse } = useDataStore();

  const [activeTab, setActiveTab] = useState<InfrastructureTab>('all');
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || '');

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [showLandUseModal, setShowLandUseModal] = useState(false);
  const [editingParcel, setEditingParcel] = useState<LandUse | null>(null);

  const [toastMessage, setToastMessage] = useState('');
  const [showToastState, setShowToastState] = useState(false);

  const [assetForm, setAssetForm] = useState<Partial<Asset>>({
    siteId: sites[0]?.id || '',
    assetName: '',
    assetCategory: 'production_equipment',
    assetType: '',
    quantity: 1,
    criticality: 'medium',
  });

  const [landUseForm, setLandUseForm] = useState<Partial<LandUse>>({
    siteId: sites[0]?.id || '',
    landType: 'arable-cropland',
    areaHa: 0,
    fieldName: '',
    soilOrganicMatterPercent: undefined,
    soilPh: undefined,
    irrigated: false,
    notes: '',
  });

  const progress = useMemo(() => {
    return Math.min(100, (assets.length + landUse.length) * 15);
  }, [assets, landUse]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setShowToastState(true);
  }, []);

  const handleAddAsset = (category?: AssetCategory) => {
    setEditingAsset(null);
    setAssetForm({
      siteId: selectedSiteId,
      assetName: '',
      assetCategory: category || (activeTab !== 'all' && activeTab !== 'land_use' ? activeTab as AssetCategory : 'production_equipment'),
      assetType: '',
      quantity: 1,
      criticality: 'medium',
    });
    setShowAssetModal(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetForm(asset);
    setShowAssetModal(true);
  };

  const handleSaveAsset = () => {
    const now = new Date().toISOString();
    if (editingAsset) {
      updateAsset(editingAsset.id, { ...assetForm, updatedAt: now });
      showToast('Asset updated');
    } else {
      addAsset({
        ...assetForm,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      } as Asset);
      showToast('Asset added');
    }
    setShowAssetModal(false);
  };

  const handleDeleteAsset = (id: string) => {
    removeAsset(id);
    showToast('Asset deleted');
  };

  // Land Use handlers
  const handleAddParcel = () => {
    setEditingParcel(null);
    setLandUseForm({
      siteId: selectedSiteId,
      landType: 'arable-cropland',
      areaHa: 0,
      fieldName: '',
      soilOrganicMatterPercent: undefined,
      soilPh: undefined,
      irrigated: false,
      notes: '',
    });
    setShowLandUseModal(true);
  };

  const handleEditParcel = (parcel: LandUse) => {
    setEditingParcel(parcel);
    setLandUseForm({
      siteId: parcel.siteId,
      landType: parcel.landType,
      areaHa: parcel.areaHa,
      fieldName: parcel.fieldName || '',
      soilOrganicMatterPercent: parcel.soilOrganicMatterPercent,
      soilPh: parcel.soilPh,
      irrigated: parcel.irrigated || false,
      notes: parcel.notes || '',
    });
    setShowLandUseModal(true);
  };

  const handleSaveParcel = () => {
    const now = new Date().toISOString();
    const data: Partial<LandUse> = {
      siteId: landUseForm.siteId,
      landType: landUseForm.landType,
      areaHa: landUseForm.areaHa,
      fieldName: landUseForm.fieldName || undefined,
      soilOrganicMatterPercent: landUseForm.soilOrganicMatterPercent,
      soilPh: landUseForm.soilPh,
      irrigated: landUseForm.irrigated,
      notes: landUseForm.notes || undefined,
      updatedAt: now,
    };

    if (editingParcel) {
      updateLandUse(editingParcel.id, data);
      showToast('Land parcel updated');
    } else {
      addLandUse({
        ...data,
        id: crypto.randomUUID(),
        updatedAt: now,
      } as LandUse);
      showToast('Land parcel added');
    }
    setShowLandUseModal(false);
  };

  const handleDeleteParcel = (id: string) => {
    removeLandUse(id);
    showToast('Land parcel deleted');
  };

  const tabs = useMemo(() => {
    if (isAgri) {
      return [
        { id: 'all' as InfrastructureTab, label: 'All', icon: ChartBar },
        { id: 'land_use' as InfrastructureTab, label: 'Land Use', icon: Tree },
        { id: 'production_equipment' as InfrastructureTab, label: 'Production', icon: Factory },
        { id: 'hvac' as InfrastructureTab, label: 'HVAC', icon: Wind },
        { id: 'vehicles' as InfrastructureTab, label: 'Vehicles', icon: Truck },
        { id: 'it' as InfrastructureTab, label: 'IT', icon: Monitor },
        { id: 'other' as InfrastructureTab, label: 'Other', icon: DotsThree },
      ];
    }
    return [
      { id: 'all' as InfrastructureTab, label: 'All', icon: ChartBar },
      { id: 'production_equipment' as InfrastructureTab, label: 'Production', icon: Factory },
      { id: 'hvac' as InfrastructureTab, label: 'HVAC', icon: Wind },
      { id: 'vehicles' as InfrastructureTab, label: 'Vehicles', icon: Truck },
      { id: 'it' as InfrastructureTab, label: 'IT', icon: Monitor },
      { id: 'other' as InfrastructureTab, label: 'Other', icon: DotsThree },
      { id: 'land_use' as InfrastructureTab, label: 'Land Use', icon: Tree },
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
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stack-4 to-stack-5 shadow-sm flex items-center justify-center">
                <Buildings className="w-5 h-5 text-white" weight="duotone" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Infrastructure</h1>
            </div>
            <p className="text-gray-500 ml-13">Track sites, buildings, equipment assets, and land use</p>
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
          <Buildings className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{assets.length}</span> assets</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1.5">
          <Factory className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{sites.length}</span> sites</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1.5">
          <ChartBar className="w-3.5 h-3.5 text-gray-400" weight="duotone" />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-900">{assets.length + landUse.length}</span> records</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
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
          assets={assets}
          onNavigate={setActiveTab}
          sites={sites}
          selectedSiteId={selectedSiteId}
          setSelectedSiteId={setSelectedSiteId}
          onAddAsset={() => handleAddAsset()}
        />
      ) : activeTab === 'land_use' ? (
        <LandUseTab
          landUse={landUse}
          sites={sites}
          selectedSiteId={selectedSiteId}
          setSelectedSiteId={setSelectedSiteId}
          onAddParcel={handleAddParcel}
          onEditParcel={handleEditParcel}
          onDeleteParcel={handleDeleteParcel}
        />
      ) : (
        <CategoryTab
          category={activeTab as AssetCategory}
          assets={assets}
          sites={sites}
          selectedSiteId={selectedSiteId}
          setSelectedSiteId={setSelectedSiteId}
          onAddAsset={() => handleAddAsset(activeTab as AssetCategory)}
          onEditAsset={handleEditAsset}
          onDeleteAsset={handleDeleteAsset}
        />
      )}

      {/* Asset Modal */}
      <Modal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        title={editingAsset ? 'Edit Asset' : 'Add Asset'}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Site"
            value={assetForm.siteId}
            onChange={(e) => setAssetForm({ ...assetForm, siteId: e.target.value })}
            options={sites.map((s) => ({ value: s.id, label: s.siteName }))}
          />
          <Input
            label="Asset Name"
            value={assetForm.assetName || ''}
            onChange={(e) => setAssetForm({ ...assetForm, assetName: e.target.value })}
            placeholder="e.g., CNC Machine, Main HVAC Unit"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={assetForm.assetCategory}
              onChange={(e) => setAssetForm({ ...assetForm, assetCategory: e.target.value as AssetCategory })}
              options={categoryOptions}
            />
            <Input
              label="Asset Type"
              value={assetForm.assetType || ''}
              onChange={(e) => setAssetForm({ ...assetForm, assetType: e.target.value })}
              placeholder="e.g., Lathe, Air Handler"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min={1}
              value={assetForm.quantity || 1}
              onChange={(e) => setAssetForm({ ...assetForm, quantity: parseInt(e.target.value) || 1 })}
            />
            <Select
              label="Criticality"
              value={assetForm.criticality || 'medium'}
              onChange={(e) => setAssetForm({ ...assetForm, criticality: e.target.value as Criticality })}
              options={criticalityOptions}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Asset Details (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Acquisition Year"
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                value={assetForm.acquisitionYear || ''}
                onChange={(e) => setAssetForm({ ...assetForm, acquisitionYear: parseInt(e.target.value) || undefined })}
              />
              <Input
                label="Expected Lifespan (Years)"
                type="number"
                min={1}
                value={assetForm.expectedLifespanYears || ''}
                onChange={(e) =>
                  setAssetForm({ ...assetForm, expectedLifespanYears: parseInt(e.target.value) || undefined })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Replacement Cost"
                type="number"
                value={assetForm.replacementCost || ''}
                onChange={(e) =>
                  setAssetForm({ ...assetForm, replacementCost: parseFloat(e.target.value) || undefined })
                }
                hint="In your local currency"
              />
              <Input
                label="Energy Consumption (kWh/year)"
                type="number"
                value={assetForm.energyConsumptionKwhYear || ''}
                onChange={(e) =>
                  setAssetForm({ ...assetForm, energyConsumptionKwhYear: parseFloat(e.target.value) || undefined })
                }
                hint="Estimated annual usage"
              />
            </div>
            <Select
              label="Maintenance Frequency"
              value={assetForm.maintenanceFrequency || 'as_needed'}
              onChange={(e) =>
                setAssetForm({ ...assetForm, maintenanceFrequency: e.target.value as MaintenanceFrequency })
              }
              options={maintenanceOptions}
              className="mt-4"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowAssetModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAsset}>{editingAsset ? 'Update' : 'Add Asset'}</Button>
        </div>
      </Modal>

      {/* Land Use Modal */}
      <Modal
        isOpen={showLandUseModal}
        onClose={() => setShowLandUseModal(false)}
        title={editingParcel ? 'Edit Land Parcel' : 'Add Land Parcel'}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Site"
            value={landUseForm.siteId}
            onChange={(e) => setLandUseForm({ ...landUseForm, siteId: e.target.value })}
            options={sites.map((s) => ({ value: s.id, label: s.siteName }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Combobox
              label="Land Type"
              value={landUseForm.landType as string}
              onChange={(value) => setLandUseForm({ ...landUseForm, landType: value as LandType })}
              options={landTypeOptions}
              placeholder="Search or type a land use..."
            />
            <Input
              label="Area (ha)"
              type="number"
              min={0}
              step={0.1}
              value={landUseForm.areaHa || ''}
              onChange={(e) => setLandUseForm({ ...landUseForm, areaHa: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 12.5"
            />
          </div>
          <Input
            label="Field Name (Optional)"
            value={landUseForm.fieldName || ''}
            onChange={(e) => setLandUseForm({ ...landUseForm, fieldName: e.target.value })}
            placeholder="e.g., North Field, Top Meadow"
          />

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Soil & Conditions (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Soil Organic Matter (%)"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={landUseForm.soilOrganicMatterPercent ?? ''}
                onChange={(e) =>
                  setLandUseForm({
                    ...landUseForm,
                    soilOrganicMatterPercent: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                hint="Typical range: 1-10%"
              />
              <Input
                label="Soil pH"
                type="number"
                min={0}
                max={14}
                step={0.1}
                value={landUseForm.soilPh ?? ''}
                onChange={(e) =>
                  setLandUseForm({
                    ...landUseForm,
                    soilPh: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                hint="Typical range: 4.5-8.5"
              />
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={landUseForm.irrigated || false}
                  onChange={(e) => setLandUseForm({ ...landUseForm, irrigated: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-gray-700">Irrigated</span>
              </label>
            </div>
            <div className="mt-4">
              <TextArea
                label="Notes (Optional)"
                value={landUseForm.notes || ''}
                onChange={(e) => setLandUseForm({ ...landUseForm, notes: e.target.value })}
                placeholder="Any additional details about this parcel..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowLandUseModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveParcel} disabled={!landUseForm.areaHa || landUseForm.areaHa <= 0}>
            {editingParcel ? 'Update' : 'Add Parcel'}
          </Button>
        </div>
      </Modal>

      {/* Tips Card */}
      <Card className="mt-8 bg-cream border-forest-300">
        <div className="font-semibold text-forest-700 mb-3">Tips for Better Data</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-900 mb-1">Focus on energy consumers</p>
            <p className="text-gray-600">Prioritize assets that consume significant energy like HVAC and production equipment.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Track acquisition year</p>
            <p className="text-gray-600">Equipment age helps plan for replacements and efficiency upgrades.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Record land parcels</p>
            <p className="text-gray-600">Tracking land use by type helps calculate agricultural emissions and plan carbon sequestration.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
