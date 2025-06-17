const Store = require('../models/Store');
const webhookController = require('./webhookController');

exports.authenticateWMS = async (req, res) => {
  const { shop } = req.query;
  const { wms_store_key, wms_facility_id, wms_SSA_login, wms_SSA_password } = req.body;
console.log(req.body,'sdfdsdsfsdfd')
  if (!shop || !wms_store_key || !wms_facility_id || !wms_SSA_login || !wms_SSA_password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const store = await Store.findOne({
      where: { shop }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Call your external API to verify authentication
    const authResponse = await verifyWMSAuthentication({
      "plugin_username":"",
      "plugin_password":"",
      "store_name":shop,
      "store_url":`${shop}.shopify.com`,
      "facility": wms_store_key,
      "store_id":wms_facility_id,
      "SSA_Login":wms_SSA_login,
      "SSA_Password":wms_SSA_password,
      "auth":true
    });

    if (!authResponse || authResponse?.status === 'FAILURE') {
      return res.status(401).json({ error: 'Authentication failed! Try again.' });
    }

    // Update store with WMS credentials and JWT token
    await store.update({
      wms_store_key,
      wms_facility_id,
      wms_SSA_login,
      wms_SSA_password,
      wms_jwt_token: authResponse.token // Assuming the API returns a token in the response
    });

    // Trigger order sync after successful WMS authentication
    try {
      console.log('Starting order sync after WMS authentication...');
      await webhookController.syncAllOrders(shop, store.accessToken);
      console.log('Order sync completed successfully');
    } catch (syncError) {
      console.error('Error during order sync:', syncError);
      // Don't fail the authentication response if sync fails
    }

    res.json({ 
      success: true, 
      message: 'Authentication successful',
      token: authResponse.token // Optionally return the token to the client
    });
  } catch (error) {
    console.error('WMS authentication error:', error);
    res.status(500).json({ error: 'Error during WMS authentication' });
  }
};

// Add new reset function
exports.resetWMS = async (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  try {
    const store = await Store.findOne({
      where: { shop }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Clear WMS credentials and token
    await store.update({
      wms_jwt_token: null,
    });

    res.json({ 
      success: true, 
      message: 'WMS credentials reset successfully'
    });
  } catch (error) {
    console.error('WMS reset error:', error);
    res.status(500).json({ error: 'Error resetting WMS credentials' });
  }
};

// Helper function to verify WMS authentication with external API
async function verifyWMSAuthentication(credentials) {
  try {
    console.log(credentials,'fsfsdfdsff')
    console.log(process.env.WMS_AUTH_API_URL)
    const response = await fetch(process.env.WMS_AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    console.log(process.env.WMS_AUTH_API_URL,'fdsfds')

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    // const data={
    //   token:"ffffff"
    // }
    console.log(data);
    return data;
    // return data.authenticated === true;
  } catch (error) {
    console.error('WMS API error:', error);
    return false;
  }
} 