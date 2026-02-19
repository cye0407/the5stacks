// ============================================
// Five Stacks - Type Definitions
// ============================================

// Common Types
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type DataSource = 'bill' | 'invoice' | 'erp' | 'meter' | 'supplier' | 'estimate' | 'other';

export interface DataQuality {
  source: DataSource;
  sourceDetail?: string;
  confidence: ConfidenceLevel;
  estimationMethod?: string;
  lastUpdated: string;
  updatedBy?: string;
}

// ============================================
// Stack 0 - Fundamentals
// ============================================

export type OwnershipType = 'private' | 'public' | 'cooperative' | 'non-profit' | 'other';
export type SiteType = 'hq' | 'production' | 'warehouse' | 'office' | 'retail' | 'mixed' | 'farm' | 'field' | 'processing' | 'other';
export type SiteOwnership = 'owned' | 'leased' | 'shared';
export type TimeHorizon = '1-year' | '2-3-years' | '5-years';
export type PrimaryMotivation = 'compliance' | 'cost' | 'customers' | 'values' | 'competitive' | 'financing' | 'risk' | 'other';
export type RevenueBand = '<500k' | '500k-1m' | '1m-5m' | '5m-10m' | '10m-50m' | '50m-100m' | '>100m' | 'prefer_not_to_say';
export type ApplicabilityStatus = 'yes' | 'no' | 'unsure';

