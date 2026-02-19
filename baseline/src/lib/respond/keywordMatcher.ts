// ============================================
// Keyword Matcher - Map questions to data domains
// ============================================

import type { 
  ParsedQuestion, 
  MatchResult, 
  DataDomain, 
  TopicTag,
  KeywordRule 
} from './types';

// ============================================
// Keyword Rules Database
// ============================================

const KEYWORD_RULES: KeywordRule[] = [
  // ----------------------------------------
  // EMISSIONS & CLIMATE
  // ----------------------------------------
  {
    keywords: ['scope 1', 'scope1', 'direct emission', 'direct ghg', 'stationary combustion', 'mobile combustion', 'fugitive'],
    domain: 'emissions',
    topics: ['ghg_emissions', 'scope_1'],
    weight: 10
  },
  {
    keywords: ['scope 2', 'scope2', 'indirect emission', 'purchased electricity', 'purchased energy', 'market-based', 'location-based'],
    domain: 'energy_electricity',
    topics: ['ghg_emissions', 'scope_2'],
    weight: 10
  },
  {
    keywords: ['scope 3', 'scope3', 'value chain', 'upstream', 'downstream', 'business travel', 'employee commuting'],
    domain: 'transport',
    topics: ['ghg_emissions', 'scope_3'],
    weight: 10
  },
  {
    keywords: ['greenhouse gas', 'ghg', 'carbon emission', 'co2', 'carbon dioxide', 'tco2e', 'carbon footprint', 'climate change'],
    domain: 'emissions',
    topics: ['ghg_emissions', 'climate_targets'],
    weight: 8
  },
  {
    keywords: ['carbon neutral', 'net zero', 'net-zero', 'climate target', 'sbti', 'science based target', 'emission reduction target'],
    domain: 'goals',
    topics: ['climate_targets', 'ghg_emissions'],
    weight: 8
  },
  {
    keywords: ['refrigerant', 'hfc', 'f-gas', 'fluorinated'],
    domain: 'emissions',
    topics: ['ghg_emissions', 'scope_1'],
    weight: 9
  },

  // ----------------------------------------
  // ENERGY
  // ----------------------------------------
  {
    keywords: ['electricity', 'electric', 'kwh', 'kilowatt', 'power consumption', 'grid'],
    domain: 'energy_electricity',
    topics: ['energy_consumption'],
    weight: 9
  },
  {
    keywords: ['renewable', 'solar', 'wind', 'hydro', 'green energy', 'clean energy', 'ppa', 'power purchase agreement', 'green tariff'],
    domain: 'energy_electricity',
    topics: ['renewable_energy', 'energy_consumption'],
    weight: 9
  },
  {
    keywords: ['natural gas', 'fuel oil', 'diesel', 'petrol', 'gasoline', 'lpg', 'propane', 'heating oil', 'combustion'],
    domain: 'energy_fuel',
    topics: ['energy_consumption', 'scope_1'],
    weight: 9
  },
  {
    keywords: ['energy consumption', 'energy use', 'energy intensity', 'energy efficiency', 'energy management'],
    domain: 'energy_electricity',
    topics: ['energy_consumption'],
    weight: 7
  },

  // ----------------------------------------
  // WATER
  // ----------------------------------------
  {
    keywords: ['water consumption', 'water use', 'water withdrawal', 'water intake', 'water intensity'],
    domain: 'energy_water',
    topics: ['water_usage'],
    weight: 9
  },
  {
    keywords: ['wastewater', 'effluent', 'water discharge', 'water treatment', 'water pollution'],
    domain: 'effluents',
    topics: ['water_usage', 'pollution'],
    weight: 9
  },
  {
    keywords: ['water stress', 'water scarcity', 'water risk', 'water stewardship'],
    domain: 'energy_water',
    topics: ['water_usage'],
    weight: 7
  },

  // ----------------------------------------
  // WASTE & CIRCULAR
  // ----------------------------------------
  {
    keywords: ['waste', 'landfill', 'incineration', 'disposal'],
    domain: 'waste',
    topics: ['waste_management'],
    weight: 9
  },
  {
    keywords: ['recycling', 'recycle', 'recycled', 'diversion rate'],
    domain: 'waste',
    topics: ['waste_management', 'recycling', 'circular_economy'],
    weight: 9
  },
  {
    keywords: ['hazardous waste', 'hazardous material', 'dangerous goods', 'special waste'],
    domain: 'waste',
    topics: ['waste_management', 'pollution'],
    weight: 10
  },
  {
    keywords: ['circular economy', 'circularity', 'closed loop', 'take-back', 'reuse', 'refurbish'],
    domain: 'waste',
    topics: ['circular_economy', 'waste_management'],
    weight: 8
  },

  // ----------------------------------------
  // MATERIALS & SUPPLY CHAIN
  // ----------------------------------------
  {
    keywords: ['raw material', 'material consumption', 'material use', 'virgin material', 'primary material'],
    domain: 'materials',
    topics: ['materials'],
    weight: 9
  },
  {
    keywords: ['recycled content', 'recycled material', 'secondary material', 'post-consumer', 'pre-consumer'],
    domain: 'materials',
    topics: ['materials', 'circular_economy'],
    weight: 9
  },
  {
    keywords: ['packaging', 'package', 'packaging material', 'single-use', 'plastic packaging'],
    domain: 'packaging',
    topics: ['packaging', 'waste_management'],
    weight: 9
  },
  {
    keywords: ['supplier', 'supply chain', 'vendor', 'procurement', 'sourcing'],
    domain: 'materials',
    topics: ['supplier_management', 'supply_chain_social'],
    weight: 7
  },
  {
    keywords: ['supplier code of conduct', 'supplier assessment', 'supplier audit', 'supplier screening'],
    domain: 'buyer_requirements',
    topics: ['supplier_management', 'ethics'],
    weight: 8
  },

  // ----------------------------------------
  // TRANSPORT & LOGISTICS
  // ----------------------------------------
  {
    keywords: ['transport', 'transportation', 'logistics', 'shipping', 'freight', 'distribution'],
    domain: 'transport',
    topics: ['transport', 'logistics'],
    weight: 9
  },
  {
    keywords: ['fleet', 'vehicle', 'truck', 'delivery'],
    domain: 'transport',
    topics: ['transport', 'scope_1'],
    weight: 8
  },
  {
    keywords: ['tonne-km', 'tkm', 'ton-mile', 'transport emission'],
    domain: 'transport',
    topics: ['transport', 'ghg_emissions'],
    weight: 9
  },

  // ----------------------------------------
  // WORKFORCE & SOCIAL
  // ----------------------------------------
  {
    keywords: ['employee', 'headcount', 'fte', 'full-time equivalent', 'workforce', 'staff', 'personnel'],
    domain: 'workforce',
    topics: ['employee_count'],
    weight: 9
  },
  {
    keywords: ['diversity', 'gender', 'female', 'male', 'women', 'minority', 'inclusion', 'dei'],
    domain: 'workforce',
    topics: ['diversity', 'employee_count'],
    weight: 9
  },
  {
    keywords: ['trir', 'ltir', 'incident rate', 'recordable incident', 'lost time', 'injury', 'accident', 'fatality'],
    domain: 'health_safety',
    topics: ['health_safety'],
    weight: 10
  },
  {
    keywords: ['health and safety', 'health & safety', 'occupational health', 'workplace safety', 'ohs', 'ehs'],
    domain: 'health_safety',
    topics: ['health_safety'],
    weight: 9
  },
  {
    keywords: ['training', 'learning', 'development', 'skill', 'capacity building', 'training hours'],
    domain: 'training',
    topics: ['training'],
    weight: 9
  },
  {
    keywords: ['human rights', 'forced labor', 'child labor', 'modern slavery', 'labor rights'],
    domain: 'workforce',
    topics: ['human_rights', 'labor_practices'],
    weight: 9
  },
  {
    keywords: ['wage', 'compensation', 'living wage', 'fair pay', 'minimum wage'],
    domain: 'workforce',
    topics: ['labor_practices'],
    weight: 8
  },

  // ----------------------------------------
  // GOVERNANCE & COMPLIANCE
  // ----------------------------------------
  {
    keywords: ['certification', 'certified', 'iso', 'accreditation', 'standard'],
    domain: 'regulatory',
    topics: ['certifications', 'compliance'],
    weight: 8
  },
  {
    keywords: ['iso 14001', 'emas', 'environmental management'],
    domain: 'regulatory',
    topics: ['certifications', 'policies'],
    weight: 9
  },
  {
    keywords: ['iso 45001', 'ohsas', 'safety management'],
    domain: 'regulatory',
    topics: ['certifications', 'health_safety'],
    weight: 9
  },
  {
    keywords: ['policy', 'policies', 'commitment', 'statement'],
    domain: 'goals',
    topics: ['policies'],
    weight: 6
  },
  {
    keywords: ['compliance', 'regulation', 'regulatory', 'legal', 'law', 'legislation'],
    domain: 'regulatory',
    topics: ['compliance'],
    weight: 7
  },
  {
    keywords: ['csrd', 'esrs', 'eu taxonomy', 'taxonomy alignment'],
    domain: 'regulatory',
    topics: ['compliance', 'transparency'],
    weight: 9
  },
  {
    keywords: ['ethics', 'ethical', 'code of conduct', 'anti-corruption', 'bribery'],
    domain: 'goals',
    topics: ['ethics', 'policies'],
    weight: 7
  },
  {
    keywords: ['risk', 'risk assessment', 'risk management', 'material risk'],
    domain: 'swot',
    topics: ['risk_management'],
    weight: 7
  },

  // ----------------------------------------
  // COMPANY PROFILE & CONTEXT
  // ----------------------------------------
  {
    keywords: ['company', 'organization', 'business', 'enterprise', 'corporate'],
    domain: 'company',
    topics: ['company_profile'],
    weight: 5
  },
  {
    keywords: ['revenue', 'turnover', 'sales', 'financial'],
    domain: 'financial_context',
    topics: ['revenue'],
    weight: 8
  },
  {
    keywords: ['site', 'facility', 'location', 'plant', 'factory', 'office', 'premises'],
    domain: 'site',
    topics: ['facilities'],
    weight: 7
  },
  {
    keywords: ['floor area', 'square meter', 'building', 'real estate'],
    domain: 'infrastructure',
    topics: ['facilities'],
    weight: 8
  },
  {
    keywords: ['target', 'goal', 'objective', 'commitment', 'ambition'],
    domain: 'goals',
    topics: ['targets', 'strategy'],
    weight: 6
  },
  {
    keywords: ['product', 'service', 'output', 'production volume'],
    domain: 'products',
    topics: ['production'],
    weight: 7
  },

  // ----------------------------------------
  // EXTERNAL CONTEXT
  // ----------------------------------------
  {
    keywords: ['customer', 'client', 'buyer', 'market'],
    domain: 'external_context',
    topics: ['company_profile'],
    weight: 6
  },
  {
    keywords: ['ecovadis', 'cdp', 'questionnaire', 'assessment', 'rating'],
    domain: 'buyer_requirements',
    topics: ['compliance', 'transparency'],
    weight: 7
  }
];

