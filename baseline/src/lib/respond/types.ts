// ============================================
// Response Generator - Type Definitions
// ============================================

import type { ConfidenceLevel, DataSource } from '@/types';

// ============================================
// Question Parsing
// ============================================

export interface ParsedQuestion {
  id: string;
  rowIndex: number;
  text: string;
  category?: string;
  subcategory?: string;
  referenceId?: string; // e.g., "E1.1" or "GRI 302-1"
  framework?: string; // e.g., "CSRD", "EcoVadis", "CDP"
  required?: boolean;
  rawRow: Record<string, unknown>;
}

export interface ParseResult {
  success: boolean;
  questions: ParsedQuestion[];
  errors: string[];
  metadata: {
    fileName: string;
    totalRows: number;
    parsedRows: number;
    detectedFramework?: string;
    columnMapping: ColumnMapping;
  };
}

export interface ColumnMapping {
  questionText: string;
  category?: string;
  subcategory?: string;
  referenceId?: string;
  required?: string;
}

// ============================================
// Keyword Matching
// ============================================

export type DataDomain =
  | 'company'
  | 'site'
  | 'goals'
  | 'swot'
  | 'regulatory'
  | 'materials'
  | 'packaging'
  | 'energy_electricity'
  | 'energy_fuel'
  | 'energy_water'
  | 'emissions'
  | 'infrastructure'
  | 'transport'
  | 'workforce'
  | 'health_safety'
  | 'training'
  | 'waste'
  | 'products'
  | 'effluents'
  | 'external_context'
  | 'financial_context'
  | 'buyer_requirements';

export type TopicTag =
  // Environmental
  | 'ghg_emissions'
  | 'scope_1'
  | 'scope_2'
  | 'scope_3'
  | 'renewable_energy'
  | 'energy_consumption'
  | 'water_usage'
  | 'waste_management'
  | 'recycling'
  | 'circular_economy'
  | 'biodiversity'
  | 'pollution'
  | 'climate_targets'
  // Social
  | 'employee_count'
  | 'diversity'
  | 'health_safety'
  | 'training'
  | 'human_rights'
  | 'labor_practices'
  | 'community'
  | 'supply_chain_social'
  // Governance
  | 'certifications'
  | 'policies'
  | 'compliance'
  | 'risk_management'
  | 'supplier_management'
  | 'ethics'
  | 'transparency'
  // Operational
  | 'materials'
  | 'packaging'
  | 'transport'
  | 'logistics'
  | 'production'
  | 'facilities'
  // Business context
  | 'company_profile'
  | 'revenue'
  | 'strategy'
  | 'targets';

export interface MatchResult {
  questionId: string;
  primaryDomain: DataDomain | null;
  secondaryDomains: DataDomain[];
  topics: TopicTag[];
  confidence: 'high' | 'medium' | 'low' | 'none';
  matchedKeywords: string[];
  suggestedDataPoints: string[];
}

export interface KeywordRule {
  keywords: string[];
  domain: DataDomain;
  topics: TopicTag[];
  weight: number;
}

// ============================================
// Data Retrieval
// ============================================

export interface RetrievedDataPoint {
  domain: DataDomain;
  field: string;
  label: string;
  value: string | number | boolean | null;
  unit?: string;
  period?: string;
  source?: DataSource;
  confidence?: ConfidenceLevel;
  siteId?: string;
  siteName?: string;
}

export interface DataContext {
  company: RetrievedDataPoint[];
  operational: RetrievedDataPoint[];
  calculated: RetrievedDataPoint[];
  metadata: {
    reportingPeriod?: string;
    sitesIncluded: string[];
    dataGaps: string[];
  };
}

// ============================================
// Answer Generation
// ============================================

export interface AnswerDraft {
  questionId: string;
  questionText: string;
  category?: string;
  
  // Match info
  matchResult: MatchResult;
  
  // Retrieved data
  dataContext: DataContext;
  
  // Generated answer
  answer: string;
  dataValue?: string;
  dataUnit?: string;
  dataPeriod?: string;
  dataSource?: string;
  
  // Quality indicators
  answerConfidence: 'high' | 'medium' | 'low' | 'none';
  dataQuality?: ConfidenceLevel;
  
  // For review
  methodology?: string;
  assumptions?: string[];
  limitations?: string[];
  suggestedEvidence?: string[];
  
  // Flags
  needsReview: boolean;
  isEstimate: boolean;
  hasDataGaps: boolean;
}

export interface GenerationConfig {
  useLLM: boolean;
  llmProvider?: 'anthropic' | 'openai';
  apiKey?: string;
  model?: string;
  
  // Generation options
  includeMethodology: boolean;
  includeAssumptions: boolean;
  includeLimitations: boolean;
  verbosity: 'concise' | 'standard' | 'detailed';
  
  // Data options
  aggregateSites: boolean;
  defaultPeriod?: string;
}

// ============================================
// Session Management
// ============================================

export interface ResponseSession {
  id: string;
  questionnaireName: string;
  requestor?: string;
  framework?: string;
  
  // Parsed input
  parseResult: ParseResult;
  
  // Processing state
  matchResults: MatchResult[];
  answerDrafts: AnswerDraft[];
  
  // Progress
  status: 'parsing' | 'matching' | 'retrieving' | 'generating' | 'review' | 'complete';
  progress: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}
