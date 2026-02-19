import { retrieveDataForMatch } from '@/lib/respond/dataRetrieval';
import type { MatchResult } from '@/lib/respond/types';
import type { StoreData } from '@/lib/respond/dataRetrieval';

function makeMatchResult(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    questionId: 'q1',
    primaryDomain: null,
    secondaryDomains: [],
    topics: [],
    confidence: 'none',
    matchedKeywords: [],
    suggestedDataPoints: [],
    ...overrides,
  };
}

function emptyStore(): StoreData {
  return {
    company: null,
    sites: [],
    goals: null,
    swot: null,
    regulatoryContext: null,
    materials: [],
    materialInputs: [],
    packaging: [],
    packagingInputs: [],
    energyElectricity: [],
    energyFuels: [],
    energyWater: [],
    assets: [],
    transportLogs: [],
    workforce: [],
    healthSafety: [],
    training: [],
    waste: [],
    productOutputs: [],
    directEmissions: [],
    effluents: [],
    externalContext: null,
    financialContext: null,
    buyerRequirements: [],
  };
}

describe('retrieveDataForMatch', () => {
  it('returns empty arrays when store is empty', () => {
    const ctx = retrieveDataForMatch(makeMatchResult(), emptyStore());
    expect(ctx.company).toEqual([]);
    expect(ctx.operational).toEqual([]);
    expect(ctx.calculated).toEqual([]);
  });

  it('retrieves company data when domain is company', () => {
    const store = emptyStore();
    store.company = {
      id: 'c1',
      legalEntityName: 'Acme Corp',
      industryCode: 'MFG',
      industryDescription: 'Manufacturing',
      ownershipType: 'private',
      headquartersCountry: 'DE',
      reportingPeriodStart: '2024-01',
      reportingPeriodEnd: '2024-12',
      totalFte: 100,
      fteConfidence: 'high',
      numberOfSites: 1,
      primarySiteCountry: 'DE',
      revenueBand: '1m-5m',
      revenueCurrency: 'EUR',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    const ctx = retrieveDataForMatch(
      makeMatchResult({ primaryDomain: 'company', confidence: 'high', matchedKeywords: ['company'] }),
      store,
    );
    expect(ctx.company.length).toBeGreaterThan(0);
    expect(ctx.company.some((dp) => dp.field === 'legalEntityName')).toBe(true);
  });

  it('retrieves energy data when domain is energy_electricity', () => {
    const store = emptyStore();
    store.energyElectricity = [
      {
        id: 'e1', siteId: 's1', period: '2024-01', consumptionKwh: 50000,
        sourceGridPercent: 80, sourceOnsiteRenewablePercent: 10, sourcePpaPercent: 10,
        source: 'meter', confidence: 'high', lastUpdated: '2024-01-01',
      },
    ];
    const ctx = retrieveDataForMatch(
      makeMatchResult({ primaryDomain: 'energy_electricity', confidence: 'high', matchedKeywords: ['electricity'] }),
      store,
    );
    expect(ctx.operational.length).toBeGreaterThan(0);
    expect(ctx.operational.some((dp) => dp.domain === 'energy_electricity')).toBe(true);
  });

  it('retrieves workforce data when domain is workforce', () => {
    const store = emptyStore();
    store.workforce = [
      {
        id: 'w1', siteId: 's1', period: '2024-01', totalFte: 500,
        totalHoursWorked: 80000, femalePercent: 40,
        source: 'erp', confidence: 'high', lastUpdated: '2024-01-01',
      },
    ];
    const ctx = retrieveDataForMatch(
      makeMatchResult({ primaryDomain: 'workforce', confidence: 'high', matchedKeywords: ['employees'] }),
      store,
    );
    expect(ctx.operational.length).toBeGreaterThan(0);
    expect(ctx.operational.some((dp) => dp.domain === 'workforce')).toBe(true);
  });

  it('identifies data gaps when domain data is missing', () => {
    const store = emptyStore();
    const ctx = retrieveDataForMatch(
      makeMatchResult({ primaryDomain: 'energy_electricity', confidence: 'high', matchedKeywords: ['electricity'] }),
      store,
    );
    expect(ctx.metadata.dataGaps.length).toBeGreaterThan(0);
  });

  it('includes site names in metadata.sitesIncluded', () => {
    const store = emptyStore();
    store.sites = [
      { id: 's1', companyId: 'c1', siteName: 'HQ', siteType: 'hq', country: 'DE', ownership: 'owned', isPrimary: true, createdAt: '', updatedAt: '' },
      { id: 's2', companyId: 'c1', siteName: 'Plant A', siteType: 'production', country: 'DE', ownership: 'owned', isPrimary: false, createdAt: '', updatedAt: '' },
    ];
    const ctx = retrieveDataForMatch(
      makeMatchResult({ primaryDomain: 'company', confidence: 'high', matchedKeywords: ['company'] }),
      store,
    );
    expect(ctx.metadata.sitesIncluded).toContain('HQ');
    expect(ctx.metadata.sitesIncluded).toContain('Plant A');
  });

  it('deduplicates data points across overlapping domains', () => {
    const store = emptyStore();
    store.energyElectricity = [
      {
        id: 'e1', siteId: 's1', period: '2024-01', consumptionKwh: 50000,
        sourceGridPercent: 100, sourceOnsiteRenewablePercent: 0, sourcePpaPercent: 0,
        source: 'meter', confidence: 'high', lastUpdated: '2024-01-01',
      },
    ];
    store.energyFuels = [
      {
        id: 'f1', siteId: 's1', period: '2024-01', fuelType: 'natural_gas',
        quantity: 1000, unit: 'm3', purpose: 'heating',
        source: 'bill', confidence: 'high', lastUpdated: '2024-01-01',
      },
    ];
    const ctx = retrieveDataForMatch(
      makeMatchResult({
        primaryDomain: 'energy_electricity',
        secondaryDomains: ['energy_fuel'],
        confidence: 'high',
        matchedKeywords: ['energy'],
      }),
      store,
    );
    const fields = ctx.operational.map((dp) => `${dp.domain}:${dp.field}`);
    const unique = new Set(fields);
    expect(fields.length).toBe(unique.size);
  });
});
