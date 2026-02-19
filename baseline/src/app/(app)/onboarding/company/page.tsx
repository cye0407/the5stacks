"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { Button, Input, Select, Card } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { companySchema, validateForm } from '@/lib/validation/schemas';
import type { Company, OwnershipType, RevenueBand, ConfidenceLevel } from '@/types';

const ownershipOptions = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'non-profit', label: 'Non-profit' },
  { value: 'other', label: 'Other' },
];

const revenueBandOptions = [
  { value: '<500k', label: 'Under \u20AC500,000' },
  { value: '500k-1m', label: '\u20AC500,000 - \u20AC1,000,000' },
  { value: '1m-5m', label: '\u20AC1,000,000 - \u20AC5,000,000' },
  { value: '5m-10m', label: '\u20AC5,000,000 - \u20AC10,000,000' },
  { value: '10m-50m', label: '\u20AC10,000,000 - \u20AC50,000,000' },
  { value: '50m-100m', label: '\u20AC50,000,000 - \u20AC100,000,000' },
  { value: '>100m', label: 'Over \u20AC100,000,000' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const fteConfidenceOptions = [
  { value: 'high', label: 'High - Exact count known' },
  { value: 'medium', label: 'Medium - Approximate' },
  { value: 'low', label: 'Low - Rough estimate' },
];

const currencyOptions = [
  { value: 'EUR', label: 'EUR (\u20AC)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (\u00A3)' },
  { value: 'CHF', label: 'CHF' },
];

// Common NACE codes for quick selection
const industryOptions = [
  { value: 'A01', label: 'A01 - Crop and animal production' },
  { value: 'C10', label: 'C10 - Food products manufacturing' },
  { value: 'C11', label: 'C11 - Beverages manufacturing' },
  { value: 'G47', label: 'G47 - Retail trade' },
  { value: 'H49', label: 'H49 - Land transport' },
  { value: 'I56', label: 'I56 - Food and beverage service' },
  { value: 'M70', label: 'M70 - Management consultancy' },
  { value: 'other', label: 'Other (specify)' },
];

export default function CompanyProfilePage() {
  const router = useRouter();
  const { setCompany, setIsOnboardingComplete, completeOnboardingStep } = useAppStore();

  const [formData, setFormData] = useState({
    legalEntityName: '',
    tradingName: '',
    registrationNumber: '',
    industryCode: '',
    industryDescription: '',
    ownershipType: '' as OwnershipType | '',
    foundingYear: '',
    headquartersCountry: '',
    headquartersCity: '',
    reportingPeriodStart: new Date().getFullYear() + '-01-01',
    reportingPeriodEnd: new Date().getFullYear() + '-12-31',
    totalFte: '',
    fteConfidence: '' as ConfidenceLevel | '',
    revenueBand: '' as RevenueBand | '',
    revenueCurrency: 'EUR',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const result = validateForm(companySchema, formData);
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

    const company: Company = {
      id: uuid(),
      legalEntityName: formData.legalEntityName,
      tradingName: formData.tradingName || undefined,
      registrationNumber: formData.registrationNumber || undefined,
      industryCode: formData.industryCode,
      industryDescription: formData.industryDescription || formData.industryCode,
      ownershipType: formData.ownershipType as OwnershipType,
      foundingYear: formData.foundingYear ? parseInt(formData.foundingYear) : undefined,
      headquartersCountry: formData.headquartersCountry,
      headquartersCity: formData.headquartersCity || undefined,
      reportingPeriodStart: formData.reportingPeriodStart,
      reportingPeriodEnd: formData.reportingPeriodEnd,
      totalFte: parseInt(formData.totalFte),
      fteConfidence: formData.fteConfidence as ConfidenceLevel,
      numberOfSites: 1,
      primarySiteCountry: formData.headquartersCountry,
      revenueBand: formData.revenueBand as RevenueBand,
      revenueCurrency: formData.revenueCurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCompany(company);
    completeOnboardingStep(0);
    setIsOnboardingComplete(true);
    router.push('/dashboard');
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-deep-forest mb-2">Company Profile</h1>
        <p className="text-gray-600">
          Let's start with the basics about your organization.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <Input
              label="Legal Entity Name *"
              value={formData.legalEntityName}
              onChange={(e) => handleChange('legalEntityName', e.target.value)}
              placeholder="Your Company Ltd."
              error={errors.legalEntityName}
            />

            <Input
              label="Trading Name"
              value={formData.tradingName}
              onChange={(e) => handleChange('tradingName', e.target.value)}
              placeholder="If different from legal name"
              hint="The name customers know you by"
            />

            <Input
              label="Registration Number"
              value={formData.registrationNumber}
              onChange={(e) => handleChange('registrationNumber', e.target.value)}
              placeholder="Company registration or VAT number"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Industry *"
                value={formData.industryCode}
                onChange={(e) => handleChange('industryCode', e.target.value)}
                options={industryOptions}
                placeholder="Select industry..."
                error={errors.industryCode}
              />

              <Select
                label="Ownership Type *"
                value={formData.ownershipType}
                onChange={(e) => handleChange('ownershipType', e.target.value)}
                options={ownershipOptions}
                placeholder="Select type..."
                error={errors.ownershipType}
              />
            </div>

            {formData.industryCode === 'other' && (
              <Input
                label="Industry Description *"
                value={formData.industryDescription}
                onChange={(e) => handleChange('industryDescription', e.target.value)}
                placeholder="Describe your industry"
              />
            )}
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location & Scale</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Headquarters Country *"
                value={formData.headquartersCountry}
                onChange={(e) => handleChange('headquartersCountry', e.target.value)}
                placeholder="e.g., Germany, France, UK"
                error={errors.headquartersCountry}
              />

              <Input
                label="Headquarters City"
                value={formData.headquartersCity}
                onChange={(e) => handleChange('headquartersCity', e.target.value)}
                placeholder="City"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Total Employees (FTE) *"
                type="number"
                min="1"
                value={formData.totalFte}
                onChange={(e) => handleChange('totalFte', e.target.value)}
                placeholder="Full-time equivalents"
                error={errors.totalFte}
              />

              <Select
                label="Employee Count Confidence *"
                value={formData.fteConfidence}
                onChange={(e) => handleChange('fteConfidence', e.target.value)}
                options={fteConfidenceOptions}
                placeholder="How confident are you?"
                error={errors.fteConfidence}
              />
            </div>

            <Input
              label="Founding Year"
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={formData.foundingYear}
              onChange={(e) => handleChange('foundingYear', e.target.value)}
              placeholder="e.g., 2010"
            />
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial & Reporting</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Revenue Band *"
                value={formData.revenueBand}
                onChange={(e) => handleChange('revenueBand', e.target.value)}
                options={revenueBandOptions}
                placeholder="Select revenue range..."
                error={errors.revenueBand}
              />

              <Select
                label="Currency"
                value={formData.revenueCurrency}
                onChange={(e) => handleChange('revenueCurrency', e.target.value)}
                options={currencyOptions}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Reporting Period Start"
                type="date"
                value={formData.reportingPeriodStart}
                onChange={(e) => handleChange('reportingPeriodStart', e.target.value)}
              />

              <Input
                label="Reporting Period End"
                type="date"
                value={formData.reportingPeriodEnd}
                onChange={(e) => handleChange('reportingPeriodEnd', e.target.value)}
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/onboarding')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Go to Dashboard
          </Button>
        </div>
      </form>
    </div>
  );
}
