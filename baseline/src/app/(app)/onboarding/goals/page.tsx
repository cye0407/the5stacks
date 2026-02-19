"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { Button, Select, TextArea, Card } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { goalsSchema, validateForm } from '@/lib/validation/schemas';
import type { Goals, TimeHorizon, PrimaryMotivation } from '@/types';
import { cn } from '@/lib/utils/cn';

const timeHorizonOptions = [
  { value: '1-year', label: '1 year' },
  { value: '2-3-years', label: '2-3 years' },
  { value: '5-years', label: '5+ years' },
];

const motivationOptions: { value: PrimaryMotivation; label: string; description: string }[] = [
  { value: 'compliance', label: 'Compliance', description: 'We need to meet requirements' },
  { value: 'cost', label: 'Cost Reduction', description: 'We need to reduce costs / improve margins' },
  { value: 'customers', label: 'Customer Demand', description: 'Our customers are asking for this' },
  { value: 'values', label: 'Values', description: "It's the right thing to do" },
  { value: 'competitive', label: 'Competitive Advantage', description: 'We want advantage over competitors' },
  { value: 'financing', label: 'Financing', description: 'Banks/investors are requiring this' },
  { value: 'risk', label: 'Risk Management', description: 'We need to reduce exposure' },
];

export default function GoalsSetupPage() {
  const router = useRouter();
  const { company, setGoals, completeOnboardingStep } = useAppStore();

  const [formData, setFormData] = useState({
    primaryGoal: '',
    timeHorizon: '' as TimeHorizon | '',
    primaryMotivation: '' as PrimaryMotivation | '',
    secondaryMotivations: [] as PrimaryMotivation[],
    successDefinition: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | PrimaryMotivation[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const toggleSecondaryMotivation = (motivation: PrimaryMotivation) => {
    if (motivation === formData.primaryMotivation) return;

    const current = formData.secondaryMotivations;
    const updated = current.includes(motivation)
      ? current.filter((m) => m !== motivation)
      : [...current, motivation];
    handleChange('secondaryMotivations', updated);
  };

  const validate = () => {
    const result = validateForm(goalsSchema, formData);
    if (result) {
      setErrors(result);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const goals: Goals = {
      id: uuid(),
      companyId: company?.id || '',
      primaryGoal: formData.primaryGoal,
      timeHorizon: formData.timeHorizon as TimeHorizon,
      primaryMotivation: formData.primaryMotivation as PrimaryMotivation,
      secondaryMotivations: formData.secondaryMotivations.length > 0
        ? formData.secondaryMotivations
        : undefined,
      successDefinition: formData.successDefinition,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setGoals(goals);
    completeOnboardingStep(3);
    router.push('/dashboard');
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-deep-forest mb-2">Your Goals</h1>
        <p className="text-gray-600">
          What does winning look like for you?
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Primary Goal</h2>

          <div className="space-y-4">
            <TextArea
              label="What's your primary sustainability goal? *"
              value={formData.primaryGoal}
              onChange={(e) => handleChange('primaryGoal', e.target.value)}
              placeholder="In your own words, what are you trying to achieve?"
              rows={3}
              error={errors.primaryGoal}
            />

            <Select
              label="Time Horizon *"
              value={formData.timeHorizon}
              onChange={(e) => handleChange('timeHorizon', e.target.value)}
              options={timeHorizonOptions}
              placeholder="When do you want to achieve this?"
              error={errors.timeHorizon}
            />
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Primary Motivation</h2>
          <p className="text-sm text-gray-600 mb-4">
            What's driving this? Click to select your primary reason.
          </p>

          {errors.primaryMotivation && (
            <p className="text-sm text-error mb-3">{errors.primaryMotivation}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {motivationOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange('primaryMotivation', option.value)}
                className={cn(
                  'text-left p-3 rounded-lg border-2 transition-all',
                  formData.primaryMotivation === option.value
                    ? 'border-forest-700 bg-forest-100'
                    : 'border-gray-200 hover:border-forest-300'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{option.label}</span>
                  {formData.primaryMotivation === option.value && (
                    <Check className="w-4 h-4 text-forest-700" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{option.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {formData.primaryMotivation && (
          <Card className="mb-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Secondary Motivations</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are there other factors? (Optional)
            </p>

            <div className="flex flex-wrap gap-2">
              {motivationOptions
                .filter((o) => o.value !== formData.primaryMotivation)
                .map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleSecondaryMotivation(option.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm transition-all',
                      formData.secondaryMotivations.includes(option.value)
                        ? 'bg-forest-100 text-forest-700 border-2 border-forest-700'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
            </div>
          </Card>
        )}

        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Success Definition</h2>

          <TextArea
            label="How would you know you've succeeded? *"
            value={formData.successDefinition}
            onChange={(e) => handleChange('successDefinition', e.target.value)}
            placeholder="Describe what success looks like. Be specific if you can."
            rows={3}
            error={errors.successDefinition}
            hint="This helps us tailor recommendations to your definition of success."
          />
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Save & Return
          </Button>
        </div>
      </form>
    </div>
  );
}
