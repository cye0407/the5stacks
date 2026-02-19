"use client";

import { useState, useMemo, useCallback } from 'react';
import {
  Cube,
  Package,
  Lightning,
  Buildings,
  Truck,
  UsersThree,
  Recycle,
  GlobeHemisphereWest,
  Plant,
  ChartBar,
  TreeStructure,
  MapPin,
  Database,
  Target,
} from '@phosphor-icons/react';
import { Card, Select } from '@/components/ui';
import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';
import { isAgriculturalIndustry } from '@/lib/utils/industry';
import { cn } from '@/lib/utils/cn';

// ─── Format helpers ──────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n === 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function fmt(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined || v === '') return '\u2014';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return v.toLocaleString();
  return String(v);
}

// ─── Sub-components ──────────────────────────────────────────────

function SectionHeader({ id, icon: Icon, title, count, gradient }: {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  count: number;
  gradient: string;
}) {
  return (
    <div id={id} className="flex items-center gap-3 mb-4 scroll-mt-20">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm', gradient)}>
        <Icon className="w-5 h-5 text-white" weight="duotone" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {count > 0 && (
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{count} records</span>
      )}
    </div>
  );
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {headers.map((h, i) => (
                <th key={i} className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </Card>
  );
}

function EmptySection({ icon: Icon, domain }: { icon: React.ComponentType<any>; domain: string }) {
  return (
    <Card className="py-8">
      <div className="text-center text-gray-400">
        <Icon className="w-8 h-8 mx-auto mb-2" weight="duotone" />
        <p className="text-sm">No {domain} data recorded yet</p>
      </div>
    </Card>
  );
}

function KeyValue({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="font-medium text-gray-900 text-sm">{fmt(value)}</div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────

export default function FullViewPage() {
  const { company, sites, swot, goals } = useAppStore();
  const dataStore = useDataStore();

  const isAg = isAgriculturalIndustry(company?.industryCode);

  // ── Extract all unique years from period-based data ──
  const allYears = useMemo(() => {
    const periods = [
      ...dataStore.materialInputs.map(r => r.period),
      ...dataStore.packagingInputs.map(r => r.period),
      ...dataStore.energyElectricity.map(r => r.period),
      ...dataStore.energyFuels.map(r => r.period),
      ...dataStore.energyWater.map(r => r.period),
      ...dataStore.transportLogs.map(r => r.period),
      ...dataStore.workforce.map(r => r.period),
      ...dataStore.healthSafety.map(r => r.period),
      ...dataStore.training.map(r => r.period),
      ...dataStore.waste.map(r => r.period),
      ...dataStore.productOutputs.map(r => r.period),
      ...dataStore.directEmissions.map(r => r.period),
      ...dataStore.effluents.map(r => r.period),
      ...dataStore.fertiliserApplications.map(r => r.period),
      ...dataStore.livestockRecords.map(r => r.period),
      ...dataStore.cropOutputs.map(r => r.period),
    ];
    const years = [...new Set(periods.map(p => p.substring(0, 4)).filter(Boolean))].sort().reverse();
    if (years.length === 0) {
      const thisYear = new Date().getFullYear().toString();
      return [thisYear];
    }
    return years;
  }, [dataStore]);

  const [selectedYear, setSelectedYear] = useState<string>(allYears[0] || new Date().getFullYear().toString());
  const [selectedSite, setSelectedSite] = useState<string>('all');

  // ── Options ──
  const yearOptions = allYears.map(y => ({ value: y, label: y }));
  const siteOptions = [
    { value: 'all', label: 'All Sites' },
    ...sites.map(s => ({ value: s.id, label: s.siteName })),
  ];

  // ── Filter helpers ──
  const filterRecord = useCallback(
    (period: string, siteId: string) =>
      period.startsWith(selectedYear) && (selectedSite === 'all' || siteId === selectedSite),
    [selectedYear, selectedSite]
  );

  const filterSiteOnly = useCallback(
    (siteId: string) => selectedSite === 'all' || siteId === selectedSite,
    [selectedSite]
  );

  const getSiteName = (siteId: string) => sites.find(s => s.id === siteId)?.siteName || 'Unknown';

  // ── Filtered data ──
  const filteredMaterialInputs = useMemo(
    () => dataStore.materialInputs.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.materialInputs, filterRecord]
  );
  const filteredPackagingInputs = useMemo(
    () => dataStore.packagingInputs.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.packagingInputs, filterRecord]
  );
  const filteredElectricity = useMemo(
    () => dataStore.energyElectricity.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.energyElectricity, filterRecord]
  );
  const filteredFuels = useMemo(
    () => dataStore.energyFuels.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.energyFuels, filterRecord]
  );
  const filteredWater = useMemo(
    () => dataStore.energyWater.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.energyWater, filterRecord]
  );
  const filteredAssets = useMemo(
    () => dataStore.assets.filter(r => filterSiteOnly(r.siteId)),
    [dataStore.assets, filterSiteOnly]
  );
  const filteredTransport = useMemo(
    () => dataStore.transportLogs.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.transportLogs, filterRecord]
  );
  const filteredWorkforce = useMemo(
    () => dataStore.workforce.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.workforce, filterRecord]
  );
  const filteredSafety = useMemo(
    () => dataStore.healthSafety.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.healthSafety, filterRecord]
  );
  const filteredTraining = useMemo(
    () => dataStore.training.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.training, filterRecord]
  );
  const filteredWaste = useMemo(
    () => dataStore.waste.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.waste, filterRecord]
  );
  const filteredProducts = useMemo(
    () => dataStore.productOutputs.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.productOutputs, filterRecord]
  );
  const filteredDirectEmissions = useMemo(
    () => dataStore.directEmissions.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.directEmissions, filterRecord]
  );
  const filteredEffluents = useMemo(
    () => dataStore.effluents.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.effluents, filterRecord]
  );
  const filteredFertiliser = useMemo(
    () => dataStore.fertiliserApplications.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.fertiliserApplications, filterRecord]
  );
  const filteredLivestock = useMemo(
    () => dataStore.livestockRecords.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.livestockRecords, filterRecord]
  );
  const filteredCrops = useMemo(
    () => dataStore.cropOutputs.filter(r => filterRecord(r.period, r.siteId)),
    [dataStore.cropOutputs, filterRecord]
  );
  const filteredLandUse = useMemo(
    () => dataStore.landUse.filter(r => filterSiteOnly(r.siteId)),
    [dataStore.landUse, filterSiteOnly]
  );
  const filteredSites = useMemo(
    () => selectedSite === 'all' ? sites : sites.filter(s => s.id === selectedSite),
    [sites, selectedSite]
  );

  // ── Summary stats ──
  const totalRecords = useMemo(() => {
    return filteredMaterialInputs.length
      + filteredPackagingInputs.length
      + filteredElectricity.length + filteredFuels.length + filteredWater.length
      + filteredAssets.length
      + filteredTransport.length
      + filteredWorkforce.length + filteredSafety.length + filteredTraining.length
      + filteredWaste.length + filteredProducts.length + filteredDirectEmissions.length + filteredEffluents.length
      + (isAg ? filteredFertiliser.length + filteredLivestock.length + filteredCrops.length + filteredLandUse.length : 0);
  }, [
    filteredMaterialInputs, filteredPackagingInputs, filteredElectricity, filteredFuels, filteredWater,
    filteredAssets, filteredTransport, filteredWorkforce, filteredSafety, filteredTraining,
    filteredWaste, filteredProducts, filteredDirectEmissions, filteredEffluents,
    filteredFertiliser, filteredLivestock, filteredCrops, filteredLandUse, isAg,
  ]);

  const domainCounts = useMemo(() => ({
    materials: filteredMaterialInputs.length + (isAg ? filteredFertiliser.length : 0),
    packaging: filteredPackagingInputs.length,
    energy: filteredElectricity.length + filteredFuels.length + filteredWater.length,
    infrastructure: filteredAssets.length + filteredSites.length + (isAg ? filteredLandUse.length : 0),
    transport: filteredTransport.length,
    workforce: filteredWorkforce.length + filteredSafety.length + filteredTraining.length,
    outputs: filteredWaste.length + filteredProducts.length + filteredDirectEmissions.length + filteredEffluents.length + (isAg ? filteredCrops.length + filteredLivestock.length : 0),
    context: (dataStore.externalContext ? 1 : 0) + (dataStore.financialContext ? 1 : 0),
  }), [
    filteredMaterialInputs, filteredPackagingInputs, filteredElectricity, filteredFuels, filteredWater,
    filteredAssets, filteredSites, filteredTransport, filteredWorkforce, filteredSafety, filteredTraining,
    filteredWaste, filteredProducts, filteredDirectEmissions, filteredEffluents,
    filteredFertiliser, filteredLivestock, filteredCrops, filteredLandUse,
    dataStore.externalContext, dataStore.financialContext, isAg,
  ]);

  const domainsWithData = Object.values(domainCounts).filter(c => c > 0).length;
  const completenessPercent = Math.round((domainsWithData / 8) * 100);

  // ── Material & packaging name lookups ──
  const getMaterialName = (materialId: string) =>
    dataStore.materials.find(m => m.id === materialId)?.materialName || 'Unknown';
  const getMaterialCategory = (materialId: string) =>
    dataStore.materials.find(m => m.id === materialId)?.materialCategory || '\u2014';
  const getPackagingName = (packagingId: string) =>
    dataStore.packaging.find(p => p.id === packagingId)?.packagingName || 'Unknown';
  const getPackagingLevel = (packagingId: string) =>
    dataStore.packaging.find(p => p.id === packagingId)?.packagingLevel || '\u2014';
  const getPackagingMaterial = (packagingId: string) =>
    dataStore.packaging.find(p => p.id === packagingId)?.materialType || '\u2014';

  // ── Sections config for nav ──
  const sections = useMemo(() => {
    const base = [
      { id: 'company', label: 'Company & Sites' },
      { id: 'swot-goals', label: 'SWOT & Goals' },
    ];
    if (isAg) base.push({ id: 'agricultural', label: 'Agricultural' });
    base.push(
      { id: 'infrastructure', label: 'Infrastructure' },
      { id: 'outputs', label: 'Outputs' },
      { id: 'materials', label: 'Materials' },
      { id: 'energy', label: 'Energy' },
      { id: 'transport', label: 'Transport' },
      { id: 'workforce', label: 'Workforce' },
      { id: 'packaging', label: 'Packaging' },
      { id: 'context', label: 'Context' },
    );
    return base;
  }, [isAg]);

  // ── No company guard ──
  if (!company) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <Buildings className="w-12 h-12 text-gray-300 mx-auto mb-3" weight="duotone" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">No company set up</h2>
          <p className="text-sm text-gray-500">Complete onboarding to set up your company and start viewing your data here.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">360 View</h1>
          <p className="text-gray-500">Complete read-only overview of all your data</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            options={siteOptions}
            className="w-40"
          />
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            options={yearOptions}
            className="w-28"
          />
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="!p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <ChartBar className="w-5 h-5 text-primary" weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(totalRecords)}</div>
              <div className="text-xs text-gray-500">Total records</div>
            </div>
          </div>
        </Card>

        <Card className="!p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stack-3/10 flex items-center justify-center">
              <TreeStructure className="w-5 h-5 text-stack-3" weight="duotone" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{domainsWithData}</span>
                <span className="text-sm text-gray-400">/ 8</span>
              </div>
              <div className="text-xs text-gray-500">Domains covered</div>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-stack-3 to-primary rounded-full transition-all duration-500"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
        </Card>

        <Card className="!p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stack-4/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-stack-4" weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{sites.length}</div>
              <div className="text-xs text-gray-500">Sites</div>
            </div>
          </div>
        </Card>

        <Card className="!p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stack-1/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-stack-1" weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{completenessPercent}%</div>
              <div className="text-xs text-gray-500">Completeness</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Sticky section nav ── */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 mb-8">
        <div className="flex items-center gap-1 overflow-x-auto text-sm">
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-primary-100 hover:text-primary whitespace-nowrap font-medium transition-colors"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── All sections ── */}
      <div className="space-y-10">

        {/* ═══════ 1. Company & Sites ═══════ */}
        <section>
          <SectionHeader id="company" icon={Buildings} title="Company & Sites" count={filteredSites.length} gradient="from-primary-dark to-primary" />

          <Card className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KeyValue label="Legal Entity" value={company.legalEntityName} />
              <KeyValue label="Industry" value={company.industryDescription} />
              <KeyValue label="Headquarters" value={[company.headquartersCity, company.headquartersCountry].filter(Boolean).join(', ')} />
              <KeyValue label="Ownership" value={company.ownershipType} />
              <KeyValue label="Founded" value={company.foundingYear != null ? String(company.foundingYear) : null} />
              <KeyValue label="Reporting Start" value={company.reportingPeriodStart} />
              <KeyValue label="Reporting End" value={company.reportingPeriodEnd} />
              <KeyValue label="Revenue Band" value={company.revenueBand} />
            </div>
          </Card>

          {filteredSites.length > 0 ? (
            <DataTable headers={['Site Name', 'Type', 'Country', 'City', 'Floor Area (m\u00B2)', 'Ownership', 'Primary']}>
              {filteredSites.map(s => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{s.siteName}</td>
                  <td className="py-3 px-4 text-gray-600">{s.siteType}</td>
                  <td className="py-3 px-4 text-gray-600">{s.country}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(s.city)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(s.floorAreaM2)}</td>
                  <td className="py-3 px-4 text-gray-600">{s.ownership}</td>
                  <td className="py-3 px-4 text-gray-600">{s.isPrimary ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Buildings} domain="site" />
          )}
        </section>

        {/* ═══════ 2. SWOT & Goals ═══════ */}
        <section>
          <SectionHeader id="swot-goals" icon={Target} title="SWOT & Goals" count={((swot ? 1 : 0) + (goals ? 1 : 0))} gradient="from-stack-2 to-stack-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {swot ? (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">SWOT Analysis</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Strengths</div>
                    <p className="text-sm text-gray-800">{swot.strengths || '\u2014'}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Weaknesses</div>
                    <p className="text-sm text-gray-800">{swot.weaknesses || '\u2014'}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Opportunities</div>
                    <p className="text-sm text-gray-800">{swot.opportunities || '\u2014'}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Threats</div>
                    <p className="text-sm text-gray-800">{swot.threats || '\u2014'}</p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="py-8">
                <div className="text-center text-gray-400">
                  <Target className="w-8 h-8 mx-auto mb-2" weight="duotone" />
                  <p className="text-sm">No SWOT data recorded yet</p>
                </div>
              </Card>
            )}

            {goals ? (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Goals</h3>
                <div className="space-y-3">
                  <KeyValue label="Primary Goal" value={goals.primaryGoal} />
                  <KeyValue label="Time Horizon" value={goals.timeHorizon} />
                  <KeyValue label="Motivation" value={goals.primaryMotivation} />
                  <KeyValue label="Success Definition" value={goals.successDefinition} />
                </div>
              </Card>
            ) : (
              <Card className="py-8">
                <div className="text-center text-gray-400">
                  <Target className="w-8 h-8 mx-auto mb-2" weight="duotone" />
                  <p className="text-sm">No goals data recorded yet</p>
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* ═══════ Agricultural (ag only) ═══════ */}
        {isAg && (
          <section>
            <SectionHeader
              id="agricultural"
              icon={Plant}
              title="Agricultural"
              count={filteredLandUse.length + filteredFertiliser.length + filteredLivestock.length + filteredCrops.length}
              gradient="from-green-600 to-emerald-600"
            />

            {/* Land Use */}
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Land Use</h3>
            {filteredLandUse.length > 0 ? (
              <DataTable headers={['Site', 'Field Name', 'Land Type', 'Area (ha)', 'Irrigated']}>
                {filteredLandUse.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                    <td className="py-3 px-4 text-gray-600">{fmt(r.fieldName)}</td>
                    <td className="py-3 px-4 text-gray-600">{r.landType}</td>
                    <td className="py-3 px-4 text-gray-900">{formatNumber(r.areaHa)}</td>
                    <td className="py-3 px-4 text-gray-600">{fmt(r.irrigated)}</td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <EmptySection icon={Plant} domain="land use" />
            )}

            {/* Fertiliser */}
            <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Fertiliser</h3>
            {filteredFertiliser.length > 0 ? (
              <DataTable headers={['Site', 'Period', 'Type', 'Quantity (kg)', 'Area (ha)', 'N %', 'P %', 'K %']}>
                {filteredFertiliser.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                    <td className="py-3 px-4 text-gray-600">{r.period}</td>
                    <td className="py-3 px-4 text-gray-600">{r.fertiliserType}</td>
                    <td className="py-3 px-4 text-gray-900">{formatNumber(r.quantityKg)}</td>
                    <td className="py-3 px-4 text-gray-600">{fmt(r.areaAppliedHa)}</td>
                    <td className="py-3 px-4 text-gray-600">{fmt(r.nitrogenContentPercent)}</td>
                    <td className="py-3 px-4 text-gray-600">{fmt(r.phosphorusContentPercent)}</td>
                    <td className="py-3 px-4 text-gray-600">{fmt(r.potassiumContentPercent)}</td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <EmptySection icon={Plant} domain="fertiliser" />
            )}

            {/* Livestock */}
            <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Livestock</h3>
            {filteredLivestock.length > 0 ? (
              <DataTable headers={['Site', 'Period', 'Type', 'Headcount', 'Avg Weight (kg)', 'Grazing Months']}>
                {filteredLivestock.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                    <td className="py-3 px-4 text-gray-600">{r.period}</td>
                    <td className="py-3 px-4 text-gray-600">{r.livestockType}</td>
                    <td className="py-3 px-4 text-gray-900">{formatNumber(r.headcount)}</td>
                    <td className="py-3 px-4 text-gray-600">{fmt(r.averageWeightKg)}</td>
                    <td className="py-3 px-4 text-gray-600">{fmt(r.grazingMonths)}</td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <EmptySection icon={Plant} domain="livestock" />
            )}

            {/* Crops */}
            <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Crops</h3>
            {filteredCrops.length > 0 ? (
              <DataTable headers={['Site', 'Period', 'Crop Type', 'Area (ha)', 'Yield (t)', 'Yield/ha', 'Revenue']}>
                {filteredCrops.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                    <td className="py-3 px-4 text-gray-600">{r.period}</td>
                    <td className="py-3 px-4 text-gray-600">{r.cropType}</td>
                    <td className="py-3 px-4 text-gray-900">{formatNumber(r.areaHa)}</td>
                    <td className="py-3 px-4 text-gray-900">{formatNumber(r.yieldTonnes)}</td>
                    <td className="py-3 px-4 text-gray-600">{fmt(r.yieldPerHa)}</td>
                    <td className="py-3 px-4 text-gray-600">{fmt(r.revenue)}</td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <EmptySection icon={Plant} domain="crop" />
            )}
          </section>
        )}

        {/* ═══════ Infrastructure ═══════ */}
        <section>
          <SectionHeader id="infrastructure" icon={Buildings} title="Infrastructure" count={filteredAssets.length} gradient="from-stack-4 to-stack-5" />

          {filteredAssets.length > 0 ? (
            <DataTable headers={['Site', 'Asset Name', 'Category', 'Type', 'Qty', 'Acquisition Year', 'Lifespan', 'Energy (kWh/yr)']}>
              {filteredAssets.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-900">{r.assetName}</td>
                  <td className="py-3 px-4 text-gray-600">{r.assetCategory}</td>
                  <td className="py-3 px-4 text-gray-600">{r.assetType}</td>
                  <td className="py-3 px-4 text-gray-600">{r.quantity}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.acquisitionYear)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.expectedLifespanYears)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.energyConsumptionKwhYear)}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Buildings} domain="infrastructure" />
          )}
        </section>

        {/* ═══════ Outputs ═══════ */}
        <section>
          <SectionHeader
            id="outputs"
            icon={Recycle}
            title="Outputs"
            count={filteredWaste.length + filteredProducts.length + filteredDirectEmissions.length + filteredEffluents.length}
            gradient="from-stack-3 to-stack-5"
          />

          {/* Waste */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Waste</h3>
          {filteredWaste.length > 0 ? (
            <DataTable headers={['Site', 'Period', 'Category', 'Type', 'Quantity (kg)', 'Disposal', 'Hazardous', 'Confidence']}>
              {filteredWaste.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-600">{r.wasteCategory}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.wasteType)}</td>
                  <td className="py-3 px-4 text-gray-900">{formatNumber(r.quantityKg)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.disposalRoute}</td>
                  <td className="py-3 px-4 text-gray-600">{r.hazardous ? 'Yes' : 'No'}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Recycle} domain="waste" />
          )}

          {/* Product Outputs */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Product Outputs</h3>
          {filteredProducts.length > 0 ? (
            <DataTable headers={['Site', 'Period', 'Product', 'Quantity', 'Unit', 'Revenue', 'Confidence']}>
              {filteredProducts.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-900">{r.productName}</td>
                  <td className="py-3 px-4 text-gray-900">{formatNumber(r.quantity)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.unit}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.revenue)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Recycle} domain="product output" />
          )}

          {/* Direct Emissions */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Direct Emissions</h3>
          {filteredDirectEmissions.length > 0 ? (
            <DataTable headers={['Site', 'Period', 'Source', 'Quantity (kg)', 'tCO\u2082e', 'Confidence']}>
              {filteredDirectEmissions.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-600">{r.emissionSource}</td>
                  <td className="py-3 px-4 text-gray-900">{formatNumber(r.quantityKg)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.tco2e)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Recycle} domain="direct emission" />
          )}

          {/* Effluents */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Effluents</h3>
          {filteredEffluents.length > 0 ? (
            <DataTable headers={['Site', 'Period', 'Type', 'Volume (m\u00B3)', 'Destination', 'Confidence']}>
              {filteredEffluents.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-600">{r.effluentType}</td>
                  <td className="py-3 px-4 text-gray-900">{formatNumber(r.volumeM3)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.destination}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Recycle} domain="effluent" />
          )}
        </section>

        {/* ═══════ Materials ═══════ */}
        <section>
          <SectionHeader id="materials" icon={Cube} title="Materials" count={filteredMaterialInputs.length} gradient="from-stack-1 to-stack-2" />

          {filteredMaterialInputs.length > 0 ? (
            <DataTable headers={['Material', 'Category', 'Site', 'Period', 'Quantity', 'Unit', 'Recycled %', 'Supplier', 'Confidence']}>
              {filteredMaterialInputs.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getMaterialName(r.materialId)}</td>
                  <td className="py-3 px-4 text-gray-600">{getMaterialCategory(r.materialId)}</td>
                  <td className="py-3 px-4 text-gray-600">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-900">{formatNumber(r.quantity)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.unit}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.recycledContentPercent)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.supplierName)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Cube} domain="materials" />
          )}
        </section>

        {/* ═══════ Energy ═══════ */}
        <section>
          <SectionHeader
            id="energy"
            icon={Lightning}
            title="Energy"
            count={filteredElectricity.length + filteredFuels.length + filteredWater.length}
            gradient="from-stack-3 to-stack-4"
          />

          {/* Electricity */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Electricity</h3>
          {filteredElectricity.length > 0 ? (
            <DataTable headers={['Site', 'Period', 'Consumption (kWh)', 'Grid %', 'Renewable %', 'Green Tariff', 'Cost', 'Confidence']}>
              {filteredElectricity.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-900">{formatNumber(r.consumptionKwh)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.sourceGridPercent)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.sourceOnsiteRenewablePercent)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.greenTariff)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.cost)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Lightning} domain="electricity" />
          )}

          {/* Fuels */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Fuels</h3>
          {filteredFuels.length > 0 ? (
            <DataTable headers={['Site', 'Period', 'Fuel Type', 'Quantity', 'Unit', 'Purpose', 'Cost', 'Confidence']}>
              {filteredFuels.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-600">{r.fuelType}</td>
                  <td className="py-3 px-4 text-gray-900">{formatNumber(r.quantity)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.unit}</td>
                  <td className="py-3 px-4 text-gray-600">{r.purpose}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.cost)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Lightning} domain="fuel" />
          )}

          {/* Water */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Water</h3>
          {filteredWater.length > 0 ? (
            <DataTable headers={['Site', 'Period', 'Withdrawal (m\u00B3)', 'Source', 'Discharge (m\u00B3)', 'Cost', 'Confidence']}>
              {filteredWater.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-900">{formatNumber(r.withdrawalM3)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.waterSource}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.dischargeM3)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.cost)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Lightning} domain="water" />
          )}
        </section>

        {/* ═══════ Transport ═══════ */}
        <section>
          <SectionHeader id="transport" icon={Truck} title="Transport" count={filteredTransport.length} gradient="from-stack-1 to-stack-3" />

          {filteredTransport.length > 0 ? (
            <DataTable headers={['Site', 'Period', 'Direction', 'Mode', 'Distance (km)', 'Weight (t)', 'tkm', 'Carrier', 'Confidence']}>
              {filteredTransport.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-600">{r.direction}</td>
                  <td className="py-3 px-4 text-gray-600">{r.mode}</td>
                  <td className="py-3 px-4 text-gray-900">{fmt(r.distanceKm)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.weightT)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.tkm)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.carrierName)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Truck} domain="transport" />
          )}
        </section>

        {/* ═══════ Workforce ═══════ */}
        <section>
          <SectionHeader id="workforce" icon={UsersThree} title="Workforce" count={filteredWorkforce.length + filteredSafety.length + filteredTraining.length} gradient="from-stack-2 to-stack-4" />

          {/* Headcount */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Headcount</h3>
          {filteredWorkforce.length > 0 ? (
            <DataTable headers={['Site', 'Period', 'Total FTE', 'Permanent', 'Temporary', 'Contractors', 'Female %', 'Hours', 'Confidence']}>
              {filteredWorkforce.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-900">{formatNumber(r.totalFte)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.permanentEmployees)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.temporaryEmployees)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.contractors)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.femalePercent)}</td>
                  <td className="py-3 px-4 text-gray-600">{formatNumber(r.totalHoursWorked)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={UsersThree} domain="headcount" />
          )}

          {/* Safety */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Safety</h3>
          {filteredSafety.length > 0 ? (
            <DataTable headers={['Site', 'Period', 'Recordable', 'LTI', 'Lost Days', 'Fatalities', 'Near Misses', 'Confidence']}>
              {filteredSafety.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-900">{r.recordableIncidents}</td>
                  <td className="py-3 px-4 text-gray-600">{r.lostTimeIncidents}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.lostDays)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.fatalities}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.nearMisses)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={UsersThree} domain="safety" />
          )}

          {/* Training */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Training</h3>
          {filteredTraining.length > 0 ? (
            <DataTable headers={['Site', 'Period', 'Training Hours', 'Employees Trained', 'Safety Hours', 'Confidence']}>
              {filteredTraining.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-900">{fmt(r.totalTrainingHours)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.employeesTrained)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.safetyTrainingHours)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={UsersThree} domain="training" />
          )}
        </section>

        {/* ═══════ Packaging ═══════ */}
        <section>
          <SectionHeader id="packaging" icon={Package} title="Packaging" count={filteredPackagingInputs.length} gradient="from-stack-2 to-stack-3" />

          {filteredPackagingInputs.length > 0 ? (
            <DataTable headers={['Packaging', 'Level', 'Material', 'Site', 'Period', 'Units', 'Weight (kg)', 'Recycled %', 'Confidence']}>
              {filteredPackagingInputs.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{getPackagingName(r.packagingId)}</td>
                  <td className="py-3 px-4 text-gray-600">{getPackagingLevel(r.packagingId)}</td>
                  <td className="py-3 px-4 text-gray-600">{getPackagingMaterial(r.packagingId)}</td>
                  <td className="py-3 px-4 text-gray-600">{getSiteName(r.siteId)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.period}</td>
                  <td className="py-3 px-4 text-gray-900">{formatNumber(r.quantityUnits)}</td>
                  <td className="py-3 px-4 text-gray-900">{formatNumber(r.totalWeightKg)}</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(r.recycledContentPercent)}</td>
                  <td className="py-3 px-4 text-gray-600">{r.confidence}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptySection icon={Package} domain="packaging" />
          )}
        </section>

        {/* ═══════ Context ═══════ */}
        <section>
          <SectionHeader
            id="context"
            icon={GlobeHemisphereWest}
            title="Context"
            count={(dataStore.externalContext ? 1 : 0) + (dataStore.financialContext ? 1 : 0)}
            gradient="from-primary-dark to-primary"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* External Context */}
            {dataStore.externalContext ? (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">External Context</h3>
                <div className="grid grid-cols-2 gap-3">
                  <KeyValue label="Market Scope" value={dataStore.externalContext.marketScope} />
                  <KeyValue label="Customer Type" value={dataStore.externalContext.customerType} />
                  <KeyValue label="CSRD Status" value={dataStore.externalContext.csrdStatus} />
                  <KeyValue label="Regulatory Pressure" value={dataStore.externalContext.regulatoryPressure} />
                </div>
              </Card>
            ) : (
              <Card className="py-8">
                <div className="text-center text-gray-400">
                  <GlobeHemisphereWest className="w-8 h-8 mx-auto mb-2" weight="duotone" />
                  <p className="text-sm">No external context data recorded yet</p>
                </div>
              </Card>
            )}

            {/* Financial Context */}
            {dataStore.financialContext ? (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Financial Context</h3>
                <div className="grid grid-cols-2 gap-3">
                  <KeyValue label="Revenue Band" value={dataStore.financialContext.revenueBand} />
                  <KeyValue label="Cash Position" value={dataStore.financialContext.cashPosition} />
                  <KeyValue label="Budget Type" value={dataStore.financialContext.budgetType} />
                  <KeyValue label="CapEx Capacity" value={dataStore.financialContext.capexCapacity12mo} />
                  <KeyValue label="Investment Priority" value={dataStore.financialContext.investmentPriority} />
                </div>
              </Card>
            ) : (
              <Card className="py-8">
                <div className="text-center text-gray-400">
                  <GlobeHemisphereWest className="w-8 h-8 mx-auto mb-2" weight="duotone" />
                  <p className="text-sm">No financial context data recorded yet</p>
                </div>
              </Card>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
