const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const apiRoutes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { checkAndRolloverMonth } = require('./utils/monthRollover');

const app = express();

// ── Core CORS configuration ──────────────────────────────────
const rawOrigins = process.env.CLIENT_ORIGIN || '';
const allowedOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim().replace(/\/$/, '')) // strip trailing slashes
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // 1. Allow non-browser requests (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // 2. Allow local development origins
    const isLocal = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');

    // 3. Allow explicitly defined CLIENT_ORIGIN or any Vercel deployment URL
    const isAllowedDomain = allowedOrigins.includes(origin);
    const isVercelPreview = /\.vercel\.app$/.test(origin);

    if (isLocal || isAllowedDomain || isVercelPreview) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Apply CORS globally before any middleware or routes
app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight requests across all endpoints
app.options('*', cors(corsOptions));

// ── Other Core middleware ────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Month rollover guard ─────────────────────────────────────
app.use('/api', async (req, res, next) => {
  try {
    await checkAndRolloverMonth();
    next();
  } catch (err) {
    next(err);
  }
});

// ── Routes ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ROYALE AVENUE backend API is running. See /api/health for status.',
  });
});

app.use('/api', apiRoutes);

// ── Error handling (must be last) ────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;