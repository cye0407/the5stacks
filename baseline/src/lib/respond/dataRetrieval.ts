// ============================================
// Data Retrieval - Pull data from stores for answer generation
// ============================================

import type { 
  DataDomain, 
  MatchResult, 
  RetrievedDataPoint, 
  DataContext 
} from './types';
import type {
  Company,
  Site,
  Goals,
  SWOT,
  RegulatoryContext,
  Material,
  MaterialInput,
  Packaging,
  PackagingInput,
  EnergyElectricity,
  EnergyFuel,
  EnergyWater,
  Asset,
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
  ConfidenceLevel
} from '@/types';

// ============================================
// Store Data Interface
// ============================================

export interface StoreData {
  // App store
  company: Company | null;
  sites: Site[];
  goals: Goals | null;
  swot: SWOT | null;
  regulatoryContext: RegulatoryContext | null;

  // Data store
  materials: Material[];
  materialInputs: MaterialInput[];
  packaging: Packaging[];
  packagingInputs: PackagingInput[];
  energyElectricity: EnergyElectricity[];
  energyFuels: EnergyFuel[];
  energyWater: EnergyWater[];
  assets: Asset[];
  transportLogs: TransportLog[];
  workforce: Workforce[];
  healthSafety: HealthSafety[];
  training: Training[];
  waste: Waste[];
  productOutputs: ProductOutput[];
  directEmissions: DirectEmission[];
  effluents: Effluent[];
  externalContext: ExternalContext | null;
  financialContext: FinancialContext | null;
  buyerRequirements: BuyerRequirement[];
}

// ============================================
// Data Retrieval Functions by Domain
// ============================================

function retrieveCompanyData(company: Company | null, sites: Site[]): RetrievedDataPoint[] {
  if (!company) return [];

  const points: RetrievedDataPoint[] = [
    {
      domain: 'company',
      field: 'legalEntityName',
      label: 'Company Name',
      value: company.legalEntityName
    },
    {
      domain: 'company',
      field: 'tradingName',
      label: 'Trading Name',
      value: company.tradingName || null
    },
    {
      domain: 'company',
      field: 'industryDescription',
      label: 'Industry',
      value: company.industryDescription
    },
    {
      domain: 'company',
      field: 'totalFte',
      label: 'Total Employees (FTE)',
      value: company.totalFte,
      confidence: company.fteConfidence
    },
    {
      domain: 'company',
      field: 'numberOfSites',
      label: 'Number of Sites',
      value: company.numberOfSites
    },
    {
      domain: 'company',
      field: 'headquartersCountry',
      label: 'Headquarters Country',
      value: company.headquartersCountry
    },
    {
      domain: 'company',
      field: 'reportingPeriod',
      label: 'Reporting Period',
      value: `${company.reportingPeriodStart} to ${company.reportingPeriodEnd}`
    },
    {
      domain: 'company',
      field: 'revenueBand',
      label: 'Revenue Band',
      value: formatRevenueBand(company.revenueBand)
    }
  ];

  // Add site summary
  if (sites.length > 0) {
    const siteTypes = [...new Set(sites.map(s => s.siteType))];
    const countries = [...new Set(sites.map(s => s.country))];
    
    points.push({
      domain: 'site',
      field: 'siteTypes',
      label: 'Site Types',
      value: siteTypes.join(', ')
    });
    
    points.push({
      domain: 'site',
      field: 'operatingCountries',
      label: 'Operating Countries',
      value: countries.join(', ')
    });
  }

  return points.filter(p => p.value !== null && p.value !== undefined && p.value !== '');
}

function retrieveGoalsData(goals: Goals | null): RetrievedDataPoint[] {
  if (!goals) return [];

  const points: RetrievedDataPoint[] = [
    {
      domain: 'goals',
      field: 'primaryGoal',
      label: 'Primary Sustainability Goal',
      value: goals.primaryGoal
    },
    {
      domain: 'goals',
      field: 'timeHorizon',
      label: 'Time Horizon',
      value: formatTimeHorizon(goals.timeHorizon)
    },
    {
      domain: 'goals',
      field: 'primaryMotivation',
      label: 'Primary Motivation',
      value: formatMotivation(goals.primaryMotivation)
    },
    {
      domain: 'goals',
      field: 'successDefinition',
      label: 'Success Definition',
      value: goals.successDefinition
    }
  ];
  return points.filter(p => p.value);
}

