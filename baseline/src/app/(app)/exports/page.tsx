"use client";

import { useState } from 'react';
import { DownloadSimple, FileXls, FileText, Package, Check } from '@phosphor-icons/react';
import { Card, Button, Badge, Select } from '@/components/ui';
import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: typeof FileXls;
  format: 'xlsx' | 'csv' | 'json';
  category: 'data' | 'report';
}

const exportOptions: ExportOption[] = [
  {
    id: 'scope3-data-pack',
    name: 'Scope 3 Data Pack',
    description: 'All upstream and downstream data formatted for GHG calculations',
    icon: Package,
    format: 'csv',
    category: 'report',
  },
  {
    id: 'all-data',
    name: 'All Operational Data',
    description: 'Complete export of all domains in a single file',
    icon: FileXls,
    format: 'csv',
    category: 'data',
  },
  {
    id: 'energy-data',
    name: 'Energy & Utilities',
    description: 'Electricity, fuel, and water consumption data',
    icon: FileXls,
    format: 'csv',
    category: 'data',
  },
  {
    id: 'materials-data',
    name: 'Materials & Packaging',
    description: 'Raw materials and packaging input data',
    icon: FileXls,
    format: 'csv',
    category: 'data',
  },
  {
    id: 'transport-data',
    name: 'Transport & Logistics',
    description: 'Inbound, outbound, and internal transport logs',
    icon: FileXls,
    format: 'csv',
    category: 'data',
  },
  {
    id: 'workforce-data',
    name: 'Workforce & Safety',
    description: 'Headcount, health & safety, and training data',
    icon: FileXls,
    format: 'csv',
    category: 'data',
  },
  {
    id: 'outputs-data',
    name: 'Outputs & Waste',
    description: 'Waste, product outputs, and emissions data',
    icon: FileXls,
    format: 'csv',
    category: 'data',
  },
  {
    id: 'raw-json',
    name: 'Raw Data (JSON)',
    description: 'Complete data export in JSON format for integration',
    icon: FileText,
    format: 'json',
    category: 'data',
  },
];

interface ExportHistoryItem {
  id: string;
  name: string;
  format: string;
  createdAt: string;
}

