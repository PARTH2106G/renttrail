require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const agreementRoutes = require('./routes/agreementRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const rentPaymentRoutes = require('./routes/rentPaymentRoutes');
const eventLogRoutes = require('./routes/eventLogRoutes');

require('./jobs/rentReminderJob'); // node-cron: fires daily to flag due/overdue rent

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/rent-payments', rentPaymentRoutes);
app.use('/api/event-logs', eventLogRoutes);

// Central error handler - keep last
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`RentTrail API running on port ${PORT}`));