function retrieveRegulatoryData(context: RegulatoryContext | null): RetrievedDataPoint[] {
  if (!context) return [];

  const points: RetrievedDataPoint[] = [
    {
      domain: 'regulatory',
      field: 'csrdApplicable',
      label: 'CSRD Applicable',
      value: formatApplicability(context.csrdApplicable)
    },
    {
      domain: 'regulatory',
      field: 'vsmeApplicable',
      label: 'VSME Applicable',
      value: formatApplicability(context.vsmeApplicable)
    }
  ];

  if (context.certificationsHeld && context.certificationsHeld.length > 0) {
    points.push({
      domain: 'regulatory',
      field: 'certificationsHeld',
      label: 'Certifications Held',
      value: context.certificationsHeld.join(', ')
    });
  }

  if (context.otherFrameworks && context.otherFrameworks.length > 0) {
    points.push({
      domain: 'regulatory',
      field: 'otherFrameworks',
      label: 'Other Frameworks',
      value: context.otherFrameworks.join(', ')
    });
  }

  return points.filter(p => p.value);
}

function retrieveEnergyData(
  electricity: EnergyElectricity[],
  fuels: EnergyFuel[],
  water: EnergyWater[],
  _sites: Site[]
): RetrievedDataPoint[] {
  const points: RetrievedDataPoint[] = [];

  // Aggregate electricity
  if (electricity.length > 0) {
    const totalKwh = electricity.reduce((sum, e) => sum + e.consumptionKwh, 0);
    const renewableKwh = electricity.reduce((sum, e) => {
      return sum + 
        (e.consumptionKwh * (e.sourceOnsiteRenewablePercent || 0) / 100) +
        (e.consumptionKwh * (e.sourcePpaPercent || 0) / 100);
    }, 0);
    const renewablePercent = totalKwh > 0 ? (renewableKwh / totalKwh * 100) : 0;

    // Get period range
    const periods = electricity.map(e => e.period).sort();
    const periodRange = periods.length > 1 
      ? `${periods[0]} to ${periods[periods.length - 1]}`
      : periods[0];

    points.push({
      domain: 'energy_electricity',
      field: 'totalElectricity',
      label: 'Total Electricity Consumption',
      value: Math.round(totalKwh),
      unit: 'kWh',
      period: periodRange,
      confidence: getMostCommonConfidence(electricity)
    });

    points.push({
      domain: 'energy_electricity',
      field: 'renewablePercent',
      label: 'Renewable Electricity',
      value: Math.round(renewablePercent * 10) / 10,
      unit: '%',
      period: periodRange
    });

    // Check for green tariffs
    const hasGreenTariff = electricity.some(e => e.greenTariff);
    points.push({
      domain: 'energy_electricity',
      field: 'greenTariff',
      label: 'Green Tariff',
      value: hasGreenTariff ? 'Yes' : 'No'
    });
  }

  // Aggregate fuels
  if (fuels.length > 0) {
    const fuelByType = new Map<string, number>();
    fuels.forEach(f => {
      const current = fuelByType.get(f.fuelType) || 0;
      fuelByType.set(f.fuelType, current + f.quantity);
    });

    fuelByType.forEach((quantity, fuelType) => {
      points.push({
        domain: 'energy_fuel',
        field: `fuel_${fuelType}`,
        label: `${formatFuelType(fuelType)} Consumption`,
        value: Math.round(quantity),
        unit: fuels.find(f => f.fuelType === fuelType)?.unit || 'units'
      });
    });
  }

  // Aggregate water
  if (water.length > 0) {
    const totalWithdrawal = water.reduce((sum, w) => sum + w.withdrawalM3, 0);
    const totalDischarge = water.reduce((sum, w) => sum + (w.dischargeM3 || 0), 0);

    points.push({
      domain: 'energy_water',
      field: 'waterWithdrawal',
      label: 'Water Withdrawal',
      value: Math.round(totalWithdrawal),
      unit: 'm³',
      confidence: getMostCommonConfidence(water)
    });

    if (totalDischarge > 0) {
      points.push({
        domain: 'energy_water',
        field: 'waterDischarge',
        label: 'Water Discharge',
        value: Math.round(totalDischarge),
        unit: 'm³'
      });
    }
  }

  return points;
}

