import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Company,
  Site,
  SWOT,
  Goals,
  RegulatoryContext,
  OnboardingState,
  ProgressMetrics,
} from '@/types';

interface AppStore {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Company Logo
  companyLogo: string | null;
  setCompanyLogo: (logo: string | null) => void;

  // Company
  company: Company | null;
  setCompany: (company: Company | null) => void;
  updateCompany: (updates: Partial<Company>) => void;

  // Sites
  sites: Site[];
  setSites: (sites: Site[]) => void;
  addSite: (site: Site) => void;
  updateSite: (siteId: string, updates: Partial<Site>) => void;
  removeSite: (siteId: string) => void;

  // SWOT
  swot: SWOT | null;
  setSwot: (swot: SWOT | null) => void;
  updateSwot: (updates: Partial<SWOT>) => void;

  // Goals
  goals: Goals | null;
  setGoals: (goals: Goals | null) => void;
  updateGoals: (updates: Partial<Goals>) => void;

  // Regulatory Context
  regulatoryContext: RegulatoryContext | null;
  setRegulatoryContext: (context: RegulatoryContext | null) => void;

  // Onboarding
  onboarding: OnboardingState;
  setOnboardingStep: (step: number) => void;
  completeOnboardingStep: (step: number) => void;
  resetOnboarding: () => void;

  // Progress
  progressMetrics: ProgressMetrics | null;
  setProgressMetrics: (metrics: ProgressMetrics) => void;

  // App State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isOnboardingComplete: boolean;
  setIsOnboardingComplete: (complete: boolean) => void;

  // FTUE
  ftue: { dismissedItems: string[]; dismissedAll: boolean };
  dismissFtueItem: (itemId: string) => void;
  dismissAllFtue: () => void;

  // Computed/alias properties
  onboardingComplete: boolean;

  // Reset
  resetStore: () => void;
}

const initialOnboarding: OnboardingState = {
  currentStep: 0,
  totalSteps: 1,
  completedSteps: [],
};

const initialProgressMetrics: ProgressMetrics = {
  totalDataPoints: 0,
  highConfidencePercent: 0,
  mediumConfidencePercent: 0,
  lowConfidencePercent: 0,
  estimatedPercent: 0,
  dataCoveragePercent: 0,
  temporalCoverageMonths: 0,
  staleDataCount: 0,
  completionScore: 0,
  domainsWithData: 0,
  totalDomains: 7,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Company Logo
      companyLogo: null,
      setCompanyLogo: (companyLogo) => set({ companyLogo }),

      // Company
      company: null,
      setCompany: (company) => set({ company }),
      updateCompany: (updates) =>
        set((state) => ({
          company: state.company ? { ...state.company, ...updates, updatedAt: new Date().toISOString() } : null,
        })),

      // Sites
      sites: [],
      setSites: (sites) => set({ sites }),
      addSite: (site) => set((state) => ({ sites: [...state.sites, site] })),
      updateSite: (siteId, updates) =>
        set((state) => ({
          sites: state.sites.map((s) => (s.id === siteId ? { ...s, ...updates } : s)),
        })),
      removeSite: (siteId) =>
        set((state) => ({
          sites: state.sites.filter((s) => s.id !== siteId),
        })),

      // SWOT
      swot: null,
      setSwot: (swot) => set({ swot }),
      updateSwot: (updates) =>
        set((state) => ({
          swot: state.swot ? { ...state.swot, ...updates, updatedAt: new Date().toISOString() } : null,
        })),

      // Goals
      goals: null,
      setGoals: (goals) => set({ goals }),
      updateGoals: (updates) =>
        set((state) => ({
          goals: state.goals ? { ...state.goals, ...updates, updatedAt: new Date().toISOString() } : null,
        })),

      // Regulatory Context
      regulatoryContext: null,
      setRegulatoryContext: (regulatoryContext) => set({ regulatoryContext }),

      // Onboarding
      onboarding: initialOnboarding,
      setOnboardingStep: (step) =>
        set((state) => ({
          onboarding: { ...state.onboarding, currentStep: step },
        })),
      completeOnboardingStep: (step) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            completedSteps: [...new Set([...state.onboarding.completedSteps, step])],
          },
        })),
      resetOnboarding: () => set({ onboarding: initialOnboarding }),

      // FTUE
      ftue: { dismissedItems: [], dismissedAll: false },
      dismissFtueItem: (itemId) =>
        set((state) => ({
          ftue: {
            ...state.ftue,
            dismissedItems: [...new Set([...state.ftue.dismissedItems, itemId])],
          },
        })),
      dismissAllFtue: () =>
        set((state) => ({
          ftue: { ...state.ftue, dismissedAll: true },
        })),

      // Progress
      progressMetrics: initialProgressMetrics,
      setProgressMetrics: (progressMetrics) => set({ progressMetrics }),

      // App State
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      isOnboardingComplete: false,
      setIsOnboardingComplete: (isOnboardingComplete) => set({ isOnboardingComplete }),

      // Computed/alias - onboardingComplete is an alias for isOnboardingComplete
      get onboardingComplete() {
        return this.isOnboardingComplete;
      },

      // Reset
      resetStore: () =>
        set({
          user: null,
          companyLogo: null,
          company: null,
          sites: [],
          swot: null,
          goals: null,
          regulatoryContext: null,
          onboarding: initialOnboarding,
          progressMetrics: initialProgressMetrics,
          isLoading: false,
          isOnboardingComplete: false,
          ftue: { dismissedItems: [], dismissedAll: false },
        }),
    }),
    {
      name: 'five-stacks-storage',
      partialize: (state) => ({
        user: state.user,
        companyLogo: state.companyLogo,
        // Strip sensitive financial fields before persisting to localStorage.
        // These reload from Supabase on next session.
        company: state.company
          ? (() => {
              const { revenueBand, totalFte, fteConfidence, revenueCurrency, ...safe } = state.company;
              return safe;
            })()
          : null,
        sites: state.sites,
        swot: state.swot,
        goals: state.goals,
        regulatoryContext: state.regulatoryContext,
        onboarding: state.onboarding,
        isOnboardingComplete: state.isOnboardingComplete,
        ftue: state.ftue,
      }),
    }
  )
);
