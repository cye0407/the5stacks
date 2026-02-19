/**
 * Supabase sync layer.
 *
 * Provides functions to load and save Zustand store data to/from Supabase.
 * All data is scoped to a user via `user_id`. Key casing is converted
 * automatically between camelCase (JS) and snake_case (Postgres).
 */

import { supabase, isSupabaseConfigured } from './client';
import { TABLES } from './tables';

// ---------------------------------------------------------------------------
// Key casing helpers
// ---------------------------------------------------------------------------

/** Convert camelCase JS object keys to snake_case for the database. */
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
    result[snakeKey] = value;
  }
  return result;
}

/** Convert snake_case database keys to camelCase for JS. */
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

/** Fetch a single-row table (e.g. company, swot, goals). */
async function fetchSingleton(table: string, userId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? toCamelCase(data as Record<string, unknown>) : null;
}

/** Fetch all rows for a user from an array table (e.g. sites, materials). */
async function fetchArray(table: string, userId: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((row) => toCamelCase(row as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// Save helpers
// ---------------------------------------------------------------------------

/** Upsert a singleton record for the given user. */
export async function saveSingleton(
  table: string,
  userId: string,
  record: Record<string, unknown> | null,
): Promise<void> {
  if (!record || !isSupabaseConfigured()) return;

  const row = toSnakeCase(record);
  row.user_id = userId;
  delete row.created_at;
  delete row.updated_at;

  const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
  if (error) console.error(`Error saving to ${table}:`, error);
}

/** Upsert an array of records for the given user. */
export async function saveArray(
  table: string,
  userId: string,
  records: Record<string, unknown>[],
): Promise<void> {
  if (!isSupabaseConfigured() || records.length === 0) return;

  const rows = records.map((r) => {
    const row = toSnakeCase(r);
    row.user_id = userId;
    delete row.created_at;
    delete row.updated_at;
    return row;
  });

  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) console.error(`Error saving to ${table}:`, error);
}

/** Delete records that no longer exist locally (cleanup orphans). */
export async function deleteRemovedRecords(
  table: string,
  userId: string,
  currentIds: string[],
): Promise<void> {
  if (!isSupabaseConfigured() || currentIds.length === 0) return;

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('user_id', userId)
    .not('id', 'in', `(${currentIds.join(',')})`);

  if (error) console.error(`Error deleting from ${table}:`, error);
}

// ---------------------------------------------------------------------------
// Bulk load
// ---------------------------------------------------------------------------

export interface LoadedAppData {
  company: unknown;
  sites: unknown[];
  swot: unknown;
  goals: unknown;
  regulatoryContext: unknown;
  onboardingState: unknown;
}

export interface LoadedDataStoreData {
  materials: unknown[];
  materialInputs: unknown[];
  packaging: unknown[];
  packagingInputs: unknown[];
  energyElectricity: unknown[];
  energyFuels: unknown[];
  energyWater: unknown[];
  siteDetails: unknown[];
  assets: unknown[];
  transportLogs: unknown[];
  workforce: unknown[];
  healthSafety: unknown[];
  training: unknown[];
  waste: unknown[];
  productOutputs: unknown[];
  directEmissions: unknown[];
  effluents: unknown[];
  externalContext: unknown;
  financialContext: unknown;
  buyerRequirements: unknown[];
  reflection: unknown;
}

/**
 * Load all user data from Supabase in a single parallel batch.
 *
 * Returns two objects that map directly onto appStore and dataStore state.
 */
export async function loadAllUserData(
  userId: string,
): Promise<{ appData: LoadedAppData; dataStoreData: LoadedDataStoreData }> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const [
    company,
    sites,
    swot,
    goals,
    regulatoryContext,
    onboardingState,
    materials,
    materialInputs,
    packaging,
    packagingInputs,
    energyElectricity,
    energyFuels,
    energyWater,
    siteDetails,
    assets,
    transportLogs,
    workforce,
    healthSafety,
    training,
    waste,
    productOutputs,
    directEmissions,
    effluents,
    externalContext,
    financialContext,
    buyerRequirements,
    reflection,
  ] = await Promise.all([
    // appStore
    fetchSingleton(TABLES.companies, userId),
    fetchArray(TABLES.sites, userId),
    fetchSingleton(TABLES.swot, userId),
    fetchSingleton(TABLES.goals, userId),
    fetchSingleton(TABLES.regulatoryContext, userId),
    fetchSingleton(TABLES.onboardingState, userId),
    // dataStore - arrays
    fetchArray(TABLES.materials, userId),
    fetchArray(TABLES.materialInputs, userId),
    fetchArray(TABLES.packaging, userId),
    fetchArray(TABLES.packagingInputs, userId),
    fetchArray(TABLES.energyElectricity, userId),
    fetchArray(TABLES.energyFuels, userId),
    fetchArray(TABLES.energyWater, userId),
    fetchArray(TABLES.siteDetails, userId),
    fetchArray(TABLES.assets, userId),
    fetchArray(TABLES.transportLogs, userId),
    fetchArray(TABLES.workforce, userId),
    fetchArray(TABLES.healthSafety, userId),
    fetchArray(TABLES.training, userId),
    fetchArray(TABLES.waste, userId),
    fetchArray(TABLES.productOutputs, userId),
    fetchArray(TABLES.directEmissions, userId),
    fetchArray(TABLES.effluents, userId),
    // dataStore - singletons
    fetchSingleton(TABLES.externalContext, userId),
    fetchSingleton(TABLES.financialContext, userId),
    fetchArray(TABLES.buyerRequirements, userId),
    fetchSingleton(TABLES.reflections, userId),
  ]);

  return {
    appData: { company, sites, swot, goals, regulatoryContext, onboardingState },
    dataStoreData: {
      materials,
      materialInputs,
      packaging,
      packagingInputs,
      energyElectricity,
      energyFuels,
      energyWater,
      siteDetails,
      assets,
      transportLogs,
      workforce,
      healthSafety,
      training,
      waste,
      productOutputs,
      directEmissions,
      effluents,
      externalContext,
      financialContext,
      buyerRequirements,
      reflection,
    },
  };
}