function retrieveMaterialsData(
  materials: Material[],
  inputs: MaterialInput[]
): RetrievedDataPoint[] {
  const points: RetrievedDataPoint[] = [];

  if (inputs.length > 0) {
    // Total by category
    const byCategory = new Map<string, number>();
    inputs.forEach(i => {
      const material = materials.find(m => m.id === i.materialId);
      const category = material?.materialCategory || 'other';
      byCategory.set(category, (byCategory.get(category) || 0) + i.quantity);
    });

    byCategory.forEach((quantity, category) => {
      points.push({
        domain: 'materials',
        field: `materials_${category}`,
        label: `${formatCategory(category)} Materials`,
        value: Math.round(quantity),
        unit: 'kg'
      });
    });

    // Recycled content
    const totalQuantity = inputs.reduce((sum, i) => sum + i.quantity, 0);
    const recycledQuantity = inputs.reduce((sum, i) => {
      return sum + (i.quantity * (i.recycledContentPercent || 0) / 100);
    }, 0);
    const recycledPercent = totalQuantity > 0 ? (recycledQuantity / totalQuantity * 100) : 0;

    if (recycledPercent > 0) {
      points.push({
        domain: 'materials',
        field: 'recycledContent',
        label: 'Average Recycled Content',
        value: Math.round(recycledPercent * 10) / 10,
        unit: '%'
      });
    }

    // Supplier countries
    const countries = [...new Set(inputs.map(i => i.supplierCountry).filter(Boolean))];
    if (countries.length > 0) {
      points.push({
        domain: 'materials',
        field: 'supplierCountries',
        label: 'Supplier Countries',
        value: countries.join(', ')
      });
    }
  }

  return points;
}

function retrieveWorkforceData(
  workforce: Workforce[],
  healthSafety: HealthSafety[],
  training: Training[]
): RetrievedDataPoint[] {
  const points: RetrievedDataPoint[] = [];

  // Latest workforce data
  if (workforce.length > 0) {
    const latest = workforce.sort((a, b) => b.period.localeCompare(a.period))[0];
    
    points.push({
      domain: 'workforce',
      field: 'totalFte',
      label: 'Total FTE',
      value: latest.totalFte,
      period: latest.period,
      confidence: latest.confidence
    });

    if (latest.femalePercent !== undefined) {
      points.push({
        domain: 'workforce',
        field: 'femalePercent',
        label: 'Female Employees',
        value: latest.femalePercent,
        unit: '%'
      });
    }

    if (latest.permanentEmployees !== undefined) {
      points.push({
        domain: 'workforce',
        field: 'permanentEmployees',
        label: 'Permanent Employees',
        value: latest.permanentEmployees
      });
    }

    points.push({
      domain: 'workforce',
      field: 'totalHoursWorked',
      label: 'Total Hours Worked',
      value: latest.totalHoursWorked,
      period: latest.period
    });
  }

  // Health & Safety
  if (healthSafety.length > 0) {
    const totalIncidents = healthSafety.reduce((sum, h) => sum + h.recordableIncidents, 0);
    const totalLostTime = healthSafety.reduce((sum, h) => sum + h.lostTimeIncidents, 0);
    const totalFatalities = healthSafety.reduce((sum, h) => sum + h.fatalities, 0);
    const totalHours = workforce.reduce((sum, w) => sum + w.totalHoursWorked, 0);

    points.push({
      domain: 'health_safety',
      field: 'recordableIncidents',
      label: 'Recordable Incidents',
      value: totalIncidents
    });

    points.push({
      domain: 'health_safety',
      field: 'lostTimeIncidents',
      label: 'Lost Time Incidents',
      value: totalLostTime
    });

    points.push({
      domain: 'health_safety',
      field: 'fatalities',
      label: 'Fatalities',
      value: totalFatalities
    });

    // Calculate TRIR if we have hours
    if (totalHours > 0) {
      const trir = (totalIncidents * 200000) / totalHours;
      points.push({
        domain: 'health_safety',
        field: 'trir',
        label: 'Total Recordable Incident Rate (TRIR)',
        value: Math.round(trir * 100) / 100
      });
    }
  }

  // Training
  if (training.length > 0) {
    const totalTrainingHours = training.reduce((sum, t) => sum + (t.totalTrainingHours || 0), 0);
    const totalTrained = training.reduce((sum, t) => sum + (t.employeesTrained || 0), 0);

    if (totalTrainingHours > 0) {
      points.push({
        domain: 'training',
        field: 'totalTrainingHours',
        label: 'Total Training Hours',
        value: totalTrainingHours,
        unit: 'hours'
      });
    }

    if (totalTrained > 0) {
      points.push({
        domain: 'training',
        field: 'employeesTrained',
        label: 'Employees Trained',
        value: totalTrained
      });
    }
  }

  return points;
}