export interface Company {
  id: string;
  legalEntityName: string;
  tradingName?: string;
  registrationNumber?: string;
  industryCode: string;
  industryDescription: string;
  ownershipType: OwnershipType;
  foundingYear?: number;
  headquartersCountry: string;
  headquartersCity?: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  totalFte: number;
  fteConfidence: ConfidenceLevel;
  numberOfSites: number;
  primarySiteCountry: string;
  otherSiteCountries?: string[];
  revenueBand: RevenueBand;
  revenueCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  companyId: string;
  siteName: string;
  siteType: SiteType;
  country: string;
  city?: string;
  floorAreaM2?: number;
  landAreaHa?: number;
  ownership: SiteOwnership;
  operationalSince?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SWOT {
  id: string;
  companyId: string;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  updatedAt: string;
}

export interface Goals {
  id: string;
  companyId: string;
  primaryGoal: string;
  timeHorizon: TimeHorizon;
  primaryMotivation: PrimaryMotivation;
  secondaryMotivations?: PrimaryMotivation[];
  successDefinition: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegulatoryContext {
  id: string;
  companyId: string;
  csrdApplicable: ApplicabilityStatus;
  vsmeApplicable: ApplicabilityStatus;
  otherFrameworks?: string[];
  customerRequirements?: string;
  certificationsHeld?: string[];
  certificationsTargeted?: string[];
  updatedAt: string;
}

// ============================================
// Stack 1 - Baseline Data
// ============================================

// Domain 1: Materials
export type MaterialCategory = 'raw_material' | 'component' | 'consumable' | 'other' | (string & {});
export type UnitOfMeasure = 'kg' | 't' | 'L' | 'm3' | 'units';

export interface Material {
  id: string;
  companyId: string;
  materialName: string;
  materialCategory: MaterialCategory;
  materialType: string;
  unitOfMeasure: UnitOfMeasure;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialInput extends DataQuality {
  id: string;
  materialId: string;
  siteId: string;
  period: string; // YYYY-MM
  quantity: number;
  unit: string;
  virginContentPercent?: number;
  recycledContentPercent?: number;
  supplierName: string;
  supplierCountry: string;
  supplierId?: string;
  cost?: number;
  costCurrency?: string;
  hazardous?: boolean;
  certification?: string;
}

// Domain 2: Packaging
export type PackagingLevel = 'primary' | 'secondary' | 'tertiary';
export type PackagingMaterial = 'paper' | 'cardboard' | 'plastic' | 'metal' | 'glass' | 'wood' | 'composite' | 'other' | (string & {});
export type RecyclabilityClass = 'recyclable' | 'partially' | 'not_recyclable' | 'unknown';

export interface Packaging {
  id: string;
  companyId: string;
  packagingName: string;
  packagingLevel: PackagingLevel;
  materialType: PackagingMaterial;
  materialDetail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackagingInput extends DataQuality {
  id: string;
  packagingId: string;
  siteId: string;
  period: string;
  quantityUnits: number;
  totalWeightKg: number;
  recycledContentPercent?: number;
  recyclabilityClass?: RecyclabilityClass;
  linkedProduct?: string;
  supplierName?: string;
  supplierCountry?: string;
  cost?: number;
}

// Domain 3: Energy & Utilities
export type FuelType = 'natural_gas' | 'lpg' | 'heating_oil' | 'diesel' | 'petrol' | 'coal' | 'biomass' | 'other';
export type FuelPurpose = 'heating' | 'process' | 'vehicles' | 'backup_generation' | 'other';
export type WaterSource = 'municipal' | 'groundwater' | 'surface' | 'rainwater' | 'other';
export type DischargeDestination = 'sewer' | 'treatment_plant' | 'surface_water' | 'other';

export interface EnergyElectricity extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  consumptionKwh: number;
  sourceGridPercent: number;
  sourceOnsiteRenewablePercent: number;
  sourcePpaPercent: number;
  greenTariff?: boolean;
  cost?: number;
  costCurrency?: string;
}

export interface EnergyFuel extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  fuelType: FuelType;
  quantity: number;
  unit: 'kwh' | 'L' | 'm3' | 'kg' | 't';
  purpose: FuelPurpose;
  cost?: number;
}

export interface EnergyWater extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  withdrawalM3: number;
  waterSource: WaterSource;
  dischargeM3?: number;
  dischargeDestination?: DischargeDestination;
  consumptionM3?: number; // calculated: withdrawal - discharge
  cost?: number;
}

export interface CalculatedEmissions {
  id: string;
  siteId: string;
  period: string;
  scope1Tco2e: number;
  scope1CalculationMethod: string;
  scope2LocationTco2e: number;
  scope2MarketTco2e?: number;
  scope2CalculationMethod: string;
  emissionFactorSource: string;
  userOverride?: boolean;
  userOverrideNotes?: string;
}

// Domain 4: Infrastructure
export type AssetCategory = 'production_equipment' | 'hvac' | 'vehicles' | 'it' | 'other';
export type Criticality = 'low' | 'medium' | 'high' | 'critical';
export type MaintenanceFrequency = 'monthly' | 'quarterly' | 'annual' | 'as_needed';

export interface SiteDetails {
  id: string;
  siteId: string;
  floorAreaM2: number;
  floorAreaProductionM2?: number;
  floorAreaOfficeM2?: number;
  floorAreaWarehouseM2?: number;
  buildingAgeYears?: number;
  lastMajorRenovation?: string;
  energyRating?: string;
  ownedOrLeased: SiteOwnership;
  leaseEndDate?: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  siteId: string;
  assetName: string;
  assetCategory: AssetCategory;
  assetType: string;
  quantity: number;
  acquisitionYear?: number;
  expectedLifespanYears?: number;
  criticality?: Criticality;
  replacementCost?: number;
  energyConsumptionKwhYear?: number;
  maintenanceFrequency?: MaintenanceFrequency;
  createdAt: string;
  updatedAt: string;
}

// Domain 5: Transport
export type TransportDirection = 'inbound' | 'outbound' | 'internal';
export type TransportMode = 'road' | 'rail' | 'sea' | 'air' | 'multimodal' | (string & {});
export type TransportFuelType = 'diesel' | 'petrol' | 'electric' | 'lng' | 'unknown';
export type TransportDataType = 'activity_based' | 'spend_based';

export interface TransportLog extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  direction: TransportDirection;
  mode: TransportMode;
  vehicleType?: string;
  distanceKm?: number;
  weightT?: number;
  tkm?: number; // calculated: weight x distance
  fuelType?: TransportFuelType;
  fuelQuantity?: number;
  fuelUnit?: 'L' | 'kwh' | 'kg';
  carrierName?: string;
  loadFactorPercent?: number;
  spend?: number;
  spendCurrency?: string;
  dataType: TransportDataType;
}

// Domain 6: Workforce
export interface Workforce extends DataQuality {
  id: string;
  siteId: string;
  period: string; // YYYY-MM or YYYY-Q#
  totalFte: number;
  totalHeadcount?: number;
  permanentEmployees?: number;
  temporaryEmployees?: number;
  contractors?: number;
  femalePercent?: number;
  malePercent?: number;
  otherGenderPercent?: number;
  totalHoursWorked: number;
}

export interface HealthSafety extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  recordableIncidents: number;
  lostTimeIncidents: number;
  lostDays?: number;
  fatalities: number;
  nearMisses?: number;
  trir?: number; // calculated
  ltir?: number; // calculated
}

