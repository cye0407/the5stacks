// ============================================
// Zod Validation Schemas
// ============================================

import { z } from 'zod';

// Reusable enums
const ownershipType = z.enum(['private', 'public', 'cooperative', 'non-profit', 'other']);
const siteType = z.enum(['hq', 'production', 'warehouse', 'office', 'retail', 'mixed', 'farm', 'field', 'processing', 'other']);
const siteOwnership = z.enum(['owned', 'leased', 'shared']);
const confidenceLevel = z.enum(['high', 'medium', 'low']);
const revenueBand = z.enum(['<500k', '500k-1m', '1m-5m', '5m-10m', '10m-50m', '50m-100m', '>100m', 'prefer_not_to_say']);
const timeHorizon = z.enum(['1-year', '2-3-years', '5-years']);
const primaryMotivation = z.enum(['compliance', 'cost', 'customers', 'values', 'competitive', 'financing', 'risk', 'other']);
const applicabilityStatus = z.enum(['yes', 'no', 'unsure']);

// ---- Company Profile ----
export const companySchema = z.object({
  legalEntityName: z.string().min(1, 'Legal entity name is required').max(200),
  tradingName: z.string().max(200).optional().or(z.literal('')),
  registrationNumber: z.string().max(50).optional().or(z.literal('')),
  industryCode: z.string().min(1, 'Industry code is required'),
  industryDescription: z.string().optional().or(z.literal('')),
  ownershipType: ownershipType,
  foundingYear: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional().or(z.literal(0).transform(() => undefined)),
  headquartersCountry: z.string().min(1, 'Headquarters country is required'),
  headquartersCity: z.string().optional().or(z.literal('')),
  reportingPeriodStart: z.string().min(1, 'Reporting period start is required'),
  reportingPeriodEnd: z.string().min(1, 'Reporting period end is required'),
  totalFte: z.coerce.number().min(0, 'FTE must be 0 or greater'),
  fteConfidence: confidenceLevel,
  revenueBand: revenueBand,
  revenueCurrency: z.string().min(1, 'Currency is required'),
}).refine(
  (data) => data.industryCode !== 'other' || (data.industryDescription && data.industryDescription.length > 0),
  { message: 'Industry description is required', path: ['industryDescription'] }
);

// ---- Site ----
export const siteSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').max(200),
  siteType: siteType,
  country: z.string().min(1, 'Country is required'),
  city: z.string().max(100).optional().or(z.literal('')),
  floorAreaM2: z.coerce.number().min(0).optional(),
  landAreaHa: z.coerce.number().min(0).optional(),
  ownership: siteOwnership,
  operationalSince: z.string().optional().or(z.literal('')),
});

// ---- SWOT ----
export const swotSchema = z.object({
  strengths: z.string().min(1, 'Strengths are required').max(2000),
  weaknesses: z.string().min(1, 'Weaknesses are required').max(2000),
  opportunities: z.string().min(1, 'Opportunities are required').max(2000),
  threats: z.string().min(1, 'Threats are required').max(2000),
});

// ---- Goals ----
export const goalsSchema = z.object({
  primaryGoal: z.string().min(1, 'Primary goal is required').max(1000),
  timeHorizon: timeHorizon,
  primaryMotivation: primaryMotivation,
  secondaryMotivations: z.array(primaryMotivation).optional(),
  successDefinition: z.string().min(1, 'Success definition is required').max(2000),
});

// ---- Regulatory Context ----
export const regulatoryContextSchema = z.object({
  csrdApplicable: applicabilityStatus,
  vsmeApplicable: applicabilityStatus,
  otherFrameworks: z.array(z.string()).optional(),
  customerRequirements: z.string().max(2000).optional().or(z.literal('')),
  certificationsHeld: z.array(z.string()).optional(),
  certificationsTargeted: z.array(z.string()).optional(),
});

// ---- Helper ----

/**
 * Validate data against a Zod schema and return field-level errors.
 * Returns null if valid, or a Record<string, string> of field → message.
 */
export function validateForm<T>(
  schema: z.ZodType<T>,
  data: unknown
): Record<string, string> | null {
  const result = schema.safeParse(data);
  if (result.success) return null;

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