function retrieveWasteData(waste: Waste[]): RetrievedDataPoint[] {
  const points: RetrievedDataPoint[] = [];

  if (waste.length > 0) {
    const totalWaste = waste.reduce((sum, w) => sum + w.quantityKg, 0);
    const hazardousWaste = waste.filter(w => w.hazardous).reduce((sum, w) => sum + w.quantityKg, 0);
    const recycledWaste = waste
      .filter(w => w.disposalRoute === 'recycling' || w.disposalRoute === 'composting')
      .reduce((sum, w) => sum + w.quantityKg, 0);

    points.push({
      domain: 'waste',
      field: 'totalWaste',
      label: 'Total Waste Generated',
      value: Math.round(totalWaste),
      unit: 'kg'
    });

    const diversionRate = totalWaste > 0 ? (recycledWaste / totalWaste * 100) : 0;
    points.push({
      domain: 'waste',
      field: 'diversionRate',
      label: 'Waste Diversion Rate',
      value: Math.round(diversionRate * 10) / 10,
      unit: '%'
    });

    if (hazardousWaste > 0) {
      points.push({
        domain: 'waste',
        field: 'hazardousWaste',
        label: 'Hazardous Waste',
        value: Math.round(hazardousWaste),
        unit: 'kg'
      });
    }

    // By disposal route
    const byRoute = new Map<string, number>();
    waste.forEach(w => {
      byRoute.set(w.disposalRoute, (byRoute.get(w.disposalRoute) || 0) + w.quantityKg);
    });

    byRoute.forEach((quantity, route) => {
      points.push({
        domain: 'waste',
        field: `waste_${route}`,
        label: `Waste to ${formatDisposalRoute(route)}`,
        value: Math.round(quantity),
        unit: 'kg'
      });
    });
  }

  return points;
}

function retrieveTransportData(transport: TransportLog[]): RetrievedDataPoint[] {
  const points: RetrievedDataPoint[] = [];

  if (transport.length > 0) {
    // By mode
    const byMode = new Map<string, { distance: number; tkm: number }>();
    transport.forEach(t => {
      const current = byMode.get(t.mode) || { distance: 0, tkm: 0 };
      byMode.set(t.mode, {
        distance: current.distance + (t.distanceKm || 0),
        tkm: current.tkm + (t.tkm || 0)
      });
    });

    byMode.forEach((data, mode) => {
      if (data.tkm > 0) {
        points.push({
          domain: 'transport',
          field: `transport_${mode}_tkm`,
          label: `${formatTransportMode(mode)} Transport`,
          value: Math.round(data.tkm),
          unit: 'tonne-km'
        });
      }
    });

    // By direction
    const inbound = transport.filter(t => t.direction === 'inbound');
    const outbound = transport.filter(t => t.direction === 'outbound');

    if (inbound.length > 0) {
      const inboundTkm = inbound.reduce((sum, t) => sum + (t.tkm || 0), 0);
      points.push({
        domain: 'transport',
        field: 'inboundTransport',
        label: 'Inbound Transport',
        value: Math.round(inboundTkm),
        unit: 'tonne-km'
      });
    }

    if (outbound.length > 0) {
      const outboundTkm = outbound.reduce((sum, t) => sum + (t.tkm || 0), 0);
      points.push({
        domain: 'transport',
        field: 'outboundTransport',
        label: 'Outbound Transport',
        value: Math.round(outboundTkm),
        unit: 'tonne-km'
      });
    }
  }

  return points;
}

