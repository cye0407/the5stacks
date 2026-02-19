/**
 * Supabase table name constants.
 *
 * Maps camelCase store keys to their corresponding snake_case Supabase table names.
 */
export const TABLES = {
  // appStore
  companies: 'companies',
  sites: 'sites',
  swot: 'swot',
  goals: 'goals',
  regulatoryContext: 'regulatory_context',
  onboardingState: 'onboarding_state',

  // dataStore
  materials: 'materials',
  materialInputs: 'material_inputs',
  packaging: 'packaging',
  packagingInputs: 'packaging_inputs',
  energyElectricity: 'energy_electricity',
  energyFuels: 'energy_fuels',
  energyWater: 'energy_water',
  siteDetails: 'site_details',
  assets: 'assets',
  transportLogs: 'transport_logs',
  workforce: 'workforce',
  healthSafety: 'health_safety',
  training: 'training',
  waste: 'waste',
  productOutputs: 'product_outputs',
  directEmissions: 'direct_emissions',
  effluents: 'effluents',
  externalContext: 'external_context',
  financialContext: 'financial_context',
  buyerRequirements: 'buyer_requirements',
  reflections: 'reflections',
} as const;

export type TableKey = keyof typeof TABLES;