// ============================================
// Text Processing Utilities
// ============================================

/**
 * Normalize text for matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')  // Remove special chars except hyphen
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim();
}

/**
 * Tokenize text into words and phrases
 */

/**
 * Check if text contains a keyword (with word boundary awareness)
 */
function containsKeyword(text: string, keyword: string): boolean {
  const normalized = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  
  // For multi-word keywords, check direct inclusion
  if (normalizedKeyword.includes(' ')) {
    return normalized.includes(normalizedKeyword);
  }
  
  // For single words, check word boundaries
  const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'i');
  return regex.test(normalized);
}

// ============================================
// Matching Logic
// ============================================

interface DomainScore {
  domain: DataDomain;
  score: number;
  topics: Set<TopicTag>;
  matchedKeywords: string[];
}

/**
 * Match a single question to data domains
 */
export function matchQuestion(question: ParsedQuestion): MatchResult {
  const text = `${question.text} ${question.category || ''} ${question.subcategory || ''}`;
  const domainScores = new Map<DataDomain, DomainScore>();

  // Score each rule against the question
  for (const rule of KEYWORD_RULES) {
    for (const keyword of rule.keywords) {
      if (containsKeyword(text, keyword)) {
        const existing = domainScores.get(rule.domain);
        
        if (existing) {
          existing.score += rule.weight;
          rule.topics.forEach(t => existing.topics.add(t));
          if (!existing.matchedKeywords.includes(keyword)) {
            existing.matchedKeywords.push(keyword);
          }
        } else {
          domainScores.set(rule.domain, {
            domain: rule.domain,
            score: rule.weight,
            topics: new Set(rule.topics),
            matchedKeywords: [keyword]
          });
        }
      }
    }
  }

  // Sort domains by score
  const sortedDomains = Array.from(domainScores.values())
    .sort((a, b) => b.score - a.score);

  // Determine confidence based on scores
  let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';
  if (sortedDomains.length > 0) {
    const topScore = sortedDomains[0].score;
    if (topScore >= 15) confidence = 'high';
    else if (topScore >= 8) confidence = 'medium';
    else confidence = 'low';
  }

  // Collect all matched topics
  const allTopics = new Set<TopicTag>();
  sortedDomains.forEach(d => d.topics.forEach(t => allTopics.add(t)));

  // Build suggested data points based on matched domains
  const suggestedDataPoints = generateDataPointSuggestions(
    sortedDomains.slice(0, 3).map(d => d.domain)
  );

  return {
    questionId: question.id,
    primaryDomain: sortedDomains[0]?.domain || null,
    secondaryDomains: sortedDomains.slice(1, 4).map(d => d.domain),
    topics: Array.from(allTopics),
    confidence,
    matchedKeywords: sortedDomains[0]?.matchedKeywords || [],
    suggestedDataPoints
  };
}