export interface Training extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  totalTrainingHours?: number;
  employeesTrained?: number;
  trainingHoursPerFte?: number; // calculated
  safetyTrainingHours?: number;
  sustainabilityTrainingHours?: number;
}

// Domain 7: Outputs
export type WasteCategory = 'general' | 'recyclable' | 'organic' | 'hazardous' | 'weee' | 'construction' | 'other';
export type DisposalRoute = 'landfill' | 'incineration' | 'recycling' | 'composting' | 'reuse' | 'other';
export type EmissionSource = 'refrigerants' | 'process_emissions' | 'fugitive' | 'other';
export type EffluentType = 'wastewater' | 'process_water' | 'stormwater' | 'other';
export type TreatmentLevel = 'none' | 'primary' | 'secondary' | 'tertiary';

export interface Waste extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  wasteCategory: WasteCategory;
  wasteType?: string;
  quantityKg: number;
  disposalRoute: DisposalRoute;
  disposalPartner?: string;
  hazardous: boolean;
  cost?: number;
  revenue?: number;
}

export interface ProductOutput extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  productName: string;
  quantity: number;
  unit: string;
  revenue?: number;
}

export interface DirectEmission extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  emissionSource: EmissionSource;
  sourceDetail: string;
  refrigerantType?: string;
  quantityKg: number;
  tco2e?: number; // calculated based on GWP
}

export interface Effluent extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  effluentType: EffluentType;
  volumeM3: number;
  destination: 'municipal_sewer' | 'treatment_plant' | 'surface_water' | 'ground';
  treatmentLevel?: TreatmentLevel;
  permitRequired?: boolean;
  permitCompliant?: boolean;
}

// ============================================
// Stack 1 Phase 2: Context
// ============================================

export type MarketScope = 'local' | 'regional' | 'national' | 'eu' | 'global';
export type CustomerType = 'b2b' | 'b2c' | 'both';
export type ConcentrationLevel = 'low' | 'medium' | 'high';
export type PressureLevel = 'none' | 'low' | 'medium' | 'high';
export type PremiumPotential = 'none' | 'small' | 'medium' | 'significant';
export type CSRDStatus = 'not_applicable' | 'will_apply' | 'currently_applies';
export type VSMEAdoption = 'not_considering' | 'considering' | 'implementing' | 'complete';
export type RequirementType = 'questionnaire' | 'data_request' | 'certification' | 'audit' | 'other';
export type RequirementFrequency = 'one_time' | 'annual' | 'ongoing';
export type RequirementStatus = 'not_started' | 'in_progress' | 'complete' | 'recurring';

export interface ExternalContext {
  id: string;
  companyId: string;
  // Market
  primaryMarkets: string[];
  marketScope: MarketScope;
  customerType: CustomerType;
  keyCustomerIndustries: string[];
  customerConcentration: ConcentrationLevel;
  topCustomerSharePercent?: number;
  // Competitive
  competitivePressureSustainability: PressureLevel;
  competitorSustainabilityActivity?: string;
  marketSustainabilityTrend: 'not_a_factor' | 'emerging' | 'established' | 'differentiator';
  pricePremiumPotential?: PremiumPotential;
  // Regulatory
  csrdStatus: CSRDStatus;
  csrdExpectedDate?: string;
  vsmeAdoption: VSMEAdoption;
  otherRegulations?: string[];
  regulatoryPressure: PressureLevel;
  updatedAt: string;
}

