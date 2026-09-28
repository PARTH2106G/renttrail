require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const agreementRoutes = require('./routes/agreementRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const rentPaymentRoutes = require('./routes/rentPaymentRoutes');
const eventLogRoutes = require('./routes/eventLogRoutes');
require('./jobs/rentReminderJob');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(value => value.trim()) : true }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'renttrail-api', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/rent-payments', rentPaymentRoutes);
app.use('/api/event-logs', eventLogRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.name === 'ValidationError' ? 400 : (err.statusCode || 500);
  res.status(status).json({ message: status === 500 ? 'Server error' : err.message });
});

const PORT = Number(process.env.PORT) || 5000;
if (require.main === module) {
  connectDB().then(() => app.listen(PORT, '0.0.0.0', () => console.log(`RentTrail API running on port ${PORT}`)));
}
module.exports = app;
