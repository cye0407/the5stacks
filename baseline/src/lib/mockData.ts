// ============================================
// Mock Data Seeder - Run this to populate stores with test data
// ============================================

import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { v4 as uuid } from 'uuid';

export function seedMockData() {
  const appStore = useAppStore.getState();
  const dataStore = useDataStore.getState();

  // ============================================
  // Company & Sites
  // ============================================
  
  const companyId = uuid();
  const siteId = uuid();

  appStore.setCompany({
    id: companyId,
    legalEntityName: 'GreenTech Manufacturing GmbH',
    tradingName: 'GreenTech',
    registrationNumber: 'HRB 12345',
    industryCode: '25.1',
    industryDescription: 'Manufacture of structural metal products',
    ownershipType: 'private',
    foundingYear: 2015,
    headquartersCountry: 'Germany',
    headquartersCity: 'Berlin',
    reportingPeriodStart: '2024-01-01',
    reportingPeriodEnd: '2024-12-31',
    totalFte: 125,
    fteConfidence: 'high',
    numberOfSites: 2,
    primarySiteCountry: 'Germany',
    otherSiteCountries: ['Poland'],
    revenueBand: '10m-50m',
    revenueCurrency: 'EUR',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  appStore.setSites([
    {
      id: siteId,
      companyId,
      siteName: 'Berlin Production Facility',
      siteType: 'production',
      country: 'Germany',
      city: 'Berlin',
      floorAreaM2: 5500,
      ownership: 'leased',
      operationalSince: '2016-03-01',
      isPrimary: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      companyId,
      siteName: 'Warsaw Warehouse',
      siteType: 'warehouse',
      country: 'Poland',
      city: 'Warsaw',
      floorAreaM2: 2000,
      ownership: 'leased',
      operationalSince: '2020-01-15',
      isPrimary: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // ============================================
  // Goals & SWOT
  // ============================================

  appStore.setGoals({
    id: uuid(),
    companyId,
    primaryGoal: 'Achieve 50% renewable energy by 2026 and reduce Scope 1+2 emissions by 30%',
    timeHorizon: '2-3-years',
    primaryMotivation: 'customers',
    secondaryMotivations: ['cost', 'values'],
    successDefinition: 'Meet customer sustainability requirements and reduce energy costs by 20%',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  appStore.setSwot({
    id: uuid(),
    companyId,
    strengths: 'Strong engineering team, modern equipment, good supplier relationships',
    weaknesses: 'Limited sustainability expertise, older building with poor insulation',
    opportunities: 'Growing demand for sustainable products, potential for solar installation',
    threats: 'Rising energy costs, increasing customer ESG requirements, competitor certifications',
    updatedAt: new Date().toISOString(),
  });

  appStore.setRegulatoryContext({
    id: uuid(),
    companyId,
    csrdApplicable: 'no',
    vsmeApplicable: 'yes',
    otherFrameworks: ['Customer questionnaires'],
    customerRequirements: 'Major automotive customers requiring EcoVadis scores',
    certificationsHeld: ['ISO 9001', 'ISO 14001'],
    certificationsTargeted: ['ISO 50001'],
    updatedAt: new Date().toISOString(),
  });

  dataStore.setExternalContext({
    id: uuid(),
    companyId,
    primaryMarkets: ['Germany', 'Poland'],
    marketScope: 'eu',
    customerType: 'b2b',
    keyCustomerIndustries: ['Automotive', 'Industrial equipment'],
    customerConcentration: 'high',
    topCustomerSharePercent: 42,
    competitivePressureSustainability: 'medium',
    competitorSustainabilityActivity:
      'Two major competitors now publish supplier questionnaires and energy reduction targets.',
    marketSustainabilityTrend: 'established',
    pricePremiumPotential: 'small',
    csrdStatus: 'not_applicable',
    vsmeAdoption: 'implementing',
    otherRegulations: ['Customer questionnaires', 'Procurement scorecards'],
    regulatoryPressure: 'medium',
    updatedAt: new Date().toISOString(),
  });

  dataStore.setFinancialContext({
    id: uuid(),
    companyId,
    revenueBand: '10m-50m',
    grossMarginBand: '10-20',
    profitabilityTrend: 'declining',
    cashPosition: 'adequate',
    sustainabilityBudgetAnnual: 15000,
    sustainabilityBudgetCurrency: 'EUR',
    budgetType: 'ad_hoc',
    capexCapacity12mo: 'limited',
    investmentPriority: 'high',
    primaryCostConcerns: ['energy', 'materials', 'waste'],
    costPressureLevel: 'high',
    costReductionTarget: 8,
    costReductionTimeframe: '1-year',
    financingRelationships: ['bank_loans'],
    sustainabilityLinkedFinancing: 'exploring',
    lenderEsgRequirements: 'informal',
    insuranceEsgQuestions: true,
    updatedAt: new Date().toISOString(),
  });

  dataStore.setBuyerRequirements([
    {
      id: uuid(),
      companyId,
      buyerName: 'AutoMotion Group',
      requirementType: 'questionnaire',
      platform: 'EcoVadis',
      frequency: 'annual',
      deadline: '2026-09-30',
      status: 'in_progress',
      notes: 'Customer wants energy, waste, and supplier traceability data in one export.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      companyId,
      buyerName: 'Nordic Components AB',
      requirementType: 'data_request',
      frequency: 'ongoing',
      deadline: '2026-06-15',
      status: 'recurring',
      notes: 'Quarterly supplier sustainability metrics requested with procurement reviews.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // ============================================
  // Energy Data
  // ============================================

  const months2024 = [
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'
  ];

  const electricityData = months2024.map((period, _i) => ({
    id: uuid(),
    siteId,
    period,
    consumptionKwh: 42000 + Math.round(Math.random() * 8000) - 4000, // ~38k-46k
    sourceGridPercent: 65,
    sourceOnsiteRenewablePercent: 15,
    sourcePpaPercent: 20,
    greenTariff: true,
    cost: 8500 + Math.round(Math.random() * 1000),
    costCurrency: 'EUR',
    source: 'bill' as const,
    confidence: 'high' as const,
    lastUpdated: new Date().toISOString(),
  }));

  dataStore.setEnergyElectricity(electricityData);

  const fuelData = months2024.map((period) => ({
    id: uuid(),
    siteId,
    period,
    fuelType: 'natural_gas' as const,
    quantity: 3500 + Math.round(Math.random() * 1000),
    unit: 'm3' as const,
    purpose: 'heating' as const,
    cost: 1200 + Math.round(Math.random() * 300),
    source: 'bill' as const,
    confidence: 'high' as const,
    lastUpdated: new Date().toISOString(),
  }));

  dataStore.setEnergyFuels(fuelData);

  const waterData = months2024.map((period) => ({
    id: uuid(),
    siteId,
    period,
    withdrawalM3: 180 + Math.round(Math.random() * 40),
    waterSource: 'municipal' as const,
    dischargeM3: 150 + Math.round(Math.random() * 30),
    dischargeDestination: 'sewer' as const,
    cost: 350 + Math.round(Math.random() * 50),
    source: 'bill' as const,
    confidence: 'high' as const,
    lastUpdated: new Date().toISOString(),
  }));

  dataStore.setEnergyWater(waterData);

  // ============================================
  // Infrastructure
  // ============================================

  dataStore.setAssets([
    {
      id: uuid(),
      siteId,
      assetName: 'Compressed air system',
      assetCategory: 'production_equipment',
      assetType: 'compressor',
      quantity: 2,
      acquisitionYear: 2017,
      expectedLifespanYears: 12,
      criticality: 'high',
      replacementCost: 65000,
      energyConsumptionKwhYear: 118000,
      maintenanceFrequency: 'quarterly',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      siteId,
      assetName: 'Powder coating line',
      assetCategory: 'production_equipment',
      assetType: 'coating',
      quantity: 1,
      acquisitionYear: 2019,
      expectedLifespanYears: 15,
      criticality: 'critical',
      replacementCost: 180000,
      energyConsumptionKwhYear: 142000,
      maintenanceFrequency: 'annual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // ============================================
  // Workforce Data
  // ============================================

  const workforceData = [
    {
      id: uuid(),
      siteId,
      period: '2024-Q4',
      totalFte: 125,
      totalHeadcount: 132,
      permanentEmployees: 118,
      temporaryEmployees: 7,
      contractors: 12,
      femalePercent: 28,
      malePercent: 71,
      otherGenderPercent: 1,
      totalHoursWorked: 245000,
      source: 'erp' as const,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    }
  ];

  dataStore.setWorkforce(workforceData);

  const healthSafetyData = [
    {
      id: uuid(),
      siteId,
      period: '2024',
      recordableIncidents: 3,
      lostTimeIncidents: 1,
      lostDays: 12,
      fatalities: 0,
      nearMisses: 8,
      source: 'other' as const,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    }
  ];

  dataStore.setHealthSafety(healthSafetyData);

  const trainingData = [
    {
      id: uuid(),
      siteId,
      period: '2024',
      totalTrainingHours: 1875,
      employeesTrained: 125,
      trainingHoursPerFte: 15,
      safetyTrainingHours: 625,
      sustainabilityTrainingHours: 250,
      source: 'other' as const,
      confidence: 'medium' as const,
      lastUpdated: new Date().toISOString(),
    }
  ];

  dataStore.setTraining(trainingData);

  // ============================================
  // Waste Data
  // ============================================

  const wasteData = [
    {
      id: uuid(),
      siteId,
      period: '2024',
      wasteCategory: 'recyclable' as const,
      wasteType: 'Metal scrap',
      quantityKg: 45000,
      disposalRoute: 'recycling' as const,
      disposalPartner: 'MetalRecycle GmbH',
      hazardous: false,
      revenue: 2500,
      source: 'invoice' as const,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: uuid(),
      siteId,
      period: '2024',
      wasteCategory: 'general' as const,
      wasteType: 'Mixed waste',
      quantityKg: 12000,
      disposalRoute: 'landfill' as const,
      disposalPartner: 'Berlin Waste Services',
      hazardous: false,
      cost: 1800,
      source: 'invoice' as const,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: uuid(),
      siteId,
      period: '2024',
      wasteCategory: 'hazardous' as const,
      wasteType: 'Waste oils and lubricants',
      quantityKg: 850,
      disposalRoute: 'incineration' as const,
      disposalPartner: 'HazWaste Solutions',
      hazardous: true,
      cost: 1200,
      source: 'invoice' as const,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    },
  ];

  dataStore.setWaste(wasteData);

  dataStore.setProductOutputs([
    {
      id: uuid(),
      siteId,
      period: '2024',
      productName: 'Structural assemblies',
      quantity: 9200,
      unit: 'units',
      revenue: 1450000,
      source: 'erp' as const,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    },
  ]);

  // ============================================
  // Materials Data
  // ============================================

  const steelId = uuid();
  const aluminumId = uuid();

  dataStore.setMaterials([
    {
      id: steelId,
      companyId,
      materialName: 'Steel sheets',
      materialCategory: 'raw_material',
      materialType: 'Steel',
      unitOfMeasure: 't',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: aluminumId,
      companyId,
      materialName: 'Aluminum profiles',
      materialCategory: 'raw_material',
      materialType: 'Aluminum',
      unitOfMeasure: 't',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  dataStore.setMaterialInputs([
    {
      id: uuid(),
      materialId: steelId,
      siteId,
      period: '2024',
      quantity: 320,
      unit: 't',
      virginContentPercent: 70,
      recycledContentPercent: 30,
      supplierName: 'ThyssenKrupp',
      supplierCountry: 'Germany',
      cost: 256000,
      costCurrency: 'EUR',
      source: 'invoice' as const,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: uuid(),
      materialId: aluminumId,
      siteId,
      period: '2024',
      quantity: 85,
      unit: 't',
      virginContentPercent: 50,
      recycledContentPercent: 50,
      supplierName: 'Hydro Aluminum',
      supplierCountry: 'Norway',
      cost: 187000,
      costCurrency: 'EUR',
      source: 'invoice' as const,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    },
  ]);

  // ============================================
  // Packaging Data
  // ============================================

  const packagingId = uuid();

  dataStore.setPackaging([
    {
      id: packagingId,
      companyId,
      packagingName: 'Cardboard boxes',
      packagingLevel: 'secondary',
      materialType: 'cardboard',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  dataStore.setPackagingInputs([
    {
      id: uuid(),
      packagingId,
      siteId,
      period: '2024',
      quantityUnits: 15000,
      totalWeightKg: 7500,
      recycledContentPercent: 80,
      recyclabilityClass: 'recyclable',
      supplierName: 'PackRight GmbH',
      supplierCountry: 'Germany',
      cost: 12000,
      source: 'invoice' as const,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    },
  ]);

  // ============================================
  // Transport Data
  // ============================================

  dataStore.setTransportLogs([
    {
      id: uuid(),
      siteId,
      period: '2024',
      direction: 'inbound',
      mode: 'road',
      vehicleType: 'Truck',
      distanceKm: 45000,
      weightT: 405,
      tkm: 18225000,
      fuelType: 'diesel',
      carrierName: 'DHL Freight',
      dataType: 'activity_based',
      source: 'invoice' as const,
      confidence: 'medium' as const,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: uuid(),
      siteId,
      period: '2024',
      direction: 'outbound',
      mode: 'road',
      vehicleType: 'Truck',
      distanceKm: 62000,
      weightT: 380,
      tkm: 23560000,
      fuelType: 'diesel',
      carrierName: 'DB Schenker',
      dataType: 'activity_based',
      source: 'invoice' as const,
      confidence: 'medium' as const,
      lastUpdated: new Date().toISOString(),
    },
  ]);

  console.log('✅ Mock data seeded successfully!');
  return true;
}

// Function to clear all data
export function clearAllData() {
  useAppStore.getState().resetStore();
  useDataStore.getState().resetDataStore();
  console.log('🗑️ All data cleared');
}
