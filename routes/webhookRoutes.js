const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const crypto = require('crypto');

// Webhook verification middleware
const verifyWebhook = (req, res, next) => {
  try {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const shop = req.headers['x-shopify-shop-domain'];

    console.log('=== Webhook Verification ===');
    console.log('Headers:', {
      hmac,
      topic,
      shop,
      contentType: req.headers['content-type']
    });

    if (!hmac || !topic || !shop) {
      console.error('Missing required headers:', { hmac, topic, shop });
      return res.status(401).send('Missing required headers');
    }

    // Get the raw body
    const rawBody = req.rawBody;
    if (!rawBody) {
      console.error('No raw body received');
      return res.status(400).send('No raw body received');
    }

    // Convert raw body to string if it's a buffer
    const rawBodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;

    // Verify HMAC
    const hash = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(rawBodyString)
      .digest('base64');

    if (hash !== hmac) {
      console.error('Invalid webhook signature:', {
        received: hmac,
        calculated: hash
      });
      return res.status(401).send('Invalid webhook signature');
    }

    // Parse the raw body
    let data;
    try {
      data = JSON.parse(rawBodyString);
      console.log('Successfully parsed webhook body');
    } catch (error) {
      console.error('Error parsing webhook body:', error);
      return res.status(400).send('Invalid JSON body');
    }

    req.webhookData = {
      topic,
      shop,
      data
    };
    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(500).send('Error verifying webhook');
  }
};

// Error handling middleware
const webhookErrorHandler = (err, req, res, next) => {
  console.error('Webhook error:', err);
  res.status(500).send('Error processing webhook');
};

// Apply verification middleware to all webhook routes
router.use(verifyWebhook);

// Order webhooks
router.post('/orders', webhookController.handleOrderWebhook, webhookErrorHandler);

// Export the router
module.exports = router; 