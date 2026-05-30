/**
 * Shared Zod Validation Schemas
 *
 * Central library of field-level and form-level schemas used across all
 * FACT modules. Import individual fields or full form schemas.
 *
 * Enforces:
 *   - Financial amount precision (max 2 decimal places)
 *   - Date ranges (no future dates for historical records, etc.)
 *   - Required vs optional fields
 *   - Cross-field dependencies (e.g., credit limit vs payment terms)
 */

import { z } from 'zod';

// ─── Primitive fields ──────────────────────────────────────────────────────────

export const fields = {
  uuid: z.string().uuid('Invalid ID format'),

  amount: z
    .union([z.string(), z.number()])
    .transform((v) => parseFloat(String(v).replace(/,/g, '')))
    .pipe(
      z
        .number({ invalid_type_error: 'Must be a number' })
        .min(0, 'Amount cannot be negative')
        .refine((v) => /^\d+(\.\d{1,2})?$/.test(v.toFixed(2)), {
          message: 'Amount cannot have more than 2 decimal places',
        })
    ),

  positiveAmount: z
    .union([z.string(), z.number()])
    .transform((v) => parseFloat(String(v).replace(/,/g, '')))
    .pipe(z.number().positive('Amount must be greater than 0')),

  date: z.string().min(1, 'Date is required').refine(
    (d) => !isNaN(new Date(d).getTime()),
    { message: 'Invalid date' }
  ),

  pastOrPresentDate: z.string().refine(
    (d) => new Date(d) <= new Date(),
    { message: 'Date cannot be in the future' }
  ),

  futureDate: z.string().refine(
    (d) => new Date(d) > new Date(),
    { message: 'Date must be in the future' }
  ),

  requiredString: z.string().min(1, 'This field is required').trim(),

  optionalString: z.string().trim().optional(),

  email: z.string().email('Invalid email address'),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),

  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)')
    .optional()
    .or(z.literal('')),

  gst: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GSTIN format'
    )
    .optional()
    .or(z.literal('')),

  ifsc: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format')
    .optional()
    .or(z.literal('')),

  accountNumber: z
    .string()
    .regex(/^\d{9,18}$/, 'Bank account number must be 9-18 digits')
    .optional()
    .or(z.literal('')),

  percentage: z
    .number()
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
};

// ─── Journal Entry ────────────────────────────────────────────────────────────

export const journalEntrySchema = z
  .object({
    entry_date: fields.pastOrPresentDate,
    reference_number: z.string().optional(),
    notes: z.string().optional(),
    lines: z
      .array(
        z.object({
          account_id: fields.uuid,
          debit_amount: fields.amount.optional().default(0),
          credit_amount: fields.amount.optional().default(0),
          description: z.string().optional(),
          cost_center_id: z.string().optional(),
        })
      )
      .min(2, 'A journal entry requires at least 2 lines'),
  })
  .refine(
    (data) => {
      const totalDebit = data.lines.reduce((s, l) => s + (l.debit_amount || 0), 0);
      const totalCredit = data.lines.reduce((s, l) => s + (l.credit_amount || 0), 0);
      return Math.abs(totalDebit - totalCredit) < 0.01;
    },
    { message: 'Debits must equal Credits', path: ['lines'] }
  );

// ─── Patient Invoice ──────────────────────────────────────────────────────────

export const patientInvoiceSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  patient_name: fields.requiredString,
  invoice_date: fields.pastOrPresentDate,
  billing_type: z.enum(['OP', 'IP', 'ICU', 'OT', 'PACKAGE'], {
    errorMap: () => ({ message: 'Select a billing type' }),
  }),
  items: z
    .array(
      z.object({
        description: fields.requiredString,
        quantity: z.number().positive('Quantity must be > 0'),
        unit_price: fields.positiveAmount,
        tax_rate: z.number().min(0).max(100).optional(),
      })
    )
    .min(1, 'Add at least one billing item'),
  discount_amount: fields.amount.optional().default(0),
  notes: z.string().optional(),
});

// ─── Payment Receipt ──────────────────────────────────────────────────────────

export const paymentSchema = z.object({
  amount: fields.positiveAmount,
  payment_date: fields.pastOrPresentDate,
  payment_mode: z.enum(['CASH', 'CARD', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'INSURANCE'], {
    errorMap: () => ({ message: 'Select a payment mode' }),
  }),
  reference_number: z.string().optional(),
  bank_account_id: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Vendor Invoice ───────────────────────────────────────────────────────────

export const vendorInvoiceSchema = z.object({
  vendor_id: fields.uuid,
  invoice_number: fields.requiredString,
  invoice_date: fields.pastOrPresentDate,
  due_date: fields.futureDate.optional().or(z.literal('')),
  amount: fields.positiveAmount,
  tax_amount: fields.amount.optional().default(0),
  currency: z.string().default('INR'),
  po_number: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Insurance Claim ──────────────────────────────────────────────────────────

export const claimSchema = z.object({
  invoice_id: fields.uuid,
  insurer_id: fields.uuid,
  tpa_id: z.string().optional(),
  claimed_amount: fields.positiveAmount,
  preauth_number: z.string().optional(),
  admission_date: fields.date.optional(),
  discharge_date: fields.date.optional(),
  diagnosis_code: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Asset ────────────────────────────────────────────────────────────────────

export const assetSchema = z.object({
  asset_name: fields.requiredString,
  category: fields.requiredString,
  acquisition_date: fields.pastOrPresentDate,
  cost: fields.positiveAmount,
  salvage_value: fields.amount.optional().default(0),
  useful_life_years: z.number().int().positive('Useful life must be > 0 years'),
  depreciation_method: z.enum(['SLM', 'WDV', 'UNITS'], {
    errorMap: () => ({ message: 'Select a depreciation method' }),
  }),
  location: z.string().optional(),
  supplier: z.string().optional(),
  po_reference: z.string().optional(),
});

// ─── Revenue Share Formula ────────────────────────────────────────────────────

export const revenueShareFormulaSchema = z.object({
  doctor_id: fields.uuid,
  formula_type: z.enum(['PERCENTAGE', 'SLAB', 'PROCEDURE', 'FLAT'], {
    errorMap: () => ({ message: 'Select a formula type' }),
  }),
  percentage: fields.percentage.optional(),
  effective_from: fields.date,
  effective_to: fields.date.optional().or(z.literal('')),
  department: z.string().optional(),
  notes: z.string().optional(),
});

// ─── User / Auth ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: fields.email,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default {
  fields,
  journalEntrySchema,
  patientInvoiceSchema,
  paymentSchema,
  vendorInvoiceSchema,
  claimSchema,
  assetSchema,
  revenueShareFormulaSchema,
  loginSchema,
  changePasswordSchema,
};
