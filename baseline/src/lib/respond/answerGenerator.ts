// ============================================
// Answer Generator - Compose answers from matched data
// ============================================

import type {
  ParsedQuestion,
  MatchResult,
  DataContext,
  AnswerDraft,
  GenerationConfig,
  RetrievedDataPoint
} from './types';

// ============================================
// Template-Based Answer Generation
// ============================================

interface AnswerTemplate {
  domains: string[];
  topics: string[];
  template: string;
  requiredFields: string[];
}

const ANSWER_TEMPLATES: AnswerTemplate[] = [
  // Energy & Emissions
  {
    domains: ['energy_electricity'],
    topics: ['energy_consumption', 'renewable_energy'],
    template: `Our total electricity consumption for the reporting period was {totalElectricity} kWh. {renewablePercent}% of this electricity came from renewable sources, including on-site generation and renewable energy certificates.`,
    requiredFields: ['totalElectricity', 'renewablePercent']
  },
  {
    domains: ['emissions'],
    topics: ['ghg_emissions', 'scope_1', 'scope_2'],
    template: `Our greenhouse gas emissions for the reporting period are as follows: {scope1Estimate} tCO2e (Scope 1, estimated from fuel consumption) and {scope2Location} tCO2e (Scope 2, location-based) / {scope2Market} tCO2e (market-based). Note: These figures are estimates based on activity data and standard emission factors.`,
    requiredFields: ['scope1Estimate', 'scope2Location']
  },
  
  // Workforce
  {
    domains: ['workforce'],
    topics: ['employee_count'],
    template: `As of {period}, our organization employs {totalFte} full-time equivalent (FTE) employees.`,
    requiredFields: ['totalFte']
  },
  {
    domains: ['workforce'],
    topics: ['diversity'],
    template: `Our workforce comprises {totalFte} FTE employees, of which {femalePercent}% are female.`,
    requiredFields: ['totalFte', 'femalePercent']
  },
  {
    domains: ['health_safety'],
    topics: ['health_safety'],
    template: `During the reporting period, we recorded {recordableIncidents} recordable incidents and {lostTimeIncidents} lost time incidents. Our Total Recordable Incident Rate (TRIR) is {trir}. {fatalities === 0 ? 'There were no fatalities.' : 'Regrettably, there were ' + fatalities + ' fatalities.'}`,
    requiredFields: ['recordableIncidents', 'trir']
  },
  
  // Waste
  {
    domains: ['waste'],
    topics: ['waste_management', 'recycling'],
    template: `Our total waste generated was {totalWaste} kg. We achieved a waste diversion rate of {diversionRate}%, with waste directed to recycling, composting, and reuse programs.`,
    requiredFields: ['totalWaste', 'diversionRate']
  },
  
  // Water
  {
    domains: ['energy_water'],
    topics: ['water_usage'],
    template: `Our total water withdrawal for the reporting period was {waterWithdrawal} m³.`,
    requiredFields: ['waterWithdrawal']
  },
  
  // Company profile
  {
    domains: ['company'],
    topics: ['company_profile', 'employee_count'],
    template: `{legalEntityName} is a {industryDescription} company headquartered in {headquartersCountry}. We employ {totalFte} FTE across {numberOfSites} operational sites.`,
    requiredFields: ['legalEntityName', 'industryDescription', 'totalFte']
  },
  
  // Certifications
  {
    domains: ['regulatory'],
    topics: ['certifications'],
    template: `Our organization holds the following certifications: {certificationsHeld}.`,
    requiredFields: ['certificationsHeld']
  },
  
  // Training
  {
    domains: ['training'],
    topics: ['training'],
    template: `During the reporting period, we delivered {totalTrainingHours} hours of training to {employeesTrained} employees.`,
    requiredFields: ['totalTrainingHours', 'employeesTrained']
  }
];

// ============================================
// Answer Generation Logic
// ============================================

/**
 * Find matching template for a question
 */
function findMatchingTemplate(matchResult: MatchResult): AnswerTemplate | null {
  if (!matchResult.primaryDomain) return null;

  const candidateTemplates = ANSWER_TEMPLATES.filter(template => {
    // Check domain match
    const domainMatch = template.domains.includes(matchResult.primaryDomain!) ||
      matchResult.secondaryDomains.some(d => template.domains.includes(d));
    
    if (!domainMatch) return false;

    // Check topic overlap
    const topicMatch = template.topics.some(t => 
      matchResult.topics.includes(t as any)
    );

    return topicMatch;
  });

  // Return best match (most topic overlap)
  return candidateTemplates.sort((a, b) => {
    const aOverlap = a.topics.filter(t => matchResult.topics.includes(t as any)).length;
    const bOverlap = b.topics.filter(t => matchResult.topics.includes(t as any)).length;
    return bOverlap - aOverlap;
  })[0] || null;
}

