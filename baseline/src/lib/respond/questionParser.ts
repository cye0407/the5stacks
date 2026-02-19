// ============================================
// Question Parser - xlsx/csv file parsing
// ============================================

import * as XLSX from 'xlsx';
import { v4 as uuid } from 'uuid';
import type { ParsedQuestion, ParseResult, ColumnMapping } from './types';

// Common column name variations for auto-detection
const COLUMN_PATTERNS = {
  questionText: [
    'question', 'questions', 'query', 'text', 'description',
    'indicator', 'metric', 'requirement', 'disclosure',
    'question text', 'question_text', 'questiontext',
    'ask', 'item', 'criteria', 'criterion'
  ],
  category: [
    'category', 'topic', 'theme', 'section', 'pillar',
    'area', 'domain', 'group', 'type', 'classification'
  ],
  subcategory: [
    'subcategory', 'sub-category', 'sub_category', 'subtopic',
    'sub-topic', 'sub_topic', 'subsection', 'sub-section'
  ],
  referenceId: [
    'id', 'ref', 'reference', 'code', 'number', 'ref_id',
    'question_id', 'indicator_id', 'disclosure_id',
    'gri', 'esrs', 'sasb', 'cdp'
  ],
  required: [
    'required', 'mandatory', 'optional', 'must', 'shall'
  ]
};

// Framework detection patterns
const FRAMEWORK_PATTERNS: Record<string, RegExp[]> = {
  CSRD: [/csrd/i, /esrs/i, /e1\./i, /s1\./i, /g1\./i],
  GRI: [/gri\s?\d{3}/i, /gri-/i],
  CDP: [/cdp/i, /c\d+\.\d+/i],
  EcoVadis: [/ecovadis/i, /ev-/i],
  SASB: [/sasb/i],
  TCFD: [/tcfd/i],
  UN_SDG: [/sdg/i, /un sdg/i]
};

/**
 * Auto-detect column mapping from headers
 */
function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    questionText: ''
  };

  const normalizedHeaders = headers.map(h => h?.toLowerCase().trim() || '');

  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const header = normalizedHeaders[i];
      if (patterns.some(p => header.includes(p) || header === p)) {
        (mapping as unknown as Record<string, string>)[field] = headers[i];
        break;
      }
    }
  }

  // Fallback: if no question column found, use first text-heavy column
  if (!mapping.questionText && headers.length > 0) {
    mapping.questionText = headers[0];
  }

  return mapping;
}

/**
 * Detect framework from content
 */
function detectFramework(questions: ParsedQuestion[]): string | undefined {
  const allText = questions
    .map(q => `${q.text} ${q.category || ''} ${q.referenceId || ''}`)
    .join(' ');

  for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
    if (patterns.some(p => p.test(allText))) {
      return framework;
    }
  }

  return undefined;
}

/**
 * Parse a value that might indicate "required"
 */
function parseRequired(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  
  const str = String(value).toLowerCase().trim();
  if (['yes', 'y', 'true', '1', 'required', 'mandatory'].includes(str)) return true;
  if (['no', 'n', 'false', '0', 'optional'].includes(str)) return false;
  
  return undefined;
}

/**
 * Parse Excel or CSV file into structured questions
 */
export async function parseQuestionFile(file: File): Promise<ParseResult> {
  const errors: string[] = [];
  const questions: ParsedQuestion[] = [];

  try {
    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        questions: [],
        errors: ['No sheets found in file'],
        metadata: {
          fileName: file.name,
          totalRows: 0,
          parsedRows: 0,
          columnMapping: { questionText: '' }
        }
      };
    }

    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { 
      defval: '',
      raw: false 
    });

    if (jsonData.length === 0) {
      return {
        success: false,
        questions: [],
        errors: ['No data rows found in file'],
        metadata: {
          fileName: file.name,
          totalRows: 0,
          parsedRows: 0,
          columnMapping: { questionText: '' }
        }
      };
    }

    // Get headers from first row keys
    const headers = Object.keys(jsonData[0]);
    const columnMapping = detectColumnMapping(headers);

    if (!columnMapping.questionText) {
      return {
        success: false,
        questions: [],
        errors: ['Could not identify question column. Please ensure your file has a "Question" or similar column.'],
        metadata: {
          fileName: file.name,
          totalRows: jsonData.length,
          parsedRows: 0,
          columnMapping
        }
      };
    }

    // Parse each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const questionText = String(row[columnMapping.questionText] || '').trim();

      // Skip empty rows
      if (!questionText) {
        continue;
      }

      // Skip header-like rows (common in questionnaires)
      if (questionText.length < 10 && !questionText.includes('?')) {
        // Might be a section header, skip
        continue;
      }

      const question: ParsedQuestion = {
        id: uuid(),
        rowIndex: i + 2, // +2 for 1-indexed + header row
        text: questionText,
        rawRow: row
      };

      // Map optional fields
      if (columnMapping.category) {
        question.category = String(row[columnMapping.category] || '').trim() || undefined;
      }
      if (columnMapping.subcategory) {
        question.subcategory = String(row[columnMapping.subcategory] || '').trim() || undefined;
      }
      if (columnMapping.referenceId) {
        question.referenceId = String(row[columnMapping.referenceId] || '').trim() || undefined;
      }
      if (columnMapping.required) {
        question.required = parseRequired(row[columnMapping.required]);
      }

      questions.push(question);
    }

    // Detect framework
    const detectedFramework = detectFramework(questions);
    if (detectedFramework) {
      questions.forEach(q => {
        q.framework = detectedFramework;
      });
    }

    return {
      success: true,
      questions,
      errors,
      metadata: {
        fileName: file.name,
        totalRows: jsonData.length,
        parsedRows: questions.length,
        detectedFramework,
        columnMapping
      }
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error parsing file';
    return {
      success: false,
      questions: [],
      errors: [message],
      metadata: {
        fileName: file.name,
        totalRows: 0,
        parsedRows: 0,
        columnMapping: { questionText: '' }
      }
    };
  }
}

/**
 * Parse questions from plain text (one per line)
 */
export function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  return lines.map((line, index) => ({
    id: uuid(),
    rowIndex: index + 1,
    text: line.trim(),
    rawRow: { text: line }
  }));
}

/**
 * Validate column mapping manually provided by user
 */
export function validateColumnMapping(
  headers: string[],
  mapping: Partial<ColumnMapping>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!mapping.questionText) {
    errors.push('Question text column is required');
  } else if (!headers.includes(mapping.questionText)) {
    errors.push(`Column "${mapping.questionText}" not found in file`);
  }

  // Check optional columns exist if specified
  for (const [field, column] of Object.entries(mapping)) {
    if (column && !headers.includes(column)) {
      errors.push(`Column "${column}" for ${field} not found in file`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
