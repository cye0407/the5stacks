"use client";

import { useState } from 'react';
import {
  DownloadSimple,
  Check,
  CaretDown,
  CaretUp,
  ArrowsClockwise,
  Warning,
  Database,
  Sparkle,
  Info
} from '@phosphor-icons/react';
import {
  Card,
  CardTitle,
  Button,
  Badge,
  Input,
  TextArea,
  FileUpload,
  ProgressBar,
} from '@/components/ui';
import { useResponseGenerator } from '@/hooks';
import { cn } from '@/lib/utils/cn';
import type { AnswerDraft } from '@/lib/respond';

export default function ResponseGeneratorPage() {
  const {
    step,
    isProcessing,
    error,
    progress,
    parseResult,
    answerDrafts,
    confidenceBreakdown,
    matchStats,
    startSession,
    updateAnswer,
    regenerateAnswer,
    completeSession,
    resetSession
  } = useResponseGenerator();

  const [questionnaireName, setQuestionnaireName] = useState('');
  const [requestor, setRequestor] = useState('');
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

  const handleFileUpload = async (file: File) => {
    await startSession(file, questionnaireName || file.name.replace(/\.[^.]+$/, ''), requestor);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAnswers(newExpanded);
  };

  const handleExport = () => {
    const exportData = answerDrafts.map((a) => ({
      Question: a.questionText,
      Category: a.category || '',
      Answer: a.answer,
      DataValue: a.dataValue || '',
      DataSource: a.dataSource || '',
      Confidence: a.answerConfidence,
      NeedsReview: a.needsReview ? 'Yes' : 'No',
      Limitations: a.limitations?.join('; ') || ''
    }));

    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${questionnaireName || 'questionnaire'}_responses.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const confidenceColors = {
    high: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-orange-100 text-orange-700 border-orange-200',
    none: 'bg-red-100 text-red-700 border-red-200',
  };

  const confidenceLabels = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
    none: 'No data',
  };

  return (
    <div className="animate-fade-in">
      {/* Coming Soon Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0" weight="duotone" />
        <div>
          <p className="font-medium text-amber-800">Coming Soon</p>
          <p className="text-sm text-amber-700">
            The Response Generator is under development. You can explore the interface below, but answer generation is not yet available.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Response Generator</h1>
        <p className="text-gray-500">
          Draft answers from your tracked data. (Coming soon)
        </p>
      </div>

      {/* Error display */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <Warning className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" weight="duotone" />
            <div>
              <p className="font-medium text-red-800">Error processing file</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Step: Upload */}
      {(step === 'idle' || step === 'parsing') && (
        <div className="max-w-2xl mx-auto opacity-60 pointer-events-none">
          <Card className="mb-6">
            <CardTitle className="mb-4">Upload Questionnaire</CardTitle>

            <div className="space-y-4">
              <Input
                label="Questionnaire Name"
                value={questionnaireName}
                onChange={(e) => setQuestionnaireName(e.target.value)}
                placeholder="e.g., EcoVadis 2024, CDP Climate"
              />
              <Input
                label="Requestor (Optional)"
                value={requestor}
                onChange={(e) => setRequestor(e.target.value)}
                placeholder="e.g., Customer name, Platform"
              />

              <FileUpload
                label="Upload File"
                accept=".xlsx,.xls,.csv"
                onFileSelect={handleFileUpload}
                hint="Supports Excel (.xlsx, .xls) and CSV files"
              />

              {isProcessing && (
                <div className="py-6">
                  <ProgressBar
                    value={progress}
                    className="mb-3"
                  />
                  <p className="text-sm text-gray-600 text-center">
                    {(step as string) === 'parsing' && 'Parsing questionnaire...'}
                    {(step as string) === 'matching' && 'Matching questions to data domains...'}
                    {(step as string) === 'generating' && 'Generating answers...'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-cream">
            <CardTitle className="text-primary mb-3">How it works</CardTitle>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-forest-700 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Upload & Parse</p>
                  <p className="text-gray-600">
                    Upload an Excel or CSV file. We'll detect question columns automatically.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-forest-700 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Match & Retrieve</p>
                  <p className="text-gray-600">
                    Questions are matched to your operational data using keyword analysis.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-forest-700 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Generate & Review</p>
                  <p className="text-gray-600">
                    Draft answers are generated from your data. Review, edit, and export.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Processing indicator */}
      {(step === 'matching' || step === 'generating') && (
        <div className="max-w-md mx-auto">
          <Card className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-700 mx-auto mb-6" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {step === 'matching' ? 'Analyzing Questions' : 'Generating Answers'}
            </h2>
            <p className="text-gray-600 mb-4">
              {step === 'matching'
                ? 'Matching questions to your data domains...'
                : 'Composing answers from your operational data...'}
            </p>
            <ProgressBar value={progress} />
          </Card>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div>
          {/* Summary Bar */}
          <Card className="mb-6 bg-cream">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {parseResult?.metadata.fileName || questionnaireName || 'Questionnaire'}
                </h2>
                <p className="text-sm text-gray-500">
                  {answerDrafts.length} questions analyzed
                  {parseResult?.metadata.detectedFramework && (
                    <span className="ml-2">
                      • Detected framework: <strong>{parseResult.metadata.detectedFramework}</strong>
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Confidence breakdown */}
                <div className="flex gap-1">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                    {confidenceBreakdown.high} high
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                    {confidenceBreakdown.medium} medium
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                    {confidenceBreakdown.low} low
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                    {confidenceBreakdown.none} no data
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetSession}>
                    Start Over
                  </Button>
                  <Button variant="outline" onClick={handleExport}>
                    <DownloadSimple className="w-4 h-4 mr-2" weight="duotone" />
                    Export
                  </Button>
                  <Button onClick={completeSession}>
                    <Check className="w-4 h-4 mr-2" weight="bold" />
                    Complete
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Match statistics */}
          {matchStats && (
            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-primary" weight="duotone" />
                <CardTitle className="text-sm">Data Coverage</CardTitle>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {Object.entries(matchStats.byDomain)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([domain, count]) => (
                    <div key={domain} className="flex justify-between">
                      <span className="text-gray-600 capitalize">
                        {domain.replace('_', ' ')}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Answers List */}
          <div className="space-y-4">
            {answerDrafts.map((draft, index) => (
              <AnswerCard
                key={draft.questionId}
                draft={draft}
                index={index}
                isExpanded={expandedAnswers.has(draft.questionId)}
                onToggleExpand={() => toggleExpand(draft.questionId)}
                onUpdate={(updates) => updateAnswer(draft.questionId, updates)}
                onRegenerate={() => regenerateAnswer(draft.questionId)}
                confidenceColors={confidenceColors}
                confidenceLabels={confidenceLabels}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-700" weight="bold" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Responses Complete!</h2>
          <p className="text-gray-600 mb-8">
            Your questionnaire responses have been generated. Export them or start a new questionnaire.
          </p>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => { /* go back to review */ }}>
              Back to Review
            </Button>
            <Button onClick={handleExport}>
              <DownloadSimple className="w-4 h-4 mr-2" weight="duotone" />
              Export Responses
            </Button>
          </div>

          <div className="mt-8">
            <Button variant="ghost" onClick={resetSession}>
              Start New Questionnaire
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Answer Card Component
// ============================================

interface AnswerCardProps {
  draft: AnswerDraft;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<AnswerDraft>) => void;
  onRegenerate: () => void;
  confidenceColors: Record<string, string>;
  confidenceLabels: Record<string, string>;
}

function AnswerCard({
  draft,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRegenerate,
  confidenceColors,
  confidenceLabels
}: AnswerCardProps) {
  return (
    <Card
      className={cn(
        'transition-all',
        draft.needsReview && 'border-l-4 border-l-amber-400'
      )}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
            {draft.category && <Badge variant="info">{draft.category}</Badge>}
            <span
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                confidenceColors[draft.answerConfidence]
              )}
            >
              {confidenceLabels[draft.answerConfidence]}
            </span>
            {draft.isEstimate && (
              <span className="text-xs text-orange-600 flex items-center gap-1">
                <Warning className="w-3 h-3" weight="fill" />
                Estimated
              </span>
            )}
            {draft.matchResult.primaryDomain && (
              <span className="text-xs text-gray-400">
                → {draft.matchResult.primaryDomain.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="font-medium text-gray-900">{draft.questionText}</p>
          {!isExpanded && draft.answer && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{draft.answer}</p>
          )}
        </div>
        <div className="ml-4 flex items-center gap-2">
          {isExpanded ? (
            <CaretUp className="w-5 h-5 text-gray-400" weight="bold" />
          ) : (
            <CaretDown className="w-5 h-5 text-gray-400" weight="bold" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* Matched keywords */}
          {draft.matchResult.matchedKeywords.length > 0 && (
            <div className="flex items-start gap-2 text-xs">
              <Sparkle className="w-3 h-3 text-primary mt-0.5" weight="duotone" />
              <div>
                <span className="text-gray-500">Matched: </span>
                <span className="text-forest-700">
                  {draft.matchResult.matchedKeywords.join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Answer text */}
          <TextArea
            label="Answer"
            value={draft.answer}
            onChange={(e) => onUpdate({ answer: e.target.value })}
            rows={4}
          />

          {/* Data details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Data Value"
              value={draft.dataValue || ''}
              onChange={(e) => onUpdate({ dataValue: e.target.value })}
              placeholder="e.g., 1,234 tCO2e"
            />
            <Input
              label="Data Source"
              value={draft.dataSource || ''}
              onChange={(e) => onUpdate({ dataSource: e.target.value })}
              placeholder="e.g., Energy bills 2024"
            />
            <Input
              label="Period"
              value={draft.dataPeriod || ''}
              onChange={(e) => onUpdate({ dataPeriod: e.target.value })}
              placeholder="e.g., 2024-01 to 2024-12"
            />
          </div>

          {/* Limitations */}
          {draft.limitations && draft.limitations.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
                <Info className="w-4 h-4" weight="duotone" />
                Data Limitations
              </div>
              <ul className="list-disc list-inside text-amber-700 space-y-1">
                {draft.limitations.map((limitation, i) => (
                  <li key={i}>{limitation}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Available data points */}
          {(draft.dataContext.operational.length > 0 || draft.dataContext.company.length > 0) && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <Database className="w-4 h-4" weight="duotone" />
                Available Data Points
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[...draft.dataContext.company, ...draft.dataContext.operational]
                  .slice(0, 6)
                  .map((point, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-500">{point.label}</span>
                      <span className="font-medium">
                        {point.value}
                        {point.unit && ` ${point.unit}`}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onRegenerate}>
              <ArrowsClockwise className="w-4 h-4 mr-1" weight="duotone" />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
