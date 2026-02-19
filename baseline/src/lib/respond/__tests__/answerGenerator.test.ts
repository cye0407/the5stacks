import { generateAnswerDraft, buildLLMPrompt } from '@/lib/respond/answerGenerator';
import type { ParsedQuestion } from '@/lib/respond/questionParser';
import type { MatchResult } from '@/lib/respond/keywordMatcher';
import type { DataContext } from '@/lib/respond/dataRetrieval';

function makeQuestion(text: string): ParsedQuestion {
  return { id: 'q1', rowIndex: 0, text, rawRow: {} };
}

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

function emptyDataContext(): DataContext {
  return {
    company: [],
    operational: [],
    calculated: [],
    metadata: { sitesIncluded: [], dataGaps: [] },
  };
}

const defaultConfig = {
  useLLM: false,
  includeMethodology: false,
  includeAssumptions: false,
  includeLimitations: false,
  verbosity: 'standard' as const,
  aggregateSites: false,
};

describe('generateAnswerDraft', () => {
  it('generates answer indicating data not available when data is empty', () => {
    const draft = generateAnswerDraft(
      makeQuestion('What is your electricity consumption?'),
      makeMatchResult(),
      emptyDataContext(),
      defaultConfig,
    );
    expect(draft.answer.toLowerCase()).toContain('not available');
  });

  it('generates answer with operational data points', () => {
    const ctx = emptyDataContext();
    ctx.operational = [
      { domain: 'energy_electricity', field: 'totalElectricity', label: 'Total Electricity', value: 50000, unit: 'kWh', confidence: 'high' },
    ];
    const draft = generateAnswerDraft(
      makeQuestion('What is your electricity consumption?'),
      makeMatchResult({ primaryDomain: 'energy_electricity', confidence: 'high', matchedKeywords: ['electricity'] }),
      ctx,
      defaultConfig,
    );
    expect(draft.answer).toBeTruthy();
    expect(draft.answer).not.toContain('not available');
  });

  it('sets answerConfidence to none when no data', () => {
    const draft = generateAnswerDraft(
      makeQuestion('What is your electricity consumption?'),
      makeMatchResult(),
      emptyDataContext(),
      defaultConfig,
    );
    expect(draft.answerConfidence).toBe('none');
  });

  it('sets needsReview true when confidence is not high', () => {
    const ctx = emptyDataContext();
    ctx.operational = [
      { domain: 'energy_electricity', field: 'totalElectricity', label: 'Total Electricity', value: 50000, unit: 'kWh', confidence: 'medium' },
    ];
    const draft = generateAnswerDraft(
      makeQuestion('What is your electricity consumption?'),
      makeMatchResult({ primaryDomain: 'energy_electricity', confidence: 'medium', matchedKeywords: ['electricity'] }),
      ctx,
      defaultConfig,
    );
    expect(draft.needsReview).toBe(true);
  });

  it('reports data gaps from metadata', () => {
    const ctx = emptyDataContext();
    ctx.metadata.dataGaps = ['Missing Scope 2 emissions data'];
    const draft = generateAnswerDraft(
      makeQuestion('What are your emissions?'),
      makeMatchResult({ primaryDomain: 'emissions', confidence: 'low', matchedKeywords: ['emissions'] }),
      ctx,
      defaultConfig,
    );
    expect(draft.hasDataGaps).toBe(true);
  });

  it('uses template when matching electricity data exists', () => {
    const ctx = emptyDataContext();
    ctx.operational = [
      { domain: 'energy_electricity', field: 'totalElectricity', label: 'Total Electricity', value: 120000, unit: 'kWh', confidence: 'high' },
    ];
    const draft = generateAnswerDraft(
      makeQuestion('Total electricity consumed'),
      makeMatchResult({ primaryDomain: 'energy_electricity', confidence: 'high', matchedKeywords: ['electricity'], suggestedDataPoints: ['totalElectricity'] }),
      ctx,
      defaultConfig,
    );
    expect(draft.answer).toContain('120000');
  });
});

describe('buildLLMPrompt', () => {
  it('includes question text and data points in output', () => {
    const ctx = emptyDataContext();
    ctx.operational = [
      { domain: 'energy_electricity', field: 'totalElectricity', label: 'Total Electricity', value: 50000, unit: 'kWh' },
    ];
    const prompt = buildLLMPrompt(
      makeQuestion('What is your electricity consumption?'),
      ctx,
      defaultConfig,
    );
    expect(prompt).toContain('electricity consumption');
    expect(prompt).toContain('50000');
  });
});
