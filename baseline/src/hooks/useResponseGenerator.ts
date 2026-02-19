// ============================================
// useResponseGenerator - Hook for response generation workflow
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import {
  parseQuestionFile,
  matchQuestions,
  retrieveDataForMatch,
  generateAnswerDraft,
  getMatchStatistics,
  type ParseResult,
  type ParsedQuestion,
  type MatchResult,
  type AnswerDraft,
  type GenerationConfig,
  type StoreData,
  type ResponseSession
} from '@/lib/respond';
import { v4 as uuid } from 'uuid';

export type WorkflowStep = 'idle' | 'parsing' | 'matching' | 'generating' | 'review' | 'complete';

interface UseResponseGeneratorReturn {
  // State
  step: WorkflowStep;
  isProcessing: boolean;
  error: string | null;
  progress: number;
  
  // Session data
  session: ResponseSession | null;
  parseResult: ParseResult | null;
  questions: ParsedQuestion[];
  matchResults: MatchResult[];
  answerDrafts: AnswerDraft[];
  
  // Statistics
  matchStats: ReturnType<typeof getMatchStatistics> | null;
  confidenceBreakdown: {
    high: number;
    medium: number;
    low: number;
    none: number;
  };
  
  // Actions
  startSession: (file: File, questionnaireName: string, requestor?: string) => Promise<void>;
  regenerateAnswer: (questionId: string) => void;
  updateAnswer: (questionId: string, updates: Partial<AnswerDraft>) => void;
  completeSession: () => void;
  resetSession: () => void;
  
  // Config
  config: GenerationConfig;
  setConfig: (config: Partial<GenerationConfig>) => void;
}

const DEFAULT_CONFIG: GenerationConfig = {
  useLLM: false,
  includeMethodology: true,
  includeAssumptions: true,
  includeLimitations: true,
  verbosity: 'standard',
  aggregateSites: true
};

export function useResponseGenerator(): UseResponseGeneratorReturn {
  // Stores
  const appStore = useAppStore();
  const dataStore = useDataStore();
  
  // Local state
  const [step, setStep] = useState<WorkflowStep>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const [session, setSession] = useState<ResponseSession | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [answerDrafts, setAnswerDrafts] = useState<AnswerDraft[]>([]);
  
  const [config, setConfigState] = useState<GenerationConfig>(DEFAULT_CONFIG);

  // Build store data snapshot for retrieval
  const storeData = useMemo((): StoreData => ({
    company: appStore.company,
    sites: appStore.sites,
    goals: appStore.goals,
    swot: appStore.swot,
    regulatoryContext: appStore.regulatoryContext,
    materials: dataStore.materials,
    materialInputs: dataStore.materialInputs,
    packaging: dataStore.packaging,
    packagingInputs: dataStore.packagingInputs,
    energyElectricity: dataStore.energyElectricity,
    energyFuels: dataStore.energyFuels,
    energyWater: dataStore.energyWater,
    assets: dataStore.assets,
    transportLogs: dataStore.transportLogs,
    workforce: dataStore.workforce,
    healthSafety: dataStore.healthSafety,
    training: dataStore.training,
    waste: dataStore.waste,
    productOutputs: dataStore.productOutputs,
    directEmissions: dataStore.directEmissions,
    effluents: dataStore.effluents,
    externalContext: dataStore.externalContext,
    financialContext: dataStore.financialContext,
    buyerRequirements: dataStore.buyerRequirements
  }), [appStore, dataStore]);

  // Computed statistics
  const matchStats = useMemo(() => {
    if (matchResults.length === 0) return null;
    return getMatchStatistics(matchResults);
  }, [matchResults]);

  const confidenceBreakdown = useMemo(() => {
    const breakdown = { high: 0, medium: 0, low: 0, none: 0 };
    answerDrafts.forEach(draft => {
      breakdown[draft.answerConfidence]++;
    });
    return breakdown;
  }, [answerDrafts]);

  // Actions
  const startSession = useCallback(async (
    file: File,
    questionnaireName: string,
    requestor?: string
  ) => {
    setError(null);
    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Parse file
      setStep('parsing');
      setProgress(10);
      
      const result = await parseQuestionFile(file);
      setParseResult(result);
      
      if (!result.success || result.questions.length === 0) {
        throw new Error(result.errors[0] || 'Failed to parse questionnaire');
      }
      
      setQuestions(result.questions);
      setProgress(30);

      // Step 2: Match questions to domains
      setStep('matching');
      const matches = matchQuestions(result.questions);
      setMatchResults(matches);
      setProgress(50);

      // Step 3: Generate answers
      setStep('generating');
      const drafts: AnswerDraft[] = [];
      
      for (let i = 0; i < result.questions.length; i++) {
        const question = result.questions[i];
        const match = matches[i];
        
        // Retrieve relevant data
        const dataContext = retrieveDataForMatch(match, storeData);
        
        // Generate answer draft
        const draft = generateAnswerDraft(question, match, dataContext, config);
        drafts.push(draft);
        
        // Update progress
        setProgress(50 + Math.round((i / result.questions.length) * 40));
      }
      
      setAnswerDrafts(drafts);
      setProgress(100);

      // Create session
      const newSession: ResponseSession = {
        id: uuid(),
        questionnaireName,
        requestor,
        framework: result.metadata.detectedFramework,
        parseResult: result,
        matchResults: matches,
        answerDrafts: drafts,
        status: 'review',
        progress: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSession(newSession);
      
      // Move to review
      setStep('review');

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      setStep('idle');
    } finally {
      setIsProcessing(false);
    }
  }, [storeData, config]);

  const regenerateAnswer = useCallback((questionId: string) => {
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return;

    const question = questions[questionIndex];
    const match = matchResults[questionIndex];
    
    // Re-retrieve data and regenerate
    const dataContext = retrieveDataForMatch(match, storeData);
    const newDraft = generateAnswerDraft(question, match, dataContext, config);

    setAnswerDrafts(prev => prev.map((draft, i) => 
      i === questionIndex ? newDraft : draft
    ));
  }, [questions, matchResults, storeData, config]);

  const updateAnswer = useCallback((questionId: string, updates: Partial<AnswerDraft>) => {
    setAnswerDrafts(prev => prev.map(draft => 
      draft.questionId === questionId 
        ? { ...draft, ...updates }
        : draft
    ));

    // Update session
    if (session) {
      setSession({
        ...session,
        updatedAt: new Date().toISOString()
      });
    }
  }, [session]);

  const completeSession = useCallback(() => {
    if (session) {
      setSession({
        ...session,
        status: 'complete',
        updatedAt: new Date().toISOString()
      });
    }
    setStep('complete');
  }, [session]);

  const resetSession = useCallback(() => {
    setStep('idle');
    setIsProcessing(false);
    setError(null);
    setProgress(0);
    setSession(null);
    setParseResult(null);
    setQuestions([]);
    setMatchResults([]);
    setAnswerDrafts([]);
  }, []);

  const setConfig = useCallback((updates: Partial<GenerationConfig>) => {
    setConfigState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    // State
    step,
    isProcessing,
    error,
    progress,
    
    // Session data
    session,
    parseResult,
    questions,
    matchResults,
    answerDrafts,
    
    // Statistics
    matchStats,
    confidenceBreakdown,
    
    // Actions
    startSession,
    regenerateAnswer,
    updateAnswer,
    completeSession,
    resetSession,
    
    // Config
    config,
    setConfig
  };
}