export default function ExportsPage() {
  const { company, sites } = useAppStore();
  const dataStore = useDataStore();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedSite, setSelectedSite] = useState('all');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);

  const yearOptions = [
    { value: new Date().getFullYear().toString(), label: new Date().getFullYear().toString() },
    { value: (new Date().getFullYear() - 1).toString(), label: (new Date().getFullYear() - 1).toString() },
  ];

  const siteOptions = [
    { value: 'all', label: 'All Sites' },
    ...sites.map((s) => ({ value: s.id, label: s.siteName })),
  ];

  const handleExport = async (exportOption: ExportOption) => {
    setIsExporting(exportOption.id);

    // Simulate export delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate export data based on option
    let exportData: any;
    let fileName: string;

    switch (exportOption.id) {
      case 'raw-json':
        exportData = {
          company,
          sites,
          materials: dataStore.materials,
          materialInputs: dataStore.materialInputs,
          packaging: dataStore.packaging,
          packagingInputs: dataStore.packagingInputs,
          energyElectricity: dataStore.energyElectricity,
          energyFuels: dataStore.energyFuels,
          energyWater: dataStore.energyWater,
          assets: dataStore.assets,
          transportLogs: dataStore.transportLogs,
          workforce: dataStore.workforce,
          healthSafety: dataStore.healthSafety,
          training: dataStore.training,
          waste: dataStore.waste,
          productOutputs: dataStore.productOutputs,
          externalContext: dataStore.externalContext,
          financialContext: dataStore.financialContext,
          exportedAt: new Date().toISOString(),
        };
        fileName = `five-stacks-data-${selectedYear}.json`;

        const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        downloadBlob(jsonBlob, fileName);
        break;

      case 'scope3-data-pack':
        // Generate CSV for Scope 3 data
        const scope3Data = generateScope3DataPack(dataStore, sites, selectedYear, selectedSite);
        fileName = `scope3-data-pack-${selectedYear}.csv`;
        downloadCSV(scope3Data, fileName);
        break;

      case 'energy-data':
        const energyData = generateEnergyExport(dataStore, sites, selectedYear, selectedSite);
        fileName = `energy-data-${selectedYear}.csv`;
        downloadCSV(energyData, fileName);
        break;

      case 'materials-data':
        const materialsData = generateMaterialsExport(dataStore, selectedYear, selectedSite);
        fileName = `materials-packaging-${selectedYear}.csv`;
        downloadCSV(materialsData, fileName);
        break;

      case 'transport-data':
        const transportData = generateTransportExport(dataStore, selectedYear, selectedSite);
        fileName = `transport-${selectedYear}.csv`;
        downloadCSV(transportData, fileName);
        break;

      case 'workforce-data':
        const workforceData = generateWorkforceExport(dataStore, selectedYear, selectedSite);
        fileName = `workforce-safety-${selectedYear}.csv`;
        downloadCSV(workforceData, fileName);
        break;

      case 'outputs-data':
        const outputsData = generateOutputsExport(dataStore, selectedYear, selectedSite);
        fileName = `outputs-waste-${selectedYear}.csv`;
        downloadCSV(outputsData, fileName);
        break;

      case 'all-data':
        const allData = generateAllDataExport(dataStore, selectedYear, selectedSite);
        fileName = `all-operational-data-${selectedYear}.csv`;
        downloadCSV(allData, fileName);
        break;

      default:
        break;
    }

    // Add to history
    setExportHistory([
      {
        id: crypto.randomUUID(),
        name: exportOption.name,
        format: exportOption.format.toUpperCase(),
        createdAt: new Date().toISOString(),
      },
      ...exportHistory,
    ]);

    setIsExporting(null);
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: string[][], fileName: string) => {
    const csv = data.map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, fileName);
  };

  const generateScope3DataPack = (store: typeof dataStore, _sitesList: typeof sites, year: string, siteId: string) => {
    const headers = ['Category', 'Sub-category', 'Description', 'Quantity', 'Unit', 'Supplier/Origin', 'Period', 'Data Source', 'Confidence'];
    const rows: string[][] = [headers];

    store.materialInputs.forEach((input) => {
      const material = store.materials.find((m) => m.id === input.materialId);
      if (siteId !== 'all' && input.siteId !== siteId) return;
      if (!input.period.startsWith(year)) return;

      rows.push([
        'Scope 3 Cat 1',
        'Purchased Goods',
        material?.materialName || 'Unknown',
        input.quantity.toString(),
        input.unit,
        `${input.supplierName || ''} (${input.supplierCountry || ''})`,
        input.period,
        input.source,
        input.confidence,
      ]);
    });

    store.packagingInputs.forEach((input) => {
      const pkg = store.packaging.find((p) => p.id === input.packagingId);
      if (siteId !== 'all' && input.siteId !== siteId) return;
      if (!input.period.startsWith(year)) return;

      rows.push([
        'Scope 3 Cat 1',
        'Packaging',
        pkg?.packagingName || 'Unknown',
        input.totalWeightKg.toString(),
        'kg',
        input.supplierName || '',
        input.period,
        input.source,
        input.confidence,
      ]);
    });

    store.transportLogs
      .filter((t) => t.direction === 'inbound')
      .forEach((log) => {
        if (siteId !== 'all' && log.siteId !== siteId) return;
        if (!log.period.startsWith(year)) return;

        rows.push([
          'Scope 3 Cat 4',
          'Upstream Transport',
          `${log.mode} - ${log.vehicleType || 'Unknown'}`,
          log.tkm?.toString() || log.distanceKm?.toString() || '',
          log.tkm ? 'tkm' : 'km',
          log.carrierName || '',
          log.period,
          log.source,
          log.confidence,
        ]);
      });

    store.waste.forEach((w) => {
      if (siteId !== 'all' && w.siteId !== siteId) return;
      if (!w.period.startsWith(year)) return;

      rows.push([
        'Scope 3 Cat 5',
        'Waste',
        `${w.wasteCategory} - ${w.disposalRoute}`,
        w.quantityKg.toString(),
        'kg',
        w.disposalPartner || '',
        w.period,
        w.source,
        w.confidence,
      ]);
    });

    store.transportLogs
      .filter((t) => t.direction === 'outbound')
      .forEach((log) => {
        if (siteId !== 'all' && log.siteId !== siteId) return;
        if (!log.period.startsWith(year)) return;

        rows.push([
          'Scope 3 Cat 9',
          'Downstream Transport',
          `${log.mode} - ${log.vehicleType || 'Unknown'}`,
          log.tkm?.toString() || log.distanceKm?.toString() || '',
          log.tkm ? 'tkm' : 'km',
          log.carrierName || '',
          log.period,
          log.source,
          log.confidence,
        ]);
      });

    return rows;
  };

  const generateEnergyExport = (store: typeof dataStore, sitesList: typeof sites, year: string, siteId: string) => {
    const headers = ['Type', 'Site', 'Period', 'Quantity', 'Unit', 'Source Mix', 'Cost', 'Data Source', 'Confidence'];
    const rows: string[][] = [headers];

    store.energyElectricity.forEach((e) => {
      const site = sitesList.find((s) => s.id === e.siteId);
      if (siteId !== 'all' && e.siteId !== siteId) return;
      if (!e.period.startsWith(year)) return;

      rows.push([
        'Electricity',
        site?.siteName || 'Unknown',
        e.period,
        e.consumptionKwh.toString(),
        'kWh',
        `Grid ${e.sourceGridPercent}%, Renewable ${e.sourceOnsiteRenewablePercent}%`,
        e.cost?.toString() || '',
        e.source,
        e.confidence,
      ]);
    });

    store.energyFuels.forEach((f) => {
      const site = sitesList.find((s) => s.id === f.siteId);
      if (siteId !== 'all' && f.siteId !== siteId) return;
      if (!f.period.startsWith(year)) return;

      rows.push([
        `Fuel - ${f.fuelType}`,
        site?.siteName || 'Unknown',
        f.period,
        f.quantity.toString(),
        f.unit,
        f.purpose,
        f.cost?.toString() || '',
        f.source,
        f.confidence,
      ]);
    });

    store.energyWater.forEach((w) => {
      const site = sitesList.find((s) => s.id === w.siteId);
      if (siteId !== 'all' && w.siteId !== siteId) return;
      if (!w.period.startsWith(year)) return;

      rows.push([
        'Water',
        site?.siteName || 'Unknown',
        w.period,
        w.withdrawalM3.toString(),
        'm\u00B3',
        '',
        w.cost?.toString() || '',
        w.source,
        w.confidence,
      ]);
    });

    return rows;
  };

  const siteName = (siteId: string) => sites.find((s) => s.id === siteId)?.siteName || 'Unknown';
  const filterPeriodSite = (period: string, recordSiteId: string, year: string, siteId: string) =>
    period.startsWith(year) && (siteId === 'all' || recordSiteId === siteId);

  const generateMaterialsExport = (store: typeof dataStore, year: string, siteId: string) => {
    const headers = ['Material', 'Category', 'Site', 'Period', 'Quantity', 'Unit', 'Virgin %', 'Recycled %', 'Supplier', 'Country', 'Cost', 'Hazardous', 'Data Source', 'Confidence'];
    const rows: string[][] = [headers];

    store.materialInputs.forEach((input) => {
      if (!filterPeriodSite(input.period, input.siteId, year, siteId)) return;
      const material = store.materials.find((m) => m.id === input.materialId);
      rows.push([
        material?.materialName || 'Unknown', material?.materialCategory || '',
        siteName(input.siteId), input.period, input.quantity.toString(), input.unit,
        input.virginContentPercent?.toString() || '', input.recycledContentPercent?.toString() || '',
        input.supplierName || '', input.supplierCountry || '',
        input.cost?.toString() || '', input.hazardous ? 'Yes' : 'No',
        input.source, input.confidence,
      ]);
    });

    store.packagingInputs.forEach((input) => {
      if (!filterPeriodSite(input.period, input.siteId, year, siteId)) return;
      const pkg = store.packaging.find((p) => p.id === input.packagingId);
      rows.push([
        pkg?.packagingName || 'Unknown', `packaging_${pkg?.packagingLevel || ''}`,
        siteName(input.siteId), input.period, input.totalWeightKg.toString(), 'kg',
        '', input.recycledContentPercent?.toString() || '',
        input.supplierName || '', input.supplierCountry || '',
        input.cost?.toString() || '', 'No',
        input.source, input.confidence,
      ]);
    });

    return rows;
  };

  const generateTransportExport = (store: typeof dataStore, year: string, siteId: string) => {
    const headers = ['Direction', 'Mode', 'Vehicle Type', 'Site', 'Period', 'Distance (km)', 'Weight (t)', 'tkm', 'Fuel Type', 'Fuel Qty', 'Carrier', 'Load %', 'Spend', 'Data Source', 'Confidence'];
    const rows: string[][] = [headers];

    store.transportLogs.forEach((log) => {
      if (!filterPeriodSite(log.period, log.siteId, year, siteId)) return;
      rows.push([
        log.direction, log.mode, log.vehicleType || '',
        siteName(log.siteId), log.period,
        log.distanceKm?.toString() || '', log.weightT?.toString() || '', log.tkm?.toString() || '',
        log.fuelType || '', log.fuelQuantity?.toString() || '',
        log.carrierName || '', log.loadFactorPercent?.toString() || '',
        log.spend?.toString() || '', log.source, log.confidence,
      ]);
    });

    return rows;
  };

  const generateWorkforceExport = (store: typeof dataStore, year: string, siteId: string) => {
    const headers: string[] = [];
    const rows: string[][] = [];

    // Workforce headcount
    const wfHeaders = ['Type', 'Site', 'Period', 'Total FTE', 'Headcount', 'Permanent', 'Temporary', 'Contractors', 'Female %', 'Male %', 'Hours Worked', 'Data Source', 'Confidence'];
    rows.push(wfHeaders);

    store.workforce.forEach((w) => {
      if (!filterPeriodSite(w.period, w.siteId, year, siteId)) return;
      rows.push([
        'Workforce', siteName(w.siteId), w.period,
        w.totalFte.toString(), w.totalHeadcount?.toString() || '',
        w.permanentEmployees?.toString() || '', w.temporaryEmployees?.toString() || '',
        w.contractors?.toString() || '', w.femalePercent?.toString() || '',
        w.malePercent?.toString() || '', w.totalHoursWorked.toString(),
        w.source, w.confidence,
      ]);
    });

    store.healthSafety.forEach((hs) => {
      if (!filterPeriodSite(hs.period, hs.siteId, year, siteId)) return;
      rows.push([
        'Health & Safety', siteName(hs.siteId), hs.period,
        '', '', '', '', '', '', '',
        `Incidents: ${hs.recordableIncidents}, LTI: ${hs.lostTimeIncidents}, Fatalities: ${hs.fatalities}`,
        hs.source, hs.confidence,
      ]);
    });

    store.training.forEach((t) => {
      if (!filterPeriodSite(t.period, t.siteId, year, siteId)) return;
      rows.push([
        'Training', siteName(t.siteId), t.period,
        '', '', '', '', '', '', '',
        `Hours: ${t.totalTrainingHours || 0}, Employees: ${t.employeesTrained || 0}, Safety: ${t.safetyTrainingHours || 0}h`,
        t.source, t.confidence,
      ]);
    });

    return rows;
  };

  const generateOutputsExport = (store: typeof dataStore, year: string, siteId: string) => {
    const headers = ['Type', 'Category', 'Detail', 'Site', 'Period', 'Quantity', 'Unit', 'Disposal/Destination', 'Partner', 'Hazardous', 'Cost', 'Revenue', 'Data Source', 'Confidence'];
    const rows: string[][] = [headers];

    store.waste.forEach((w) => {
      if (!filterPeriodSite(w.period, w.siteId, year, siteId)) return;
      rows.push([
        'Waste', w.wasteCategory, w.wasteType || '',
        siteName(w.siteId), w.period, w.quantityKg.toString(), 'kg',
        w.disposalRoute, w.disposalPartner || '', w.hazardous ? 'Yes' : 'No',
        w.cost?.toString() || '', w.revenue?.toString() || '',
        w.source, w.confidence,
      ]);
    });

    store.productOutputs.forEach((p) => {
      if (!filterPeriodSite(p.period, p.siteId, year, siteId)) return;
      rows.push([
        'Product Output', '', p.productName,
        siteName(p.siteId), p.period, p.quantity.toString(), p.unit,
        '', '', '', '', p.revenue?.toString() || '',
        p.source, p.confidence,
      ]);
    });

    store.directEmissions.forEach((e) => {
      if (!filterPeriodSite(e.period, e.siteId, year, siteId)) return;
      rows.push([
        'Direct Emission', e.emissionSource, e.sourceDetail,
        siteName(e.siteId), e.period, e.quantityKg.toString(), 'kg',
        '', '', '', '', '',
        e.source, e.confidence,
      ]);
    });

    store.effluents.forEach((ef) => {
      if (!filterPeriodSite(ef.period, ef.siteId, year, siteId)) return;
      rows.push([
        'Effluent', ef.effluentType, '',
        siteName(ef.siteId), ef.period, ef.volumeM3.toString(), 'm\u00B3',
        ef.destination, '', '', '', '',
        ef.source, ef.confidence,
      ]);
    });

    return rows;
  };

  const generateAllDataExport = (store: typeof dataStore, year: string, siteId: string) => {
    const rows: string[][] = [];

    // Combine all domains with a domain column
    const energy = generateEnergyExport(store, sites, year, siteId);
    const materials = generateMaterialsExport(store, year, siteId);
    const transport = generateTransportExport(store, year, siteId);
    const workforce = generateWorkforceExport(store, year, siteId);
    const outputs = generateOutputsExport(store, year, siteId);

    rows.push(['=== ENERGY & UTILITIES ===']);
    rows.push(...energy);
    rows.push([]);
    rows.push(['=== MATERIALS & PACKAGING ===']);
    rows.push(...materials);
    rows.push([]);
    rows.push(['=== TRANSPORT & LOGISTICS ===']);
    rows.push(...transport);
    rows.push([]);
    rows.push(['=== WORKFORCE & SAFETY ===']);
    rows.push(...workforce);
    rows.push([]);
    rows.push(['=== OUTPUTS & WASTE ===']);
    rows.push(...outputs);

    return rows;
  };

  const dataExports = exportOptions.filter((e) => e.category === 'data');
  const reportExports = exportOptions.filter((e) => e.category === 'report');

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Exports</h1>
          <p className="text-gray-500">Download your data in various formats for reporting and analysis.</p>
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

      {/* Reports Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportExports.map((option) => {
            const Icon = option.icon;
            const isLoading = isExporting === option.id;

            return (
              <Card key={option.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center shadow-sm">
                      <Icon className="w-6 h-6 text-white" weight="duotone" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{option.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                      <Badge variant="info" className="mt-2">
                        {option.format.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleExport(option)}
                    disabled={isLoading}
                    className="flex-shrink-0"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <DownloadSimple className="w-4 h-4" weight="duotone" />
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Data Exports Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Exports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataExports.map((option) => {
            const Icon = option.icon;
            const isLoading = isExporting === option.id;

            return (
              <Card key={option.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-stack-2 to-stack-3 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" weight="duotone" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{option.name}</h3>
                      <p className="text-xs text-gray-500">{option.format.toUpperCase()}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(option)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-forest-700 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <DownloadSimple className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Exports</h2>
          <Card>
            <div className="divide-y">
              {exportHistory.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" weight="bold" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="info">{item.format}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