/**
 * Build data map from retrieved context
 */
function buildDataMap(context: DataContext): Map<string, RetrievedDataPoint> {
  const map = new Map<string, RetrievedDataPoint>();
  
  [...context.company, ...context.operational, ...context.calculated].forEach(point => {
    map.set(point.field, point);
  });
  
  return map;
}

/**
 * Fill template with data
 */
function fillTemplate(template: string, dataMap: Map<string, RetrievedDataPoint>): string {
  let filled = template;
  
  // Replace {field} placeholders
  const placeholders = template.match(/\{([^}]+)\}/g) || [];
  
  for (const placeholder of placeholders) {
    const field = placeholder.slice(1, -1);
    
    // Handle conditional expressions like {fatalities === 0 ? ... : ...}
    if (field.includes('?')) {
      // Skip complex expressions for now - would need a proper expression parser
      continue;
    }
    
    const dataPoint = dataMap.get(field);
    if (dataPoint && dataPoint.value !== null && dataPoint.value !== undefined) {
      const displayValue = dataPoint.unit 
        ? `${dataPoint.value}` 
        : String(dataPoint.value);
      filled = filled.replace(placeholder, displayValue);
    }
  }
  
  return filled;
}

/**
 * Generate a simple answer from available data
 */
function generateSimpleAnswer(
  context: DataContext,
  matchResult: MatchResult
): { answer: string; dataValue?: string; dataSource?: string } {
  const dataMap = buildDataMap(context);
  
  // Try template-based generation first
  const template = findMatchingTemplate(matchResult);
  if (template) {
    // Check if we have required fields
    const hasRequired = template.requiredFields.every(field => {
      const point = dataMap.get(field);
      return point && point.value !== null && point.value !== undefined;
    });
    
    if (hasRequired) {
      const answer = fillTemplate(template.template, dataMap);
      
      // Get primary data value
      const primaryField = template.requiredFields[0];
      const primaryPoint = dataMap.get(primaryField);
      
      return {
        answer,
        dataValue: primaryPoint ? `${primaryPoint.value}${primaryPoint.unit ? ' ' + primaryPoint.unit : ''}` : undefined,
        dataSource: primaryPoint?.source
      };
    }
  }
  
  // Fallback: construct answer from available data points
  const allPoints = [...context.company, ...context.operational, ...context.calculated];
  
  if (allPoints.length === 0) {
    return {
      answer: 'Data not available. Please add relevant data to generate an answer for this question.'
    };
  }
  
  // Build descriptive answer from data points
  const relevantPoints = allPoints.slice(0, 5); // Limit to 5 most relevant
  const statements = relevantPoints
    .filter(p => p.value !== null && p.value !== undefined)
    .map(p => {
      if (typeof p.value === 'boolean') {
        return `${p.label}: ${p.value ? 'Yes' : 'No'}`;
      }
      const unitStr = p.unit ? ` ${p.unit}` : '';
      return `${p.label}: ${p.value}${unitStr}`;
    });
  
  if (statements.length === 0) {
    return {
      answer: 'Insufficient data available to answer this question comprehensively.'
    };
  }
  
  return {
    answer: statements.join('. ') + '.',
    dataValue: relevantPoints[0]?.value !== undefined 
      ? `${relevantPoints[0].value}${relevantPoints[0].unit ? ' ' + relevantPoints[0].unit : ''}`
      : undefined,
    dataSource: relevantPoints[0]?.source
  };
}

/**
 * Determine answer confidence based on data availability and quality
 */
function determineConfidence(
  context: DataContext,
  matchResult: MatchResult
): 'high' | 'medium' | 'low' | 'none' {
  const allPoints = [...context.company, ...context.operational, ...context.calculated];
  
  if (allPoints.length === 0) {
    return 'none';
  }
  
  // Check data quality
  const confidenceLevels = allPoints
    .map(p => p.confidence)
    .filter((c): c is 'high' | 'medium' | 'low' => c !== undefined);
  
  const hasHighConfidence = confidenceLevels.some(c => c === 'high');
  const hasMediumConfidence = confidenceLevels.some(c => c === 'medium');
  const hasDataGaps = context.metadata.dataGaps.length > 0;
  
  // Factor in match confidence
  if (matchResult.confidence === 'high' && hasHighConfidence && !hasDataGaps) {
    return 'high';
  }
  
  if (matchResult.confidence !== 'none' && (hasHighConfidence || hasMediumConfidence)) {
    return 'medium';
  }
  
  if (allPoints.length > 0) {
    return 'low';
  }
  
  return 'none';
}

