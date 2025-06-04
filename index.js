require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./src/config/database');
const initDatabase = require('./src/config/init-db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const wmsAuthRoutes = require('./routes/wmsAuthRoutes');
const appProxyController = require('./controllers/appProxyController');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request Headers:', req.headers);
  next();
});

// Special handling for webhook routes to preserve raw body
app.use('/webhooks', express.raw({ type: 'application/json' }), (req, res, next) => {
  if (Buffer.isBuffer(req.body)) {
    req.rawBody = req.body;
    req.body = JSON.parse(req.body.toString());
  }
  next();
});

// Regular JSON parsing for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database initialization
const initializeApp = async () => {
  try {
    await testConnection();
    await initDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

// Routes
app.use('/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/wms-auth', wmsAuthRoutes);

// App proxy routes
app.get('/app-proxy', appProxyController.appProxy);
app.get('/', appProxyController.rootRedirect);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.url);
  res.status(404).send('Not Found');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Auth URL: ${process.env.SHOPIFY_APP_URL}/auth`);
  initializeApp();
}); 