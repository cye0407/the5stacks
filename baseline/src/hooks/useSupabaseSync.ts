/**
 * useSupabaseSync hook
 *
 * Keeps Zustand stores (appStore, dataStore) in sync with Supabase:
 *  1. On login, loads all data from Supabase into the stores.
 *  2. Subscribes to store changes and debounce-saves to Supabase (2 s).
 *  3. Silently no-ops when Supabase is not configured.
 */

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  loadAllUserData,
  saveSingleton,
  saveArray,
  deleteRemovedRecords,
} from '@/lib/supabase/sync';
import { TABLES } from '@/lib/supabase/tables';

const DEBOUNCE_MS = 2000;

export function useSupabaseSync(): { syncComplete: boolean } {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const initialLoadDone = useRef(false);
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // If Supabase is not configured, sync is already "complete" (nothing to load)
  const [syncComplete, setSyncComplete] = useState(() => !isSupabaseConfigured());

  // -----------------------------------------------------------------------
  // Debounced save helper
  // -----------------------------------------------------------------------

  function debouncedSave(key: string, fn: () => void) {
    if (saveTimeouts.current[key]) clearTimeout(saveTimeouts.current[key]);
    saveTimeouts.current[key] = setTimeout(fn, DEBOUNCE_MS);
  }

  // -----------------------------------------------------------------------
  // Initial load from Supabase
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!userId || !isSupabaseConfigured() || initialLoadDone.current) return;

    loadAllUserData(userId)
      .then(({ appData, dataStoreData }) => {
        const appState = useAppStore.getState();
        const dataState = useDataStore.getState();

        // -- appStore --
        if (appData.company) appState.setCompany(appData.company as any);
        if (appData.sites && (appData.sites as any[]).length > 0) {
          appState.setSites(appData.sites as any);
        }
        if (appData.swot) appState.setSwot(appData.swot as any);
        if (appData.goals) appState.setGoals(appData.goals as any);
        if (appData.regulatoryContext) {
          appState.setRegulatoryContext(appData.regulatoryContext as any);
        }
        if (appData.onboardingState) {
          const ob = appData.onboardingState as any;
          if (ob.currentStep !== undefined) appState.setOnboardingStep(ob.currentStep);
          if (ob.completedSteps) {
            for (const step of ob.completedSteps) appState.completeOnboardingStep(step);
          }
          if (ob.isOnboardingComplete || ob.completedSteps?.length >= ob.totalSteps) {
            appState.setIsOnboardingComplete(true);
          }
          // Restore FTUE dismissals
          if (ob.ftueDismissedItems) {
            for (const itemId of ob.ftueDismissedItems) appState.dismissFtueItem(itemId);
          }
          if (ob.ftueDismissedAll) {
            appState.dismissAllFtue();
          }
        }

        // -- dataStore (arrays) --
        const arrayFields = [
          ['materials', 'setMaterials'],
          ['materialInputs', 'setMaterialInputs'],
          ['packaging', 'setPackaging'],
          ['packagingInputs', 'setPackagingInputs'],
          ['energyElectricity', 'setEnergyElectricity'],
          ['energyFuels', 'setEnergyFuels'],
          ['energyWater', 'setEnergyWater'],
          ['siteDetails', 'setSiteDetails'],
          ['assets', 'setAssets'],
          ['transportLogs', 'setTransportLogs'],
          ['workforce', 'setWorkforce'],
          ['healthSafety', 'setHealthSafety'],
          ['training', 'setTraining'],
          ['waste', 'setWaste'],
          ['productOutputs', 'setProductOutputs'],
          ['directEmissions', 'setDirectEmissions'],
          ['effluents', 'setEffluents'],
          ['buyerRequirements', 'setBuyerRequirements'],
        ] as const;

        for (const [field, setter] of arrayFields) {
          const arr = dataStoreData[field] as any[];
          if (arr.length > 0) (dataState as any)[setter](arr);
        }

        // -- dataStore (singletons) --
        if (dataStoreData.externalContext) {
          dataState.setExternalContext(dataStoreData.externalContext as any);
        }
        if (dataStoreData.financialContext) {
          dataState.setFinancialContext(dataStoreData.financialContext as any);
        }
        if (dataStoreData.reflection) {
          dataState.setReflection(dataStoreData.reflection as any);
        }

        initialLoadDone.current = true;
        setSyncComplete(true);
      })
      .catch((err) => {
        console.error('Failed to load data from Supabase:', err);
        // Fall back to localStorage data already present in stores
        initialLoadDone.current = true;
        setSyncComplete(true);
      });
  }, [userId]);

  // -----------------------------------------------------------------------
  // Subscribe to store changes and sync back to Supabase
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;

    // -- appStore subscription --
    const unsubApp = useAppStore.subscribe((state, prevState) => {
      if (!initialLoadDone.current) return;

      if (state.company !== prevState.company && state.company) {
        debouncedSave('company', () =>
          saveSingleton(TABLES.companies, userId, state.company as any),
        );
      }

      if (state.sites !== prevState.sites) {
        debouncedSave('sites', () => {
          saveArray(TABLES.sites, userId, state.sites as any);
          const ids = state.sites.map((s: any) => s.id);
          deleteRemovedRecords(TABLES.sites, userId, ids);
        });
      }

      if (state.swot !== prevState.swot && state.swot) {
        debouncedSave('swot', () =>
          saveSingleton(TABLES.swot, userId, state.swot as any),
        );
      }

      if (state.goals !== prevState.goals && state.goals) {
        debouncedSave('goals', () =>
          saveSingleton(TABLES.goals, userId, state.goals as any),
        );
      }

      if (state.regulatoryContext !== prevState.regulatoryContext && state.regulatoryContext) {
        debouncedSave('regulatoryContext', () =>
          saveSingleton(TABLES.regulatoryContext, userId, state.regulatoryContext as any),
        );
      }

      if (
        state.onboarding !== prevState.onboarding ||
        state.isOnboardingComplete !== prevState.isOnboardingComplete ||
        state.ftue !== prevState.ftue
      ) {
        debouncedSave('onboarding', () =>
          saveSingleton(TABLES.onboardingState, userId, {
            id: userId,
            ...state.onboarding,
            isOnboardingComplete: state.isOnboardingComplete,
            ftueDismissedItems: state.ftue.dismissedItems,
            ftueDismissedAll: state.ftue.dismissedAll,
          }),
        );
      }
    });

    // -- dataStore subscription --
    const unsubData = useDataStore.subscribe((state, prevState) => {
      if (!initialLoadDone.current) return;

      // Helper: sync an array field and clean up removed records
      const syncArray = (
        key: string,
        table: string,
        current: { id: string }[],
        prev: { id: string }[],
      ) => {
        if (current !== prev) {
          debouncedSave(key, () => {
            saveArray(table, userId, current as any);
            deleteRemovedRecords(table, userId, current.map((r) => r.id));
          });
        }
      };

      syncArray('materials', TABLES.materials, state.materials as any, prevState.materials as any);
      syncArray('materialInputs', TABLES.materialInputs, state.materialInputs as any, prevState.materialInputs as any);
      syncArray('packaging', TABLES.packaging, state.packaging as any, prevState.packaging as any);
      syncArray('packagingInputs', TABLES.packagingInputs, state.packagingInputs as any, prevState.packagingInputs as any);
      syncArray('energyElectricity', TABLES.energyElectricity, state.energyElectricity as any, prevState.energyElectricity as any);
      syncArray('energyFuels', TABLES.energyFuels, state.energyFuels as any, prevState.energyFuels as any);
      syncArray('energyWater', TABLES.energyWater, state.energyWater as any, prevState.energyWater as any);
      syncArray('siteDetails', TABLES.siteDetails, state.siteDetails as any, prevState.siteDetails as any);
      syncArray('assets', TABLES.assets, state.assets as any, prevState.assets as any);
      syncArray('transportLogs', TABLES.transportLogs, state.transportLogs as any, prevState.transportLogs as any);
      syncArray('workforce', TABLES.workforce, state.workforce as any, prevState.workforce as any);
      syncArray('healthSafety', TABLES.healthSafety, state.healthSafety as any, prevState.healthSafety as any);
      syncArray('training', TABLES.training, state.training as any, prevState.training as any);
      syncArray('waste', TABLES.waste, state.waste as any, prevState.waste as any);
      syncArray('productOutputs', TABLES.productOutputs, state.productOutputs as any, prevState.productOutputs as any);
      syncArray('directEmissions', TABLES.directEmissions, state.directEmissions as any, prevState.directEmissions as any);
      syncArray('effluents', TABLES.effluents, state.effluents as any, prevState.effluents as any);
      syncArray('buyerRequirements', TABLES.buyerRequirements, state.buyerRequirements as any, prevState.buyerRequirements as any);

      // Singletons
      if (state.externalContext !== prevState.externalContext && state.externalContext) {
        debouncedSave('externalContext', () =>
          saveSingleton(TABLES.externalContext, userId, state.externalContext as any),
        );
      }
      if (state.financialContext !== prevState.financialContext && state.financialContext) {
        debouncedSave('financialContext', () =>
          saveSingleton(TABLES.financialContext, userId, state.financialContext as any),
        );
      }
      if (state.reflection !== prevState.reflection && state.reflection) {
        debouncedSave('reflections', () =>
          saveSingleton(TABLES.reflections, userId, state.reflection as any),
        );
      }
    });

    // Cleanup: unsubscribe and flush pending saves
    return () => {
      unsubApp();
      unsubData();
      for (const timeout of Object.values(saveTimeouts.current)) {
        clearTimeout(timeout);
      }
    };
  }, [userId]);

  return { syncComplete };
}
