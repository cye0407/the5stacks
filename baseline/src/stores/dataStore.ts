import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Material,
  MaterialInput,
  Packaging,
  PackagingInput,
  EnergyElectricity,
  EnergyFuel,
  EnergyWater,
  CalculatedEmissions,
  Asset,
  SiteDetails,
  TransportLog,
  Workforce,
  HealthSafety,
  Training,
  Waste,
  ProductOutput,
  DirectEmission,
  Effluent,
  ExternalContext,
  FinancialContext,
  BuyerRequirement,
  Reflection,
  LandUse,
  FertiliserApplication,
  LivestockRecord,
  CropOutput,
} from '@/types';

interface DataStore {
  // Domain 1: Materials
  materials: Material[];
  materialInputs: MaterialInput[];
  setMaterials: (materials: Material[]) => void;
  addMaterial: (material: Material) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  removeMaterial: (id: string) => void;
  setMaterialInputs: (inputs: MaterialInput[]) => void;
  addMaterialInput: (input: MaterialInput) => void;
  updateMaterialInput: (id: string, updates: Partial<MaterialInput>) => void;
  removeMaterialInput: (id: string) => void;

  // Domain 2: Packaging
  packaging: Packaging[];
  packagingInputs: PackagingInput[];
  setPackaging: (packaging: Packaging[]) => void;
  addPackaging: (pkg: Packaging) => void;
  updatePackaging: (id: string, updates: Partial<Packaging>) => void;
  removePackaging: (id: string) => void;
  setPackagingInputs: (inputs: PackagingInput[]) => void;
  addPackagingInput: (input: PackagingInput) => void;
  updatePackagingInput: (id: string, updates: Partial<PackagingInput>) => void;
  removePackagingInput: (id: string) => void;

  // Domain 3: Energy
  energyElectricity: EnergyElectricity[];
  energyFuels: EnergyFuel[];
  energyWater: EnergyWater[];
  calculatedEmissions: CalculatedEmissions[];
  setEnergyElectricity: (data: EnergyElectricity[]) => void;
  addEnergyElectricity: (data: EnergyElectricity) => void;
  updateEnergyElectricity: (id: string, updates: Partial<EnergyElectricity>) => void;
  removeEnergyElectricity: (id: string) => void;
  setEnergyFuels: (data: EnergyFuel[]) => void;
  addEnergyFuel: (data: EnergyFuel) => void;
  updateEnergyFuel: (id: string, updates: Partial<EnergyFuel>) => void;
  removeEnergyFuel: (id: string) => void;
  setEnergyWater: (data: EnergyWater[]) => void;
  addEnergyWater: (data: EnergyWater) => void;
  updateEnergyWater: (id: string, updates: Partial<EnergyWater>) => void;
  removeEnergyWater: (id: string) => void;
  setCalculatedEmissions: (data: CalculatedEmissions[]) => void;

  // Domain 4: Infrastructure
  siteDetails: SiteDetails[];
  assets: Asset[];
  setSiteDetails: (details: SiteDetails[]) => void;
  updateSiteDetails: (siteId: string, updates: Partial<SiteDetails>) => void;
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;

  // Domain 5: Transport
  transportLogs: TransportLog[];
  setTransportLogs: (logs: TransportLog[]) => void;
  addTransportLog: (log: TransportLog) => void;
  updateTransportLog: (id: string, updates: Partial<TransportLog>) => void;
  removeTransportLog: (id: string) => void;

  // Domain 6: Workforce
  workforce: Workforce[];
  healthSafety: HealthSafety[];
  training: Training[];
  setWorkforce: (data: Workforce[]) => void;
  addWorkforce: (data: Workforce) => void;
  updateWorkforce: (id: string, updates: Partial<Workforce>) => void;
  removeWorkforce: (id: string) => void;
  setHealthSafety: (data: HealthSafety[]) => void;
  addHealthSafety: (data: HealthSafety) => void;
  updateHealthSafety: (id: string, updates: Partial<HealthSafety>) => void;
  removeHealthSafety: (id: string) => void;
  setTraining: (data: Training[]) => void;
  addTraining: (data: Training) => void;
  updateTraining: (id: string, updates: Partial<Training>) => void;
  removeTraining: (id: string) => void;

