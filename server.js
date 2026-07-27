require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[Server] AURA-SMS backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`[Server] ${signal} received. Shutting down gracefully...`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (err) => {
    console.error('[Server] Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
};

start();
