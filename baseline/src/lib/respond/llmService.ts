// ============================================
// LLM Service - Calls Supabase Edge Function for AI generation
// ============================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { DataContext, GenerationConfig } from './types';

export interface GenerateAnswerRequest {
  question: string;
  category?: string;
  dataPoints: Array<{
    label: string;
    value: string | number;
    unit?: string;
  }>;
  reportingPeriod?: string;
  sites?: string[];
  verbosity?: 'concise' | 'standard' | 'detailed';
  includeMethodology?: boolean;
  includeAssumptions?: boolean;
  includeLimitations?: boolean;
}

export interface GenerateAnswerResponse {
  success: boolean;
  answer?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Retry a function with exponential backoff.
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  isRetryable: (err: unknown) => boolean = () => true
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && isRetryable(err)) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof TypeError) return true; // network failure
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    return status >= 500;
  }
  return false;
}

/**
 * Call the generate-answer Edge Function with retry logic
 */
export async function generateAnswerWithLLM(
  request: GenerateAnswerRequest
): Promise<GenerateAnswerResponse> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase is not configured. Please set up your environment variables.',
    };
  }

  try {
    const { data, error } = await retryWithBackoff(
      () => supabase.functions.invoke('generate-answer', { body: request }),
      3,
      isRetryableError
    );

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to call generate-answer function',
      };
    }

    return data as GenerateAnswerResponse;

  } catch (err) {
    console.error('LLM service error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Build request from DataContext
 */
export function buildLLMRequest(
  questionText: string,
  category: string | undefined,
  dataContext: DataContext,
  config: GenerationConfig
): GenerateAnswerRequest {
  // Flatten all data points
  const allPoints = [
    ...dataContext.company,
    ...dataContext.operational,
    ...dataContext.calculated,
  ];

  const dataPoints = allPoints
    .filter(p => p.value !== null && p.value !== undefined)
    .map(p => ({
      label: p.label,
      value: p.value as string | number,
      unit: p.unit,
    }));

  return {
    question: questionText,
    category,
    dataPoints,
    reportingPeriod: dataContext.metadata.reportingPeriod,
    sites: dataContext.metadata.sitesIncluded,
    verbosity: config.verbosity,
    includeMethodology: config.includeMethodology,
    includeAssumptions: config.includeAssumptions,
    includeLimitations: config.includeLimitations,
  };
}

/**
 * Check if LLM service is available
 */
export async function checkLLMAvailability(): Promise<{
  available: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      available: false,
      message: 'Supabase not configured',
    };
  }

  try {
    // Quick health check - call with minimal data
    const { data: _data, error } = await supabase.functions.invoke('generate-answer', {
      body: {
        question: 'test',
        dataPoints: [],
      },
    });

    if (error) {
      return {
        available: false,
        message: error.message || 'Edge function not responding',
      };
    }

    return {
      available: true,
      message: 'LLM service available',
    };

  } catch (err) {
    return {
      available: false,
      message: 'Could not reach LLM service',
    };
  }
}
