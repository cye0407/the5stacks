import { describe, expect, it } from 'vitest';
import { getDashboardInsights, type DashboardInsightInput } from '../dashboardInsights';

function makeInput(overrides: Partial<DashboardInsightInput> = {}): DashboardInsightInput {
  return {
    company: null,
    sites: [],
    materialInputs: [],
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
    externalContext: null,
    financialContext: null,
    buyerRequirements: [],
    ...overrides,
  };
}

describe('getDashboardInsights', () => {
  it('flags empty commercial context as a blocking gap', () => {
    const insights = getDashboardInsights(makeInput());

    expect(insights.gaps.some((gap) => gap.id === 'context')).toBe(true);
    expect(insights.nextAction.href).toBe('/data/context');
    expect(insights.buyerReadiness.label).toContain('No buyer pressure');
  });

  it('surfaces energy and waste opportunities from tracked costs', () => {
    const insights = getDashboardInsights(
      makeInput({
        sites: [
          {
            id: 'site-1',
            companyId: 'company-1',
            siteName: 'Berlin',
            siteType: 'production',
            country: 'Germany',
            ownership: 'leased',
            isPrimary: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        energyElectricity: [
          {
            id: 'energy-1',
            siteId: 'site-1',
            period: '2024-01',
            consumptionKwh: 42000,
            sourceGridPercent: 80,
            sourceOnsiteRenewablePercent: 10,
            sourcePpaPercent: 10,
            cost: 9000,
            source: 'bill',
            confidence: 'high',
            lastUpdated: '2024-01-01',
          },
        ],
        waste: [
          {
            id: 'waste-1',
            siteId: 'site-1',
            period: '2024',
            wasteCategory: 'general',
            quantityKg: 10000,
            disposalRoute: 'landfill',
            hazardous: false,
            cost: 2200,
            source: 'invoice',
            confidence: 'high',
            lastUpdated: '2024-01-01',
          },
        ],
      })
    );

    expect(insights.trackedSpend).toBe(11200);
    expect(insights.opportunities.some((opportunity) => opportunity.id === 'energy')).toBe(true);
    expect(insights.opportunities.some((opportunity) => opportunity.id === 'waste')).toBe(true);
  });

  it('raises buyer readiness when requirements are mapped', () => {
    const insights = getDashboardInsights(
      makeInput({
        buyerRequirements: [
          {
            id: 'buyer-1',
            companyId: 'company-1',
            buyerName: 'Acme',
            requirementType: 'questionnaire',
            frequency: 'annual',
            status: 'in_progress',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      })
    );

    expect(insights.buyerReadiness.label).toContain('1 buyer request');
    expect(insights.gaps.some((gap) => gap.id === 'context')).toBe(false);
  });
});
