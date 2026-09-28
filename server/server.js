require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const agreementRoutes = require('./routes/agreementRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const rentPaymentRoutes = require('./routes/rentPaymentRoutes');
const eventLogRoutes = require('./routes/eventLogRoutes');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');

require('./jobs/rentReminderJob');

const app = express();

const getAllowedOrigins = () => {
  const configured = process.env.CLIENT_URL;
  if (process.env.NODE_ENV === 'production') {
    return configured ? [configured] : [];
  }
  const localOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  if (!configured) return localOrigins;
  return [...new Set([configured, ...localOrigins])];
};

const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed'));
  },
  credentials: true,
};

const ensureJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isPlaceholder =
    !secret || ['replace_this_with_a_long_random_string', 'changeme', 'secret'].includes(secret.toLowerCase());
  if (process.env.NODE_ENV === 'production' && isPlaceholder) {
    throw new Error('Invalid JWT_SECRET in production');
  }
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const response = {
    status: dbReady ? 'ok' : 'degraded',
    db: dbReady ? 'connected' : 'disconnected',
  };
  return res.status(dbReady ? 200 : 503).json(response);
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/rent-payments', rentPaymentRoutes);
app.use('/api/event-logs', eventLogRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err.message === 'CORS not allowed') {
    return res.status(403).json({ message: 'Forbidden origin' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map((fieldErr) => fieldErr.message),
    });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate resource conflict' });
  }

  const statusCode = err.statusCode || 500;
  const payload = { message: err.message || 'Server error' };
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }
  return res.status(statusCode).json(payload);
});

const startServer = async () => {
  ensureJwtSecret();
  await connectDB();

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => console.log(`RentTrail API running on port ${PORT}`));

  const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}. Closing server...`);
    server.close(async () => {
      try {
        await mongoose.connection.close();
      } finally {
        process.exit(0);
      }
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