/**
 * Match multiple questions in batch
 */
export function matchQuestions(questions: ParsedQuestion[]): MatchResult[] {
  return questions.map(matchQuestion);
}

/**
 * Generate suggested data points for domains
 */
function generateDataPointSuggestions(domains: DataDomain[]): string[] {
  const suggestions: string[] = [];

  const domainSuggestions: Record<DataDomain, string[]> = {
    company: ['Company name', 'Industry', 'Number of employees', 'Revenue band'],
    site: ['Site locations', 'Floor area', 'Site types'],
    goals: ['Sustainability goals', 'Target timelines', 'Primary motivation'],
    swot: ['Strengths', 'Opportunities', 'Risk areas'],
    regulatory: ['Certifications held', 'CSRD applicability', 'Compliance frameworks'],
    materials: ['Material consumption by type', 'Recycled content %', 'Supplier origins'],
    packaging: ['Packaging types', 'Packaging weight', 'Recyclability'],
    energy_electricity: ['Electricity consumption (kWh)', 'Renewable %', 'Green tariff status'],
    energy_fuel: ['Fuel consumption by type', 'Heating fuel use'],
    energy_water: ['Water withdrawal (m³)', 'Water sources'],
    emissions: ['Scope 1 emissions (tCO2e)', 'Refrigerant usage', 'Direct emissions'],
    infrastructure: ['Floor area (m²)', 'Building age', 'Major equipment'],
    transport: ['Transport modes', 'Distance/tkm', 'Fleet composition'],
    workforce: ['Total FTE', 'Gender breakdown', 'Contract types'],
    health_safety: ['TRIR', 'LTIR', 'Fatalities', 'Near misses'],
    training: ['Training hours per employee', 'Safety training', 'Sustainability training'],
    waste: ['Waste by category', 'Diversion rate', 'Hazardous waste'],
    products: ['Production volumes', 'Product types'],
    effluents: ['Wastewater discharge', 'Treatment level'],
    external_context: ['Market scope', 'Customer types', 'Competitive pressure'],
    financial_context: ['Revenue band', 'Sustainability budget', 'Investment capacity'],
    buyer_requirements: ['Active questionnaires', 'Customer requirements']
  };

  for (const domain of domains) {
    const domainSuggs = domainSuggestions[domain] || [];
    suggestions.push(...domainSuggs.slice(0, 3));
  }

  return [...new Set(suggestions)].slice(0, 6);
}

/**
 * Get match statistics for a set of results
 */
export function getMatchStatistics(results: MatchResult[]): {
  total: number;
  byConfidence: Record<string, number>;
  byDomain: Record<string, number>;
  unmatchedCount: number;
} {
  const byConfidence: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0,
    none: 0
  };

  const byDomain: Record<string, number> = {};

  for (const result of results) {
    byConfidence[result.confidence]++;
    
    if (result.primaryDomain) {
      byDomain[result.primaryDomain] = (byDomain[result.primaryDomain] || 0) + 1;
    }
  }

  return {
    total: results.length,
    byConfidence,
    byDomain,
    unmatchedCount: byConfidence.none
  };
}
