const Store = require('../models/Store');

exports.appProxy = async (req, res) => {
  const { shop } = req.query;
  console.log('Shop parameter:', shop);

  if (!shop) {
    console.error('Missing shop parameter in request');
    return res.status(400).send('Missing shop parameter');
  }
  
  try {
    const store = await Store.findOne({ 
      where: { shop },
      attributes: ['wms_jwt_token', 'accessToken']
    });

    if (!store) {
      console.error('Store not found:', shop);
      return res.status(404).send('Store not found');
    }

    if (!store.accessToken) {
      console.error('Store not authenticated with Shopify:', shop);
      return res.status(401).send('Store not authenticated with Shopify');
    }

    // Check if WMS is authenticated by checking for JWT token
    const isWMSAuthenticated = !!store.wms_jwt_token;

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shopify App</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://unpkg.com/@shopify/app-bridge-js"></script>
          <script src="https://unpkg.com/@shopify/app-bridge-utils"></script>
          <script src="https://unpkg.com/@shopify/polaris@11.26.0/build/esm/index.js"></script>
          <link rel="stylesheet" href="https://unpkg.com/@shopify/polaris@11.26.0/build/esm/styles.css" />
          <link rel="stylesheet" href="/assets/css/app.css" />
        </head>
        <body>
          <div id="app">
                ${!isWMSAuthenticated ? `
                  <div id="login-box">
                    <div class="form-section">
                        <h1 style="font-size: 22px; margin-bottom: 20px;">Aramex Unified Portal Login</h1>
                        <div id="authMessage"></div>
                        <form id="wmsAuthForm">
                            <input type="hidden" name="shop" value="${shop}" />
                            <div class="col" style="margin-bottom: 15px;">
                                <label for="wms_store_key" class="required">Store ID</label><br>
                                <input type="text" id="wms_store_key" name="wms_store_key" placeholder="Store ID here" required style="width: 100%;" />
                            </div>

                            <div class="col" style="margin-bottom: 15px;">
                                <label for="wms_facility_id" class="required">Facility ID</label><br>
                                <input type="text" id="wms_facility_id" name="wms_facility_id" placeholder="Facility ID here" required style="width: 100%;" />
                            </div>

                            <div class="col" style="margin-bottom: 15px;">
                                <label for="wms_SSA_login" class="required">Username</label><br>
                                <input type="text" id="wms_SSA_login" name="wms_SSA_login" placeholder="Enter username" required style="width: 100%;" />
                            </div>

                            <div class="col pass-field" style="margin-bottom: 15px;">
                                <label for="wms_SSA_password" class="required">Password</label><br>
                                <input type="password" id="wms_SSA_password" name="wms_SSA_password" placeholder="Enter your password" required autocomplete="off" style="width: 100%;" />
                            </div>

                            <div class="action" style="margin-bottom: 15px;">
                                <button type="submit" class="button button-primary" onCLick="formSubmit()" >Continue</button>
                            </div>

                            <div class="legal-msg">Having trouble signing in? Connect with <strong>Aramex</strong> Account Manager</div>
                        </form>
                    </div>
                </div>
                ` : `
                  <div class="Polaris-Card">
                    <div class="Polaris-Card__Section">
                      <p>WMS is successfully authenticated!</p>
                      <a href=http://23.20.82.222:3000/login?token=${encodeURIComponent(store.wms_jwt_token)}" target="_blank>
                      <button id="unifiedPortal" class="Polaris-Button Polaris-Button--primary" onCLick="openUnifiedPortal()">Open Unified Portal</button>
                    </a></div>
                  </div>
                `}
          </div>
          <script>
            const app = createApp({
              apiKey: '${process.env.SHOPIFY_API_KEY}',
              host: '${shop}',
              forceRedirect: true
            });

            const client = createAppBridgeClient(app);




            // Handle WMS authentication form submission
             function formSubmit() {
              const wmsAuthForm = document.getElementById('wmsAuthForm');
              if (wmsAuthForm) {
                console.log('Form found, adding submit listener');
                wmsAuthForm.addEventListener('submit', async (e) => {
                  e.preventDefault();
                  console.log('Form submitted');
                  const messageDiv = document.getElementById('authMessage');
                  
                  try {
                    const formData = new FormData(wmsAuthForm);
                    const shop = formData.get('shop');
                    console.log('Submitting form for shop:', shop);
                    
                    const authData = {
                      wms_store_key: formData.get('wms_store_key'),
                      wms_facility_id: formData.get('wms_facility_id'),
                      wms_SSA_login: formData.get('wms_SSA_login'),
                      wms_SSA_password: formData.get('wms_SSA_password')
                    };
                    
                    console.log('Sending auth data:', authData);
                    
                    const response = await fetch('/wms-auth/authenticate?shop=' + encodeURIComponent(shop), {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                      },
                      body: JSON.stringify(authData)
                    });

                    console.log('Response status:', response.status);
                    const data = await response.json();
                    console.log('Response data:', data);
                    
                    if (response.ok) {
                      messageDiv.className = 'success-message';
                      messageDiv.textContent = 'Authentication successful!';
                      setTimeout(() => window.location.reload(), 2000);
                    } else {
                      messageDiv.className = 'error-message';
                      messageDiv.textContent = data.error || 'Authentication failed';
                    }
                  } catch (error) {
                    console.error('Authentication error:', error);
                    messageDiv.className = 'error-message';
                    messageDiv.textContent = 'An error occurred during authentication';
                  }
                });
              } else {
                console.log('Form not found');
              }
            };

            // Handle product sync button
            const syncButton = document.getElementById('syncProducts');
            if (syncButton) {
              syncButton.addEventListener('click', async () => {
                try {
                  const response = await fetch('/api/sync-products?shop=' + encodeURIComponent('${shop}'), {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  if (response.ok) {
                    alert('Products synced successfully!');
                  } else {
                    throw new Error('Failed to sync products');
                  }
                } catch (error) {
                  alert('Failed to sync products. Please try again.');
                }
              });
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error loading app:', error);
    res.status(500).send('Error loading app');
  }
};

exports.rootRedirect = (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    console.error('Missing shop parameter in root redirect');
    return res.status(400).send('Missing shop parameter');
  }
  res.redirect(`/app-proxy?shop=${encodeURIComponent(shop)}`);
}; 