export interface BuyerRequirement {
  id: string;
  companyId: string;
  buyerName: string;
  requirementType: RequirementType;
  platform?: string;
  frequency: RequirementFrequency;
  deadline?: string;
  status: RequirementStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type GrossMarginBand = '<10' | '10-20' | '20-40' | '40-60' | '>60';
export type ProfitabilityTrend = 'declining' | 'stable' | 'growing';
export type CashPosition = 'tight' | 'adequate' | 'strong';
export type BudgetType = 'none' | 'ad_hoc' | 'dedicated_line_item';
export type CapexCapacity = 'none' | 'limited' | 'moderate' | 'significant';
export type InvestmentPriority = 'not_a_priority' | 'low' | 'medium' | 'high';
export type CostConcern = 'energy' | 'materials' | 'labor' | 'waste' | 'logistics' | 'compliance' | 'other';
export type FinancingRelationship = 'bank_loans' | 'investors' | 'grants' | 'none';
export type SustainabilityLinkedFinancing = 'no' | 'exploring' | 'in_place';
export type LenderESGRequirements = 'none' | 'informal' | 'formal_requirements';

export interface FinancialContext {
  id: string;
  companyId: string;
  // Position
  revenueBand: RevenueBand;
  grossMarginBand: GrossMarginBand;
  profitabilityTrend: ProfitabilityTrend;
  cashPosition: CashPosition;
  // Investment
  sustainabilityBudgetAnnual?: number;
  sustainabilityBudgetCurrency?: string;
  budgetType: BudgetType;
  capexCapacity12mo: CapexCapacity;
  investmentPriority: InvestmentPriority;
  // Cost
  primaryCostConcerns: CostConcern[];
  costPressureLevel: PressureLevel;
  costReductionTarget?: number;
  costReductionTimeframe?: TimeHorizon;
  // Financing
  financingRelationships: FinancingRelationship[];
  sustainabilityLinkedFinancing: SustainabilityLinkedFinancing;
  lenderEsgRequirements: LenderESGRequirements;
  insuranceEsgQuestions?: boolean;
  updatedAt: string;
}

// ============================================
// Reflection
// ============================================

export interface Reflection {
  id: string;
  companyId: string;
  reflectionStandout: string;
  reflectionSurprise: string;
  reflectionConcern: string;
  completedAt: string;
}

// ============================================
// Agricultural Data
// ============================================

export type LandType = 'arable' | 'pasture' | 'woodland' | 'orchard' | 'set_aside' | 'buildings_yards' | 'other' | (string & {});
export type FertiliserType = 'synthetic_n' | 'synthetic_p' | 'synthetic_k' | 'organic_manure' | 'organic_compost' | 'organic_slurry' | 'lime' | 'other' | (string & {});
export type LivestockType = 'dairy_cattle' | 'beef_cattle' | 'sheep' | 'pigs' | 'poultry_layers' | 'poultry_broilers' | 'goats' | 'horses' | 'other' | (string & {});
export type CropType = 'cereals' | 'oilseeds' | 'pulses' | 'root_crops' | 'vegetables' | 'fruit' | 'forage' | 'other' | (string & {});

export interface LandUse {
  id: string;
  siteId: string;
  landType: LandType;
  areaHa: number;
  fieldName?: string;
  soilOrganicMatterPercent?: number;
  soilPh?: number;
  irrigated?: boolean;
  notes?: string;
  updatedAt: string;
}

export interface FertiliserApplication extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  fertiliserType: FertiliserType;
  productName?: string;
  quantityKg: number;
  areaAppliedHa?: number;
  nitrogenContentPercent?: number;
  phosphorusContentPercent?: number;
  potassiumContentPercent?: number;
  cost?: number;
}

export interface LivestockRecord extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  livestockType: LivestockType;
  headcount: number;
  livestockUnits?: number; // calculated: headcount × LU factor
  averageWeightKg?: number;
  grazingMonths?: number;
  notes?: string;
}

export interface CropOutput extends DataQuality {
  id: string;
  siteId: string;
  period: string;
  cropType: CropType;
  cropName: string;
  areaHa: number;
  yieldTonnes: number;
  yieldPerHa?: number; // calculated: yieldTonnes / areaHa
  nitrogenRemovedKg?: number; // calculated from crop type factors
  revenue?: number;
  destination?: 'sold' | 'stored' | 'feed' | 'waste' | 'other';
}

// Known livestock types for emission factors
type KnownLivestockType = 'dairy_cattle' | 'beef_cattle' | 'sheep' | 'pigs' | 'poultry_layers' | 'poultry_broilers' | 'goats' | 'horses' | 'other';

// Agricultural calculation constants
export const LIVESTOCK_EMISSION_FACTORS: Record<KnownLivestockType, { ch4EntericKgPerHead: number; ch4ManureKgPerHead: number; n2oManureKgPerHead: number; luFactor: number }> = {
  dairy_cattle: { ch4EntericKgPerHead: 128, ch4ManureKgPerHead: 16, n2oManureKgPerHead: 0.6, luFactor: 1.0 },
  beef_cattle: { ch4EntericKgPerHead: 50, ch4ManureKgPerHead: 6, n2oManureKgPerHead: 0.4, luFactor: 0.8 },
  sheep: { ch4EntericKgPerHead: 8, ch4ManureKgPerHead: 0.2, n2oManureKgPerHead: 0.1, luFactor: 0.15 },
  pigs: { ch4EntericKgPerHead: 1.5, ch4ManureKgPerHead: 7, n2oManureKgPerHead: 0.3, luFactor: 0.3 },
  poultry_layers: { ch4EntericKgPerHead: 0, ch4ManureKgPerHead: 0.02, n2oManureKgPerHead: 0.01, luFactor: 0.014 },
  poultry_broilers: { ch4EntericKgPerHead: 0, ch4ManureKgPerHead: 0.02, n2oManureKgPerHead: 0.01, luFactor: 0.007 },
  goats: { ch4EntericKgPerHead: 5, ch4ManureKgPerHead: 0.2, n2oManureKgPerHead: 0.1, luFactor: 0.15 },
  horses: { ch4EntericKgPerHead: 18, ch4ManureKgPerHead: 1.6, n2oManureKgPerHead: 0.2, luFactor: 1.0 },
  other: { ch4EntericKgPerHead: 10, ch4ManureKgPerHead: 2, n2oManureKgPerHead: 0.2, luFactor: 0.5 },
};

