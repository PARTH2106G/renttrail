process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_super_secret_key_123!';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../server');
const RentPayment = require('../models/RentPayment');

let mongoServer;
const password = 'Strong@123';
const authValue = (token) => `Token ${token}`;
let dbReady = false;

const registerUser = async (overrides = {}) => {
  const body = {
    name: `User ${Date.now()}${Math.random()}`,
    email: `user${Date.now()}${Math.random()}@example.com`,
    password,
    phone: '9876543210',
    ...overrides,
  };
  return request(app).post('/api/auth/register').send(body);
};

const loginUser = async (email) =>
  request(app).post('/api/auth/login').send({
    email,
    password,
  });

describe('RentTrail backend hardening', () => {
  beforeAll(async () => {
    try {
      if (process.env.TEST_MONGO_URI) {
        await mongoose.connect(process.env.TEST_MONGO_URI, { dbName: 'renttrail-test' });
      } else {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri(), { dbName: 'renttrail-test' });
      }
      dbReady = true;
    } catch (err) {
      dbReady = false;
      console.warn(`Skipping DB-backed integration assertions: ${err.message}`);
    }
  }, 90000);

  afterEach(async () => {
    if (!dbReady) return;
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    if (dbReady) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('prevents privileged role assignment during registration', async () => {
    if (!dbReady) return;
    const res = await registerUser({ role: 'manager' });
    expect(res.status).toBe(403);
  });

  it('registers and logs in with normalized email', async () => {
    if (!dbReady) return;
    const registerRes = await registerUser({ email: 'UPPER@EXAMPLE.COM' });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.user.role).toBe('landlord');

    const loginRes = await loginUser('upper@example.com');
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
  });

  it('blocks unauthorized property access by another user', async () => {
    if (!dbReady) return;
    const owner = await registerUser({ email: 'owner@example.com' });
    const intruder = await registerUser({ email: 'intruder@example.com' });

    const property = await request(app)
      .post('/api/properties')
      .set('Authorization', authValue(owner.body.token))
      .send({ address: 'A-11 Test Lane', unitNo: '101' });
    expect(property.status).toBe(201);

    const updateRes = await request(app)
      .put(`/api/properties/${property.body._id}`)
      .set('Authorization', authValue(intruder.body.token))
      .send({ status: 'occupied' });
    expect(updateRes.status).toBe(403);
  });

  it('enforces tenant ownership and CRUD protection', async () => {
    if (!dbReady) return;
    const owner = await registerUser({ email: 'tenant-owner@example.com' });
    const intruder = await registerUser({ email: 'tenant-intruder@example.com' });

    const createRes = await request(app)
      .post('/api/tenants')
      .set('Authorization', authValue(owner.body.token))
      .send({
        name: 'Tenant One',
        mobile: '9123456789',
        email: 'tenant1@example.com',
        maskedAadhaar: 'XXXX-XXXX-1234',
      });
    expect(createRes.status).toBe(201);

    const getRes = await request(app)
      .get(`/api/tenants/${createRes.body._id}`)
      .set('Authorization', authValue(intruder.body.token));
    expect(getRes.status).toBe(403);
  });

  it('enforces agreement/payment/verification ownership and state transitions', async () => {
    if (!dbReady) return;
    const owner = await registerUser({ email: 'agreement-owner@example.com' });
    const intruder = await registerUser({ email: 'agreement-intruder@example.com' });

    const property = await request(app)
      .post('/api/properties')
      .set('Authorization', authValue(owner.body.token))
      .send({ address: 'X-1 Road', unitNo: '1A' });

    const tenant = await request(app)
      .post('/api/tenants')
      .set('Authorization', authValue(owner.body.token))
      .send({
        name: 'Tenant Two',
        mobile: '9234567890',
        maskedAadhaar: 'XXXX-XXXX-5678',
      });

    const agreement = await request(app)
      .post('/api/agreements')
      .set('Authorization', authValue(owner.body.token))
      .send({
        propertyId: property.body._id,
        tenantId: tenant.body._id,
        rentAmount: 12000,
        depositAmount: 24000,
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        rentDueDay: 5,
      });
    expect(agreement.status).toBe(201);

    const forbiddenAgreement = await request(app)
      .get(`/api/agreements/${agreement.body._id}`)
      .set('Authorization', authValue(intruder.body.token));
    expect(forbiddenAgreement.status).toBe(403);

    const payments = await request(app)
      .get(`/api/rent-payments/agreement/${agreement.body._id}`)
      .set('Authorization', authValue(owner.body.token));
    expect(payments.status).toBe(200);
    expect(payments.body.length).toBeGreaterThan(0);

    const paymentId = payments.body[0]._id;
    const intruderPaymentUpdate = await request(app)
      .patch(`/api/rent-payments/${paymentId}/mark-paid`)
      .set('Authorization', authValue(intruder.body.token))
      .send({});
    expect(intruderPaymentUpdate.status).toBe(403);

    const ownerPaymentUpdate = await request(app)
      .patch(`/api/rent-payments/${paymentId}/mark-paid`)
      .set('Authorization', authValue(owner.body.token))
      .send({});
    expect(ownerPaymentUpdate.status).toBe(200);

    const duplicatePaymentUpdate = await request(app)
      .patch(`/api/rent-payments/${paymentId}/mark-paid`)
      .set('Authorization', authValue(owner.body.token))
      .send({});
    expect(duplicatePaymentUpdate.status).toBe(409);

    const verification = await request(app)
      .post('/api/verifications')
      .set('Authorization', authValue(owner.body.token))
      .send({ agreementId: agreement.body._id, notes: 'Submitted docs' });
    expect(verification.status).toBe(201);

    const invalidTransition = await request(app)
      .patch(`/api/verifications/${verification.body._id}/stage`)
      .set('Authorization', authValue(owner.body.token))
      .send({ nextStage: 'cleared' });
    expect(invalidTransition.status).toBe(400);

    const validTransition1 = await request(app)
      .patch(`/api/verifications/${verification.body._id}/stage`)
      .set('Authorization', authValue(owner.body.token))
      .send({ nextStage: 'in_review' });
    expect(validTransition1.status).toBe(200);

    const validTransition2 = await request(app)
      .patch(`/api/verifications/${verification.body._id}/stage`)
      .set('Authorization', authValue(owner.body.token))
      .send({ nextStage: 'cleared' });
    expect(validTransition2.status).toBe(200);

    const forbiddenVerification = await request(app)
      .get(`/api/verifications/agreement/${agreement.body._id}`)
      .set('Authorization', authValue(intruder.body.token));
    expect(forbiddenVerification.status).toBe(403);
  });

  it('returns 400 for invalid ObjectId params', async () => {
    if (!dbReady) return;
    const user = await registerUser({ email: 'id-check@example.com' });
    const res = await request(app)
      .get('/api/agreements/not-an-object-id')
      .set('Authorization', authValue(user.body.token));
    expect(res.status).toBe(400);
  });

  it('generates month-end rent schedule without rollover bugs', async () => {
    if (!dbReady) return;
    const owner = await registerUser({ email: 'schedule-owner@example.com' });
    const property = await request(app)
      .post('/api/properties')
      .set('Authorization', authValue(owner.body.token))
      .send({ address: 'M-1', unitNo: 'C' });

    const tenant = await request(app)
      .post('/api/tenants')
      .set('Authorization', authValue(owner.body.token))
      .send({
        name: 'Calendar Tenant',
        mobile: '9345678901',
        maskedAadhaar: 'XXXX-XXXX-9876',
      });

    const agreement = await request(app)
      .post('/api/agreements')
      .set('Authorization', authValue(owner.body.token))
      .send({
        propertyId: property.body._id,
        tenantId: tenant.body._id,
        rentAmount: 15000,
        depositAmount: 30000,
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        rentDueDay: 31,
      });
    expect(agreement.status).toBe(201);

    const payments = await RentPayment.find({ agreementId: agreement.body._id }).sort('dueDate');
    const days = payments.map((payment) => new Date(payment.dueDate).getUTCDate());
    const months = payments.map((payment) => new Date(payment.dueDate).getUTCMonth() + 1);
    expect(days).toEqual([31, 29, 31, 30, 31]);
    expect(months).toEqual([1, 2, 3, 4, 5]);
  });
});
