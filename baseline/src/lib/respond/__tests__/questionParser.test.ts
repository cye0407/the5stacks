import { parseQuestionsFromText, validateColumnMapping } from '@/lib/respond/questionParser';

describe('parseQuestionsFromText', () => {
  it('parses multiple lines into questions', () => {
    const text = 'What is your electricity usage?\nWhat are your emissions?';
    const questions = parseQuestionsFromText(text);
    expect(questions).toHaveLength(2);
    expect(questions[0].text).toBe('What is your electricity usage?');
    expect(questions[1].text).toBe('What are your emissions?');
  });

  it('skips empty lines', () => {
    const text = 'Question one\n\n\nQuestion two\n';
    const questions = parseQuestionsFromText(text);
    expect(questions).toHaveLength(2);
  });

  it('assigns sequential rowIndex', () => {
    const text = 'First\nSecond\nThird';
    const questions = parseQuestionsFromText(text);
    expect(questions[0].rowIndex).toBe(1);
    expect(questions[1].rowIndex).toBe(2);
    expect(questions[2].rowIndex).toBe(3);
  });

  it('trims whitespace', () => {
    const text = '  What is your energy usage?  \n  How many employees?  ';
    const questions = parseQuestionsFromText(text);
    expect(questions[0].text).toBe('What is your energy usage?');
    expect(questions[1].text).toBe('How many employees?');
  });
});

describe('validateColumnMapping', () => {
  const headers = ['Question', 'Category', 'Subcategory', 'Ref ID', 'Required'];

  it('valid when questionText column exists in headers', () => {
    const result = validateColumnMapping(headers, { questionText: 'Question' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('invalid when questionText is missing', () => {
    const result = validateColumnMapping(headers, {});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('invalid when specified column not in headers', () => {
    const result = validateColumnMapping(headers, { questionText: 'NonExistentColumn' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('valid with optional columns present', () => {
    const result = validateColumnMapping(headers, {
      questionText: 'Question',
      category: 'Category',
      subcategory: 'Subcategory',
      referenceId: 'Ref ID',
      required: 'Required',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
