const { z } = require('zod');

const objectIdRegex = /^[a-f\d]{24}$/i;
const phoneRegex = /^[6-9]\d{9}$/;
const maskedAadhaarRegex = /^XXXX-XXXX-\d{4}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()[\]{}_\-+=~`|:;"'<>,./\\]).{8,}$/;

const objectId = z.string().regex(objectIdRegex, 'Invalid ObjectId');
const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email format')
  .optional()
  .or(z.literal('').transform(() => undefined));

const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email('Invalid email format'),
    phone: z.string().regex(phoneRegex, 'Invalid phone number').optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRegex,
        'Password must include upper, lower, number, and special character'
      ),
    role: z.string().optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

const propertyCreateSchema = z
  .object({
    address: z.string().trim().min(3).max(300),
    unitNo: z.string().trim().max(50).optional(),
    status: z.enum(['vacant', 'occupied', 'under_notice']).optional(),
  })
  .strict();

const propertyUpdateSchema = propertyCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field is required'
);

const tenantBaseSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    mobile: z.string().regex(phoneRegex, 'Invalid mobile number'),
    email: optionalEmail,
    occupation: z.string().trim().max(120).optional(),
    emergencyContact: z.string().regex(phoneRegex, 'Invalid emergency contact').optional(),
    address: z.string().trim().max(500).optional(),
    maskedAadhaar: z
      .string()
      .regex(maskedAadhaarRegex, 'maskedAadhaar must be in format XXXX-XXXX-1234')
      .optional(),
    aadhaarVerificationStatus: z.enum(['unverified', 'pending', 'verified', 'rejected']).optional(),
  })
  .strict();

const tenantCreateSchema = tenantBaseSchema;
const tenantUpdateSchema = tenantBaseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field is required'
);

const agreementCreateSchema = z
  .object({
    propertyId: objectId,
    tenantId: objectId,
    rentAmount: z.number().positive('rentAmount must be greater than 0'),
    depositAmount: z.number().min(0, 'depositAmount cannot be negative'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    rentDueDay: z.number().int().min(1).max(31),
    agreementStatus: z.enum(['draft', 'active', 'expired', 'terminated']).optional(),
    documentUrl: z.string().url().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.endDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate must be after startDate',
      });
    }
  });

const agreementUpdateSchema = z
  .object({
    rentAmount: z.number().positive().optional(),
    depositAmount: z.number().min(0).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    rentDueDay: z.number().int().min(1).max(31).optional(),
    agreementStatus: z.enum(['draft', 'active', 'expired', 'terminated']).optional(),
    documentUrl: z.string().url().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required')
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate must be after startDate',
      });
    }
  });

const agreementTerminateSchema = z
  .object({
    reason: z.string().trim().min(3).max(500).optional(),
  })
  .strict();

const verificationCreateSchema = z
  .object({
    agreementId: objectId,
    documentsChecklist: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(120),
          received: z.boolean().optional(),
        })
      )
      .optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

const verificationUpdateStageSchema = z
  .object({
    nextStage: z.enum(['submitted', 'in_review', 'cleared', 'flagged']),
  })
  .strict();

const rentPaymentMarkPaidSchema = z
  .object({
    receiptUrl: z.string().url().optional(),
  })
  .strict();

const eventCreateSchema = z
  .object({
    agreementId: objectId,
    type: z.enum(['repair_request', 'notice', 'inspection', 'rent_receipt', 'other']),
    description: z.string().trim().min(3).max(1000),
    photoUrls: z.array(z.string().url()).optional(),
    metadata: z.record(z.any()).optional(),
    action: z.string().trim().min(1).max(100).optional(),
    entityType: z.string().trim().min(1).max(100).optional(),
    entityId: objectId.optional(),
  })
  .strict();

const idParamSchema = z.object({ id: objectId }).strict();
const agreementIdParamSchema = z.object({ agreementId: objectId }).strict();

module.exports = {
  registerSchema,
  loginSchema,
  propertyCreateSchema,
  propertyUpdateSchema,
  tenantCreateSchema,
  tenantUpdateSchema,
  agreementCreateSchema,
  agreementUpdateSchema,
  agreementTerminateSchema,
  verificationCreateSchema,
  verificationUpdateStageSchema,
  rentPaymentMarkPaidSchema,
  eventCreateSchema,
  idParamSchema,
  agreementIdParamSchema,
};
