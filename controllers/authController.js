const crypto = require('crypto');
const Store = require('../models/Store');
const webhookController = require('./webhookController');

function normalizeShopUrl(shop) {
  return shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function generateShopifyAuthUrl(shop, nonce) {
  const scopes = 'read_products,write_products,read_orders,read_customers';
  const baseUrl = process.env.SHOPIFY_APP_URL.replace(/\/$/, '');
  const redirectUri = `${baseUrl}/auth/callback`;
  const state = nonce;
  return `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
}

exports.auth = async (req, res) => {
  console.log('Auth request received:', req.query);
  const { shop } = req.query;
  
  if (!shop) {
    console.error('Missing shop parameter');
    return res.status(400).send('Missing shop parameter');
  }

  try {
    const normalizedShop = normalizeShopUrl(shop);
    console.log('Normalized shop URL:', normalizedShop);
    
    const nonce = crypto.randomBytes(16).toString('hex');
    console.log('Generated nonce:', nonce);
    
    // Create or update store
    const [store, created] = await Store.findOrCreate({
      where: { shop: normalizedShop },
      defaults: {
        shop: normalizedShop,
        nonce: nonce,
        updatedAt: new Date()
      }
    });

    if (!created) {
      console.log('Updating existing store');
      await store.update({
        nonce: nonce,
        updatedAt: new Date()
      });
    } else {
      console.log('Created new store');
    }

    const authUrl = generateShopifyAuthUrl(normalizedShop, nonce);
    console.log('Redirecting to:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Error during authentication');
  }
};

exports.authCallback = async (req, res) => {
  console.log('Auth callback received:', req.query);
  const { shop, code, state } = req.query;
  
  try {
    const normalizedShop = normalizeShopUrl(shop);
    console.log('Normalized shop URL:', normalizedShop);
    
    const store = await Store.findOne({
      where: { shop: normalizedShop }
    });

    if (!store) {
      console.error('Store not found:', normalizedShop);
      return res.status(400).send('Store not found');
    }

    if (store.nonce !== state) {
      console.error('Invalid state parameter:', { received: state, expected: store.nonce });
      return res.status(400).send('Invalid state parameter');
    }
    
    console.log('Requesting access token from Shopify');
    const response = await fetch(`https://${normalizedShop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify OAuth error:', errorText);
      throw new Error('Failed to get access token from Shopify');
    }

    const { access_token, scope } = await response.json();
    console.log('Access token received');
    
    await store.update({
      accessToken: access_token,
      scope: scope,
      nonce: null
    });

    // Register webhooks
    console.log('Registering webhooks...');
    await webhookController.registerWebhooks(normalizedShop, access_token);
    
    // Redirect to the app
    const appUrl = `https://${normalizedShop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
    console.log('Redirecting to app:', appUrl);
    res.redirect(appUrl);
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send('Error during installation');
  }
}; 