/** Get emission factors for a livestock type, falling back to 'other' for custom types */
export function getLivestockEmissionFactors(type: LivestockType) {
  return LIVESTOCK_EMISSION_FACTORS[type as KnownLivestockType] || LIVESTOCK_EMISSION_FACTORS.other;
}

// GWP factors (AR5)
export const GWP_CH4 = 28;
export const GWP_N2O = 265;

// N₂O emission factor from fertiliser (IPCC Tier 1: 1% of N applied → N₂O-N)
export const FERTILISER_N2O_FACTOR = 0.01;
// Conversion: N₂O-N to N₂O = 44/28
export const N2O_N_TO_N2O = 44 / 28;

// Known crop types for N-removal factors
type KnownCropType = 'cereals' | 'oilseeds' | 'pulses' | 'root_crops' | 'vegetables' | 'fruit' | 'forage' | 'other';

// Crop nitrogen removal factors (kg N per tonne of harvested crop)
export const CROP_N_REMOVAL: Record<KnownCropType, number> = {
  cereals: 18,
  oilseeds: 35,
  pulses: 40,
  root_crops: 3.5,
  vegetables: 4,
  fruit: 2,
  forage: 25,
  other: 15,
};

/** Get N-removal factor for a crop type, falling back to 'other' for custom types */
export function getCropNRemoval(type: CropType): number {
  return CROP_N_REMOVAL[type as KnownCropType] ?? CROP_N_REMOVAL.other;
}

// ============================================
// Response Generator
// ============================================

export type AnswerConfidence = 'high' | 'medium' | 'low' | 'none';

export interface SavedResponse {
  id: string;
  companyId: string;
  questionnaireName: string;
  requestor?: string;
  createdAt: string;
  updatedAt: string;
  questionCount: number;
  answeredCount: number;
  confidenceBreakdown: {
    high: number;
    medium: number;
    low: number;
    none: number;
  };
  status: 'draft' | 'complete' | 'sent';
  exportedAt?: string;
  exportFormat?: string;
}

export interface ResponseAnswer {
  id: string;
  responseId: string;
  questionId: string;
  questionText: string;
  category?: string;
  answer: string;
  dataValue?: string;
  dataUnit?: string;
  dataPeriod?: string;
  dataSource?: string;
  dataConfidence?: ConfidenceLevel;
  answerConfidence: AnswerConfidence;
  methodology?: string;
  assumptions?: string;
  evidence?: string;
  userEdited: boolean;
  userNotes?: string;
}

// ============================================
// Progress & Gamification
// ============================================

export interface ProgressMetrics {
  totalDataPoints: number;
  highConfidencePercent: number;
  mediumConfidencePercent: number;
  lowConfidencePercent: number;
  estimatedPercent: number;
  dataCoveragePercent: number;
  temporalCoverageMonths: number;
  staleDataCount: number;
  completionScore: number;
  domainsWithData: number;
  totalDomains: number;
}

export type BadgeId =
  | 'full_materials'
  | 'full_transport'
  | 'supplier_origins'
  | '12_month_history'
  | 'high_confidence'
  | 'zero_estimates';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
}

// ============================================
// Onboarding State
// ============================================

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  company?: Partial<Company>;
  site?: Partial<Site>;
  swot?: Partial<SWOT>;
  goals?: Partial<Goals>;
  regulatoryContext?: Partial<RegulatoryContext>;
}

// ============================================
// App State
// ============================================

export interface User {
  id: string;
  email: string;
  name?: string;
  companyId?: string;
}

export interface AppState {
  user: User | null;
  company: Company | null;
  sites: Site[];
  isLoading: boolean;
  isOnboardingComplete: boolean;
}
