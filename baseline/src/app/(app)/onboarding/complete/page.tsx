"use client";

import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, LayoutDashboard, Database } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';

export default function CompletePage() {
  const router = useRouter();
  const {
    company,
    sites,
    setIsOnboardingComplete,
    completeOnboardingStep,
  } = useAppStore();

  const handleGoToDashboard = () => {
    completeOnboardingStep(4);
    setIsOnboardingComplete(true);
    router.push('/dashboard');
  };

  const handleStartAddingData = () => {
    completeOnboardingStep(4);
    setIsOnboardingComplete(true);
    router.push('/data');
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-forest-700" />
        </div>
        <h1 className="text-3xl font-bold text-deep-forest mb-3">
          You're all set up!
        </h1>
        <p className="text-gray-600 text-lg">
          Your foundation is ready. Now let's build your baseline.
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Summary</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-forest-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-forest-700" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Company Profile</p>
              <p className="text-sm text-gray-500">
                {company?.tradingName || company?.legalEntityName}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-forest-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-forest-700" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Operational Site</p>
              <p className="text-sm text-gray-500">
                {sites[0]?.siteName} ({sites[0]?.city ? `${sites[0].city}, ` : ''}{sites[0]?.country})
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-forest-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-forest-700" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Strategic Reflection</p>
              <p className="text-sm text-gray-500">SWOT analysis captured</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-forest-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-forest-700" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Goals Defined</p>
              <p className="text-sm text-gray-500">Your success criteria are set</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6 bg-cream border-forest-300">
        <h2 className="text-lg font-semibold text-deep-forest mb-3">What's Next?</h2>
        <p className="text-gray-700 mb-4">
          Now it's time to build your operational baseline — the data that powers
          everything else. Start by tracking your energy consumption, materials,
          workforce, and outputs.
        </p>
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">Milestones ahead:</p>
          <ul className="space-y-1">
            <li>• <strong>25%</strong> — Basic Scope 3 responses available</li>
            <li>• <strong>50%</strong> — Core EcoVadis sections answerable</li>
            <li>• <strong>80%</strong> — VSME-ready baseline complete</li>
          </ul>
        </div>
      </Card>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
        <p className="text-sm text-gray-600 text-center">
          The average SME spends 14 hours rebuilding sustainability data for each
          new request. With your baseline, you'll respond in minutes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          onClick={handleGoToDashboard}
          className="flex-1"
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
        <Button onClick={handleStartAddingData} className="flex-1">
          <Database className="w-4 h-4 mr-2" />
          Start Adding Data
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
