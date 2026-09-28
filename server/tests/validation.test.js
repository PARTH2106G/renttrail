const {
  registerSchema,
  tenantCreateSchema,
  agreementCreateSchema,
  idParamSchema,
} = require('../validation/schemas');

describe('zod validation schemas', () => {
  it('rejects weak passwords', () => {
    expect(() =>
      registerSchema.parse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'weakpass',
      })
    ).toThrow();
  });

  it('rejects malformed object ids', () => {
    expect(() => idParamSchema.parse({ id: 'bad-id' })).toThrow();
  });

  it('rejects invalid masked Aadhaar values', () => {
    expect(() =>
      tenantCreateSchema.parse({
        name: 'Tenant',
        mobile: '9123456789',
        maskedAadhaar: '1234-1234-1234',
      })
    ).toThrow();
  });

  it('rejects agreement with endDate before startDate', () => {
    expect(() =>
      agreementCreateSchema.parse({
        propertyId: '507f1f77bcf86cd799439011',
        tenantId: '507f1f77bcf86cd799439012',
        rentAmount: 10000,
        depositAmount: 20000,
        startDate: '2026-12-31',
        endDate: '2026-01-01',
        rentDueDay: 5,
      })
    ).toThrow();
  });
});
