import type { Site, Company, RegulatoryContext, Goals } from '@/types';
import {
  type TrackingData,
  type DomainMetric,
  type TimeSeriesCoverage,
  type DataQualityBreakdown
} from './utils';

export interface ContextTrackingData extends TrackingData {
  completenessScore: number;
}

interface ContextData {
  company?: Company | null;
  sites: Site[];
  regulatoryContext?: RegulatoryContext | null;
  goals?: Goals | null;
}

export function calculateContextMetrics(
  contextData: ContextData
): ContextTrackingData {
  const { company, sites, regulatoryContext, goals } = contextData;

  // Calculate completeness score
  let completedFields = 0;
  let totalFields = 0;

  // Company fields
  const companyFields = [
    'legalEntityName',
    'tradingName',
    'registrationNumber',
    'industryCode',
    'ownershipType',
    'totalFte',
    'revenueBand',
    'reportingPeriodStart',
    'reportingPeriodEnd'
  ];

  totalFields += companyFields.length;
  if (company) {
    companyFields.forEach(field => {
      if (company[field as keyof Company]) completedFields++;
    });
  }

  // Sites
  totalFields += 1; // At least one site
  if (sites.length > 0) completedFields++;

  // Site details
  const siteFields = ['siteName', 'siteType', 'country', 'floorAreaM2'];
  sites.forEach(site => {
    totalFields += siteFields.length;
    siteFields.forEach(field => {
      if (site[field as keyof Site]) completedFields++;
    });
  });

  // Regulatory context (optional but valuable)
  const hasRegulatoryContext = regulatoryContext && regulatoryContext.csrdApplicable;
  const hasGoals = goals && goals.primaryGoal;

  // Certifications tracking
  const certifications = regulatoryContext?.certificationsHeld || [];

  const completenessScore = totalFields > 0
    ? Math.round((completedFields / totalFields) * 100)
    : 0;

  // Build metrics
  const metrics: DomainMetric[] = [
    {
      label: 'Completeness',
      value: completenessScore,
      unit: '%'
    },
    {
      label: 'Sites',
      value: sites.length.toString(),
      unit: 'registered'
    },
    {
      label: 'Certifications',
      value: certifications.length.toString(),
      unit: 'held'
    },
    {
      label: 'Goals',
      value: hasGoals ? 'Set' : 'Not Set',
      unit: ''
    },
    {
      label: 'Company Profile',
      value: company ? 'Complete' : 'Missing',
      unit: ''
    }
  ];

  // Generate recommendations
  const recommendations: string[] = [];

  if (!company) {
    recommendations.push('Company profile is not set. Complete basic company information first.');
  } else {
    if (!company.industryCode) {
      recommendations.push('Industry classification missing. Required for benchmark comparisons.');
    }
    if (!company.totalFte) {
      recommendations.push('Employee count not specified. Needed for intensity metrics.');
    }
    if (!company.revenueBand) {
      recommendations.push('Revenue range not specified. Useful for peer comparisons.');
    }
  }

  if (sites.length === 0) {
    recommendations.push('No sites registered. Add at least your primary operating site.');
  } else {
    const sitesWithoutArea = sites.filter(s => !s.floorAreaM2).length;
    if (sitesWithoutArea > 0) {
      recommendations.push(`${sitesWithoutArea} site(s) missing floor area. Add for energy intensity calculations.`);
    }
  }

  if (certifications.length === 0) {
    recommendations.push('No certifications logged. Add ISO 14001, B Corp, or other relevant certifications.');
  }

  if (!hasGoals) {
    recommendations.push('No sustainability goals set. Define your primary sustainability objective.');
  }

  // Context doesn't have time-series coverage, so we set simple values
  const coverage: TimeSeriesCoverage = {
    periodsWithData: [],
    periodsMissing: [],
    oldestData: company?.createdAt || 'N/A',
    newestData: company?.updatedAt || 'N/A',
    coveragePercent: completenessScore
  };

  const total = 4; // company + sites + regulatory + goals
  const quality: DataQualityBreakdown = {
    high: company ? 1 : 0,
    medium: (sites.length > 0 ? 1 : 0) + (hasRegulatoryContext ? 1 : 0),
    low: hasGoals ? 1 : 0,
    noData: total - (company ? 1 : 0) - (sites.length > 0 ? 1 : 0) - (hasRegulatoryContext ? 1 : 0) - (hasGoals ? 1 : 0),
    total
  };

  return {
    metrics,
    coverage,
    quality,
    recommendations,
    completenessScore
  };
}
