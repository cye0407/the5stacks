// ============================================
// Response Generator - Main Exports
// ============================================

// Types
export * from './types';

// Question parsing
export { 
  parseQuestionFile, 
  parseQuestionsFromText,
  validateColumnMapping 
} from './questionParser';

// Keyword matching
export { 
  matchQuestion, 
  matchQuestions,
  getMatchStatistics 
} from './keywordMatcher';

// Data retrieval
export { 
  retrieveDataForMatch,
  type StoreData 
} from './dataRetrieval';

// Answer generation
export { 
  generateAnswerDraft,
  generateAnswerDrafts,
  buildLLMPrompt,
  parseLLMResponse
} from './answerGenerator';

// LLM Service
export {
  generateAnswerWithLLM,
  buildLLMRequest,
  checkLLMAvailability,
  type GenerateAnswerRequest,
  type GenerateAnswerResponse
} from './llmService';