  // Domain 7: Outputs
  waste: Waste[];
  productOutputs: ProductOutput[];
  directEmissions: DirectEmission[];
  effluents: Effluent[];
  setWaste: (data: Waste[]) => void;
  addWaste: (data: Waste) => void;
  updateWaste: (id: string, updates: Partial<Waste>) => void;
  removeWaste: (id: string) => void;
  setProductOutputs: (data: ProductOutput[]) => void;
  addProductOutput: (data: ProductOutput) => void;
  updateProductOutput: (id: string, updates: Partial<ProductOutput>) => void;
  removeProductOutput: (id: string) => void;
  setDirectEmissions: (data: DirectEmission[]) => void;
  addDirectEmission: (data: DirectEmission) => void;
  updateDirectEmission: (id: string, updates: Partial<DirectEmission>) => void;
  removeDirectEmission: (id: string) => void;
  setEffluents: (data: Effluent[]) => void;
  addEffluent: (data: Effluent) => void;
  updateEffluent: (id: string, updates: Partial<Effluent>) => void;
  removeEffluent: (id: string) => void;

  // Agricultural
  landUse: LandUse[];
  fertiliserApplications: FertiliserApplication[];
  livestockRecords: LivestockRecord[];
  cropOutputs: CropOutput[];
  setLandUse: (data: LandUse[]) => void;
  addLandUse: (data: LandUse) => void;
  updateLandUse: (id: string, updates: Partial<LandUse>) => void;
  removeLandUse: (id: string) => void;
  setFertiliserApplications: (data: FertiliserApplication[]) => void;
  addFertiliserApplication: (data: FertiliserApplication) => void;
  updateFertiliserApplication: (id: string, updates: Partial<FertiliserApplication>) => void;
  removeFertiliserApplication: (id: string) => void;
  setLivestockRecords: (data: LivestockRecord[]) => void;
  addLivestockRecord: (data: LivestockRecord) => void;
  updateLivestockRecord: (id: string, updates: Partial<LivestockRecord>) => void;
  removeLivestockRecord: (id: string) => void;
  setCropOutputs: (data: CropOutput[]) => void;
  addCropOutput: (data: CropOutput) => void;
  updateCropOutput: (id: string, updates: Partial<CropOutput>) => void;
  removeCropOutput: (id: string) => void;

  // Context
  externalContext: ExternalContext | null;
  financialContext: FinancialContext | null;
  buyerRequirements: BuyerRequirement[];
  setExternalContext: (context: ExternalContext | null) => void;
  setFinancialContext: (context: FinancialContext | null) => void;
  setBuyerRequirements: (requirements: BuyerRequirement[]) => void;
  addBuyerRequirement: (requirement: BuyerRequirement) => void;
  updateBuyerRequirement: (id: string, updates: Partial<BuyerRequirement>) => void;
  removeBuyerRequirement: (id: string) => void;

  // Reflection
  reflection: Reflection | null;
  setReflection: (reflection: Reflection | null) => void;

  // Reset
  resetDataStore: () => void;
}

