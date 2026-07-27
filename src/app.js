const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const apiRoutes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { checkAndRolloverMonth } = require('./utils/monthRollover');

const app = express();

// ── Core middleware ─────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Month rollover guard ─────────────────────────────────────
// Lazily checks on every /api request whether the calendar month has
// advanced since the last check, and if so rolls resident statuses over
// (paid -> pending, pending/overdue -> overdue) for the new month.
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
    message: 'AURA-SMS backend API is running. See /api/health for status.',
  });
});

app.use('/api', apiRoutes);

// ── Error handling (must be last) ────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