/**
 * Generate answer draft for a single question
 */
export function generateAnswerDraft(
  question: ParsedQuestion,
  matchResult: MatchResult,
  dataContext: DataContext,
  _config: GenerationConfig
): AnswerDraft {
  // Generate the answer
  const { answer, dataValue, dataSource } = generateSimpleAnswer(dataContext, matchResult);
  
  // Determine confidence
  const answerConfidence = determineConfidence(dataContext, matchResult);
  
  // Build assumptions and limitations
  const assumptions: string[] = [];
  const limitations: string[] = [];
  
  if (dataContext.metadata.dataGaps.length > 0) {
    limitations.push(...dataContext.metadata.dataGaps);
  }
  
  // Check for estimates
  const hasEstimates = dataContext.calculated.some(p => 
    p.label.toLowerCase().includes('estimate') || p.confidence === 'low'
  );
  
  if (hasEstimates) {
    assumptions.push('Some values are estimates based on activity data and standard emission factors.');
  }
  
  // Build suggested evidence
  const suggestedEvidence = dataContext.operational
    .filter(p => p.source)
    .map(p => `${p.label}: ${p.source}`)
    .slice(0, 3);
  
  return {
    questionId: question.id,
    questionText: question.text,
    category: question.category,
    
    matchResult,
    dataContext,
    
    answer,
    dataValue,
    dataPeriod: dataContext.metadata.reportingPeriod,
    dataSource,
    
    answerConfidence,
    
    assumptions: assumptions.length > 0 ? assumptions : undefined,
    limitations: limitations.length > 0 ? limitations : undefined,
    suggestedEvidence: suggestedEvidence.length > 0 ? suggestedEvidence : undefined,
    
    needsReview: answerConfidence !== 'high',
    isEstimate: hasEstimates,
    hasDataGaps: dataContext.metadata.dataGaps.length > 0
  };
}

/**
 * Generate answer drafts for multiple questions
 */
export function generateAnswerDrafts(
  questions: ParsedQuestion[],
  matchResults: MatchResult[],
  dataContexts: DataContext[],
  config: GenerationConfig
): AnswerDraft[] {
  return questions.map((question, index) => {
    return generateAnswerDraft(
      question,
      matchResults[index],
      dataContexts[index],
      config
    );
  });
}

// ============================================
// LLM Integration (Preparation)
// ============================================

/**
 * Build prompt for LLM answer enhancement
 */
export function buildLLMPrompt(
  question: ParsedQuestion,
  dataContext: DataContext,
  config: GenerationConfig
): string {
  const dataPoints = [
    ...dataContext.company,
    ...dataContext.operational,
    ...dataContext.calculated
  ];
  
  const dataSection = dataPoints.length > 0
    ? dataPoints.map(p => `- ${p.label}: ${p.value}${p.unit ? ' ' + p.unit : ''}`).join('\n')
    : 'No relevant data available.';
  
  const verbosityInstruction = {
    concise: 'Provide a brief, direct answer (1-2 sentences).',
    standard: 'Provide a clear, professional answer (2-4 sentences).',
    detailed: 'Provide a comprehensive answer with context (3-6 sentences).'
  }[config.verbosity];
  
  return `You are helping a company respond to a sustainability questionnaire. Based on the available data, compose a professional response to the following question.

Question: ${question.text}
${question.category ? `Category: ${question.category}` : ''}

Available Data:
${dataSection}

${dataContext.metadata.reportingPeriod ? `Reporting Period: ${dataContext.metadata.reportingPeriod}` : ''}
${dataContext.metadata.sitesIncluded.length > 0 ? `Sites Covered: ${dataContext.metadata.sitesIncluded.join(', ')}` : ''}

Instructions:
- ${verbosityInstruction}
- Use the provided data values accurately.
- If data is incomplete, acknowledge limitations honestly.
- Write in first person plural (we, our).
- Do not make up data that is not provided.
${config.includeMethodology ? '- Include brief methodology notes where relevant.' : ''}
${config.includeAssumptions ? '- Note any assumptions made.' : ''}
${config.includeLimitations ? '- Acknowledge data limitations.' : ''}

Response:`;
}

/**
 * Parse LLM response into answer draft updates
 */
export function parseLLMResponse(
  response: string,
  _existingDraft: AnswerDraft
): Partial<AnswerDraft> {
  // For now, just update the answer text
  // In production, could parse structured response
  return {
    answer: response.trim()
  };
}