export const useDataStore = create<DataStore>()(
  persist(
    (set) => ({
      // Domain 1: Materials
      materials: [],
      materialInputs: [],
      setMaterials: (materials) => set({ materials }),
      addMaterial: (material) => set((state) => ({ materials: [...state.materials, material] })),
      updateMaterial: (id, updates) =>
        set((state) => ({
          materials: state.materials.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      removeMaterial: (id) =>
        set((state) => ({ materials: state.materials.filter((m) => m.id !== id) })),
      setMaterialInputs: (materialInputs) => set({ materialInputs }),
      addMaterialInput: (input) =>
        set((state) => ({ materialInputs: [...state.materialInputs, input] })),
      updateMaterialInput: (id, updates) =>
        set((state) => ({
          materialInputs: state.materialInputs.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      removeMaterialInput: (id) =>
        set((state) => ({ materialInputs: state.materialInputs.filter((m) => m.id !== id) })),

      // Domain 2: Packaging
      packaging: [],
      packagingInputs: [],
      setPackaging: (packaging) => set({ packaging }),
      addPackaging: (pkg) => set((state) => ({ packaging: [...state.packaging, pkg] })),
      updatePackaging: (id, updates) =>
        set((state) => ({
          packaging: state.packaging.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      removePackaging: (id) =>
        set((state) => ({ packaging: state.packaging.filter((p) => p.id !== id) })),
      setPackagingInputs: (packagingInputs) => set({ packagingInputs }),
      addPackagingInput: (input) =>
        set((state) => ({ packagingInputs: [...state.packagingInputs, input] })),
      updatePackagingInput: (id, updates) =>
        set((state) => ({
          packagingInputs: state.packagingInputs.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removePackagingInput: (id) =>
        set((state) => ({ packagingInputs: state.packagingInputs.filter((p) => p.id !== id) })),

      // Domain 3: Energy
      energyElectricity: [],
      energyFuels: [],
      energyWater: [],
      calculatedEmissions: [],
      setEnergyElectricity: (energyElectricity) => set({ energyElectricity }),
      addEnergyElectricity: (data) =>
        set((state) => ({ energyElectricity: [...state.energyElectricity, data] })),
      updateEnergyElectricity: (id, updates) =>
        set((state) => ({
          energyElectricity: state.energyElectricity.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      removeEnergyElectricity: (id) =>
        set((state) => ({ energyElectricity: state.energyElectricity.filter((e) => e.id !== id) })),
      setEnergyFuels: (energyFuels) => set({ energyFuels }),
      addEnergyFuel: (data) => set((state) => ({ energyFuels: [...state.energyFuels, data] })),
      updateEnergyFuel: (id, updates) =>
        set((state) => ({
          energyFuels: state.energyFuels.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      removeEnergyFuel: (id) =>
        set((state) => ({ energyFuels: state.energyFuels.filter((e) => e.id !== id) })),
      setEnergyWater: (energyWater) => set({ energyWater }),
      addEnergyWater: (data) => set((state) => ({ energyWater: [...state.energyWater, data] })),
      updateEnergyWater: (id, updates) =>
        set((state) => ({
          energyWater: state.energyWater.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      removeEnergyWater: (id) =>
        set((state) => ({ energyWater: state.energyWater.filter((e) => e.id !== id) })),
      setCalculatedEmissions: (calculatedEmissions) => set({ calculatedEmissions }),

      // Domain 4: Infrastructure
      siteDetails: [],
      assets: [],
      setSiteDetails: (siteDetails) => set({ siteDetails }),
      updateSiteDetails: (siteId, updates) =>
        set((state) => ({
          siteDetails: state.siteDetails.map((s) =>
            s.siteId === siteId ? { ...s, ...updates } : s
          ),
        })),
      setAssets: (assets) => set({ assets }),
      addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
      updateAsset: (id, updates) =>
        set((state) => ({
          assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
      removeAsset: (id) => set((state) => ({ assets: state.assets.filter((a) => a.id !== id) })),

      // Domain 5: Transport
      transportLogs: [],
      setTransportLogs: (transportLogs) => set({ transportLogs }),
      addTransportLog: (log) =>
        set((state) => ({ transportLogs: [...state.transportLogs, log] })),
      updateTransportLog: (id, updates) =>
        set((state) => ({
          transportLogs: state.transportLogs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      removeTransportLog: (id) =>
        set((state) => ({ transportLogs: state.transportLogs.filter((t) => t.id !== id) })),

      // Domain 6: Workforce
      workforce: [],
      healthSafety: [],
      training: [],
      setWorkforce: (workforce) => set({ workforce }),
      addWorkforce: (data) => set((state) => ({ workforce: [...state.workforce, data] })),
      updateWorkforce: (id, updates) =>
        set((state) => ({
          workforce: state.workforce.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
      removeWorkforce: (id) =>
        set((state) => ({ workforce: state.workforce.filter((w) => w.id !== id) })),
      setHealthSafety: (healthSafety) => set({ healthSafety }),
      addHealthSafety: (data) =>
        set((state) => ({ healthSafety: [...state.healthSafety, data] })),
      updateHealthSafety: (id, updates) =>
        set((state) => ({
          healthSafety: state.healthSafety.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        })),
      removeHealthSafety: (id) =>
        set((state) => ({ healthSafety: state.healthSafety.filter((h) => h.id !== id) })),
      setTraining: (training) => set({ training }),
      addTraining: (data) => set((state) => ({ training: [...state.training, data] })),
      updateTraining: (id, updates) =>
        set((state) => ({
          training: state.training.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      removeTraining: (id) =>
        set((state) => ({ training: state.training.filter((t) => t.id !== id) })),

      // Domain 7: Outputs
      waste: [],
      productOutputs: [],
      directEmissions: [],
      effluents: [],
      setWaste: (waste) => set({ waste }),
      addWaste: (data) => set((state) => ({ waste: [...state.waste, data] })),
      updateWaste: (id, updates) =>
        set((state) => ({
          waste: state.waste.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
      removeWaste: (id) => set((state) => ({ waste: state.waste.filter((w) => w.id !== id) })),
      setProductOutputs: (productOutputs) => set({ productOutputs }),
      addProductOutput: (data) =>
        set((state) => ({ productOutputs: [...state.productOutputs, data] })),
      updateProductOutput: (id, updates) =>
        set((state) => ({
          productOutputs: state.productOutputs.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      removeProductOutput: (id) =>
        set((state) => ({ productOutputs: state.productOutputs.filter((p) => p.id !== id) })),
      setDirectEmissions: (directEmissions) => set({ directEmissions }),
      addDirectEmission: (data) =>
        set((state) => ({ directEmissions: [...state.directEmissions, data] })),
      updateDirectEmission: (id, updates) =>
        set((state) => ({
          directEmissions: state.directEmissions.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),
      removeDirectEmission: (id) =>
        set((state) => ({ directEmissions: state.directEmissions.filter((d) => d.id !== id) })),
      setEffluents: (effluents) => set({ effluents }),
      addEffluent: (data) => set((state) => ({ effluents: [...state.effluents, data] })),
      updateEffluent: (id, updates) =>
        set((state) => ({
          effluents: state.effluents.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      removeEffluent: (id) =>
        set((state) => ({ effluents: state.effluents.filter((e) => e.id !== id) })),

      // Agricultural
      landUse: [],
      fertiliserApplications: [],
      livestockRecords: [],
      cropOutputs: [],
      setLandUse: (landUse) => set({ landUse }),
      addLandUse: (data) => set((state) => ({ landUse: [...state.landUse, data] })),
      updateLandUse: (id, updates) =>
        set((state) => ({
          landUse: state.landUse.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),
      removeLandUse: (id) =>
        set((state) => ({ landUse: state.landUse.filter((l) => l.id !== id) })),
      setFertiliserApplications: (fertiliserApplications) => set({ fertiliserApplications }),
      addFertiliserApplication: (data) =>
        set((state) => ({ fertiliserApplications: [...state.fertiliserApplications, data] })),
      updateFertiliserApplication: (id, updates) =>
        set((state) => ({
          fertiliserApplications: state.fertiliserApplications.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),
      removeFertiliserApplication: (id) =>
        set((state) => ({
          fertiliserApplications: state.fertiliserApplications.filter((f) => f.id !== id),
        })),
      setLivestockRecords: (livestockRecords) => set({ livestockRecords }),
      addLivestockRecord: (data) =>
        set((state) => ({ livestockRecords: [...state.livestockRecords, data] })),
      updateLivestockRecord: (id, updates) =>
        set((state) => ({
          livestockRecords: state.livestockRecords.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),
      removeLivestockRecord: (id) =>
        set((state) => ({ livestockRecords: state.livestockRecords.filter((l) => l.id !== id) })),
      setCropOutputs: (cropOutputs) => set({ cropOutputs }),
      addCropOutput: (data) =>
        set((state) => ({ cropOutputs: [...state.cropOutputs, data] })),
      updateCropOutput: (id, updates) =>
        set((state) => ({
          cropOutputs: state.cropOutputs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      removeCropOutput: (id) =>
        set((state) => ({ cropOutputs: state.cropOutputs.filter((c) => c.id !== id) })),

      // Context
      externalContext: null,
      financialContext: null,
      buyerRequirements: [],
      setExternalContext: (externalContext) => set({ externalContext }),
      setFinancialContext: (financialContext) => set({ financialContext }),
      setBuyerRequirements: (buyerRequirements) => set({ buyerRequirements }),
      addBuyerRequirement: (requirement) =>
        set((state) => ({ buyerRequirements: [...state.buyerRequirements, requirement] })),
      updateBuyerRequirement: (id, updates) =>
        set((state) => ({
          buyerRequirements: state.buyerRequirements.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),
      removeBuyerRequirement: (id) =>
        set((state) => ({ buyerRequirements: state.buyerRequirements.filter((b) => b.id !== id) })),

      // Reflection
      reflection: null,
      setReflection: (reflection) => set({ reflection }),

      // Reset
      resetDataStore: () =>
        set({
          materials: [],
          materialInputs: [],
          packaging: [],
          packagingInputs: [],
          energyElectricity: [],
          energyFuels: [],
          energyWater: [],
          calculatedEmissions: [],
          siteDetails: [],
          assets: [],
          transportLogs: [],
          workforce: [],
          healthSafety: [],
          training: [],
          waste: [],
          productOutputs: [],
          directEmissions: [],
          effluents: [],
          landUse: [],
          fertiliserApplications: [],
          livestockRecords: [],
          cropOutputs: [],
          externalContext: null,
          financialContext: null,
          buyerRequirements: [],
          reflection: null,
        }),
    }),
    {
      name: 'five-stacks-data-storage',
    }
  )
);