function retrieveEmissionsData(
  directEmissions: DirectEmission[],
  electricity: EnergyElectricity[],
  fuels: EnergyFuel[]
): RetrievedDataPoint[] {
  const points: RetrievedDataPoint[] = [];

  // Direct emissions (refrigerants, process)
  if (directEmissions.length > 0) {
    const totalDirect = directEmissions.reduce((sum, e) => sum + (e.tco2e || 0), 0);
    
    points.push({
      domain: 'emissions',
      field: 'directEmissions',
      label: 'Direct Process Emissions',
      value: Math.round(totalDirect * 10) / 10,
      unit: 'tCO2e'
    });
  }

  // Estimate Scope 1 from fuels (simplified)
  if (fuels.length > 0) {
    // Very rough estimate - would need proper emission factors
    const fuelEmissions = fuels.reduce((sum, f) => {
      const factor = getEmissionFactor(f.fuelType, f.unit);
      return sum + (f.quantity * factor);
    }, 0);

    points.push({
      domain: 'emissions',
      field: 'scope1Estimate',
      label: 'Scope 1 Emissions (Estimated)',
      value: Math.round(fuelEmissions * 10) / 10,
      unit: 'tCO2e',
      confidence: 'low'
    });
  }

  // Estimate Scope 2 from electricity
  if (electricity.length > 0) {
    const totalKwh = electricity.reduce((sum, e) => sum + e.consumptionKwh, 0);
    const renewableKwh = electricity.reduce((sum, e) => {
      return sum + 
        (e.consumptionKwh * (e.sourceOnsiteRenewablePercent || 0) / 100) +
        (e.consumptionKwh * (e.sourcePpaPercent || 0) / 100);
    }, 0);
    
    // Location-based (all electricity)
    const locationBased = totalKwh * 0.0004; // Rough average factor tCO2e/kWh
    
    // Market-based (excluding renewables)
    const marketBased = (totalKwh - renewableKwh) * 0.0004;

    points.push({
      domain: 'emissions',
      field: 'scope2Location',
      label: 'Scope 2 Location-Based (Estimated)',
      value: Math.round(locationBased * 10) / 10,
      unit: 'tCO2e',
      confidence: 'low'
    });

    points.push({
      domain: 'emissions',
      field: 'scope2Market',
      label: 'Scope 2 Market-Based (Estimated)',
      value: Math.round(marketBased * 10) / 10,
      unit: 'tCO2e',
      confidence: 'low'
    });
  }

  return points;
}

// ============================================
// Main Retrieval Function
// ============================================

export function retrieveDataForMatch(
  matchResult: MatchResult,
  storeData: StoreData
): DataContext {
  const allDomains = [
    matchResult.primaryDomain,
    ...matchResult.secondaryDomains
  ].filter((d): d is DataDomain => d !== null);

  const company: RetrievedDataPoint[] = [];
  const operational: RetrievedDataPoint[] = [];
  const calculated: RetrievedDataPoint[] = [];
  const dataGaps: string[] = [];

  for (const domain of allDomains) {
    switch (domain) {
      case 'company':
        company.push(...retrieveCompanyData(storeData.company, storeData.sites));
        break;
      case 'site':
        company.push(...retrieveCompanyData(storeData.company, storeData.sites));
        break;
      case 'goals':
        company.push(...retrieveGoalsData(storeData.goals));
        break;
      case 'swot':
        if (storeData.swot) {
          company.push({
            domain: 'swot',
            field: 'strengths',
            label: 'Strengths',
            value: storeData.swot.strengths
          });
        }
        break;
      case 'regulatory':
        company.push(...retrieveRegulatoryData(storeData.regulatoryContext));
        break;
      case 'energy_electricity':
      case 'energy_fuel':
      case 'energy_water':
        operational.push(...retrieveEnergyData(
          storeData.energyElectricity,
          storeData.energyFuels,
          storeData.energyWater,
          storeData.sites
        ));
        break;
      case 'materials':
        operational.push(...retrieveMaterialsData(storeData.materials, storeData.materialInputs));
        break;
      case 'packaging':
        // Similar to materials
        break;
      case 'workforce':
      case 'health_safety':
      case 'training':
        operational.push(...retrieveWorkforceData(
          storeData.workforce,
          storeData.healthSafety,
          storeData.training
        ));
        break;
      case 'waste':
        operational.push(...retrieveWasteData(storeData.waste));
        break;
      case 'transport':
        operational.push(...retrieveTransportData(storeData.transportLogs));
        break;
      case 'emissions':
        calculated.push(...retrieveEmissionsData(
          storeData.directEmissions,
          storeData.energyElectricity,
          storeData.energyFuels
        ));
        break;
      case 'external_context':
        if (storeData.externalContext) {
          company.push({
            domain: 'external_context',
            field: 'marketScope',
            label: 'Market Scope',
            value: storeData.externalContext.marketScope
          });
        }
        break;
      case 'financial_context':
        if (storeData.financialContext) {
          company.push({
            domain: 'financial_context',
            field: 'revenueBand',
            label: 'Revenue Band',
            value: formatRevenueBand(storeData.financialContext.revenueBand)
          });
        }
        break;
    }
  }

  // Identify data gaps
  if (allDomains.includes('energy_electricity') && storeData.energyElectricity.length === 0) {
    dataGaps.push('No electricity consumption data');
  }
  if (allDomains.includes('workforce') && storeData.workforce.length === 0) {
    dataGaps.push('No workforce data');
  }
  if (allDomains.includes('emissions') && storeData.directEmissions.length === 0 && storeData.energyFuels.length === 0) {
    dataGaps.push('No emissions data available');
  }

  return {
    company: deduplicate(company),
    operational: deduplicate(operational),
    calculated: deduplicate(calculated),
    metadata: {
      reportingPeriod: storeData.company 
        ? `${storeData.company.reportingPeriodStart} to ${storeData.company.reportingPeriodEnd}`
        : undefined,
      sitesIncluded: storeData.sites.map(s => s.siteName),
      dataGaps
    }
  };
}

