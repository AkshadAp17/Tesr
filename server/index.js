const express = require('express');
const cors = require('cors');
const { setupVite } = require('./vite');
const { registerRoutes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [${req.method}] ${req.path}`);
  next();
});

// Setup routes
registerRoutes(app).then(server => {
  // Setup Vite middleware
  setupVite(app, server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`${new Date().toLocaleTimeString()} [express] serving on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to setup server:', error);
  process.exit(1);
});