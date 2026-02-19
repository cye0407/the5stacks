import { matchQuestion, matchQuestions, getMatchStatistics } from '@/lib/respond/keywordMatcher';
import type { ParsedQuestion } from '@/lib/respond/questionParser';

function makeQuestion(text: string, overrides: Partial<ParsedQuestion> = {}): ParsedQuestion {
  return {
    id: overrides.id ?? 'q1',
    rowIndex: overrides.rowIndex ?? 0,
    text,
    rawRow: {},
    ...overrides,
  };
}

describe('matchQuestion', () => {
  it('maps energy questions to energy_electricity domain', () => {
    const result = matchQuestion(makeQuestion('What is your total electricity consumption?'));
    expect(result.primaryDomain).toBe('energy_electricity');
    expect(result.confidence).not.toBe('none');
  });

  it('maps GHG/emissions questions to emissions domain', () => {
    const result = matchQuestion(makeQuestion('Report your Scope 1 greenhouse gas emissions'));
    expect(result.primaryDomain).toBe('emissions');
    expect(result.confidence).not.toBe('none');
  });

  it('maps workforce questions to workforce domain', () => {
    const result = matchQuestion(makeQuestion('What is the total headcount and FTE of your workforce?'));
    expect(result.primaryDomain).toBe('workforce');
  });

  it('maps waste questions to waste domain', () => {
    const result = matchQuestion(makeQuestion('What is your total waste generated and recycled?'));
    expect(result.primaryDomain).toBe('waste');
  });

  it('returns confidence none for unrelated text', () => {
    const result = matchQuestion(makeQuestion('What is the meaning of life?'));
    expect(result.confidence).toBe('none');
    expect(result.matchedKeywords).toHaveLength(0);
  });

  it('increases confidence with multiple keyword matches', () => {
    const single = matchQuestion(makeQuestion('electricity'));
    const multiple = matchQuestion(makeQuestion('total electricity consumption energy usage in kWh'));

    const confidenceRank = { none: 0, low: 1, medium: 2, high: 3 };
    expect(confidenceRank[multiple.confidence]).toBeGreaterThanOrEqual(confidenceRank[single.confidence]);
    expect(multiple.matchedKeywords.length).toBeGreaterThanOrEqual(single.matchedKeywords.length);
  });

  it('uses category text to contribute to matching', () => {
    const withoutCategory = matchQuestion(makeQuestion('What is the total?'));
    const withCategory = matchQuestion(makeQuestion('What is the total?', { category: 'Energy' }));

    const confidenceRank = { none: 0, low: 1, medium: 2, high: 3 };
    expect(confidenceRank[withCategory.confidence]).toBeGreaterThanOrEqual(confidenceRank[withoutCategory.confidence]);
  });
});

describe('matchQuestions', () => {
  it('processes arrays correctly', () => {
    const questions = [
      makeQuestion('Electricity consumption', { id: 'q1', rowIndex: 0 }),
      makeQuestion('GHG emissions', { id: 'q2', rowIndex: 1 }),
      makeQuestion('Random unrelated text', { id: 'q3', rowIndex: 2 }),
    ];
    const results = matchQuestions(questions);
    expect(results).toHaveLength(3);
    expect(results[0].questionId).toBe('q1');
    expect(results[1].questionId).toBe('q2');
    expect(results[2].questionId).toBe('q3');
  });
});

describe('getMatchStatistics', () => {
  it('aggregates results correctly', () => {
    const questions = [
      makeQuestion('Electricity consumption', { id: 'q1', rowIndex: 0 }),
      makeQuestion('GHG emissions', { id: 'q2', rowIndex: 1 }),
      makeQuestion('Unrelated gibberish xyzzy', { id: 'q3', rowIndex: 2 }),
    ];
    const results = matchQuestions(questions);
    const stats = getMatchStatistics(results);

    expect(stats.total).toBe(3);
    expect(typeof stats.unmatchedCount).toBe('number');
    expect(stats.unmatchedCount).toBeGreaterThanOrEqual(1);
    expect(stats.byConfidence).toBeDefined();
    expect(stats.byDomain).toBeDefined();
  });
});
