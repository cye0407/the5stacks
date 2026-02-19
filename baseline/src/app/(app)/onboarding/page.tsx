"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Clock } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';

export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAssessment = searchParams.get('from') === 'assessment';
  const stack = searchParams.get('stack');
  const setOnboardingStep = useAppStore((state) => state.setOnboardingStep);
  const company = useAppStore((state) => state.company);
  const isOnboardingComplete = useAppStore((state) => state.isOnboardingComplete);

  // Already completed onboarding — go to dashboard
  useEffect(() => {
    if (company && isOnboardingComplete) {
      router.replace('/dashboard');
    }
  }, [company, isOnboardingComplete, router]);

  const handleStart = () => {
    setOnboardingStep(0);
    router.push('/onboarding/company');
  };

  return (
    <div className="animate-fade-in">
      {fromAssessment && stack && (
        <div className="bg-forest-50 border border-forest-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-forest-800 font-medium">
            Your Stack {stack} assessment is complete. Let&apos;s set up your tracker to start collecting baseline data.
          </p>
        </div>
      )}

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-forest-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">5S</span>
        </div>
        <h1 className="text-3xl font-bold text-deep-forest mb-3">
          Let's get you started
        </h1>
        <p className="text-gray-600 text-lg">
          Tell us about your company so we can tailor your tracker.
        </p>
      </div>

      <Card className="mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-forest-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Estimated time: Under 2 minutes
            </h3>
            <p className="text-sm text-gray-600">
              You can save your progress and return anytime.
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">
          We just need some basic company info &mdash; industry, location, and size.
          Everything else you can do from your dashboard.
        </p>
      </Card>

      <Button onClick={handleStart} className="w-full" size="lg">
        Get Started
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}