// ============================================
// Utility Functions
// ============================================

function deduplicate(points: RetrievedDataPoint[]): RetrievedDataPoint[] {
  const seen = new Set<string>();
  return points.filter(p => {
    const key = `${p.domain}-${p.field}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getMostCommonConfidence(items: { confidence?: ConfidenceLevel }[]): ConfidenceLevel | undefined {
  const counts: Record<string, number> = {};
  items.forEach(i => {
    if (i.confidence) {
      counts[i.confidence] = (counts[i.confidence] || 0) + 1;
    }
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] as ConfidenceLevel | undefined;
}

function formatRevenueBand(band: string): string {
  const labels: Record<string, string> = {
    '<500k': 'Under €500k',
    '500k-1m': '€500k - €1M',
    '1m-5m': '€1M - €5M',
    '5m-10m': '€5M - €10M',
    '10m-50m': '€10M - €50M',
    '50m-100m': '€50M - €100M',
    '>100m': 'Over €100M',
    'prefer_not_to_say': 'Not disclosed'
  };
  return labels[band] || band;
}

function formatTimeHorizon(horizon: string): string {
  const labels: Record<string, string> = {
    '1-year': '1 year',
    '2-3-years': '2-3 years',
    '5-years': '5 years'
  };
  return labels[horizon] || horizon;
}

function formatMotivation(motivation: string): string {
  const labels: Record<string, string> = {
    compliance: 'Regulatory compliance',
    cost: 'Cost reduction',
    customers: 'Customer requirements',
    values: 'Company values',
    competitive: 'Competitive advantage',
    financing: 'Access to financing',
    risk: 'Risk management',
    other: 'Other'
  };
  return labels[motivation] || motivation;
}

function formatApplicability(status: string): string {
  const labels: Record<string, string> = {
    yes: 'Yes',
    no: 'No',
    unsure: 'Unsure'
  };
  return labels[status] || status;
}

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
}

function formatFuelType(type: string): string {
  const labels: Record<string, string> = {
    natural_gas: 'Natural Gas',
    lpg: 'LPG',
    heating_oil: 'Heating Oil',
    diesel: 'Diesel',
    petrol: 'Petrol',
    coal: 'Coal',
    biomass: 'Biomass',
    other: 'Other'
  };
  return labels[type] || type;
}

function formatDisposalRoute(route: string): string {
  const labels: Record<string, string> = {
    landfill: 'Landfill',
    incineration: 'Incineration',
    recycling: 'Recycling',
    composting: 'Composting',
    reuse: 'Reuse',
    other: 'Other'
  };
  return labels[route] || route;
}

function formatTransportMode(mode: string): string {
  const labels: Record<string, string> = {
    road: 'Road',
    rail: 'Rail',
    sea: 'Sea',
    air: 'Air',
    multimodal: 'Multimodal'
  };
  return labels[mode] || mode;
}

function getEmissionFactor(fuelType: string, unit: string): number {
  // Simplified emission factors in tCO2e per unit
  // In production, use proper emission factor database
  const factors: Record<string, Record<string, number>> = {
    natural_gas: { m3: 0.00202, kwh: 0.000184 },
    diesel: { L: 0.00268, kg: 0.00315 },
    petrol: { L: 0.00231, kg: 0.00296 },
    lpg: { L: 0.00161, kg: 0.00298 },
    heating_oil: { L: 0.00268 },
    coal: { kg: 0.00234, t: 2.34 }
  };
  return factors[fuelType]?.[unit] || 0.002;
}
