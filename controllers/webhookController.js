const Store = require('../models/Store');
const Order = require('../models/Order');
const { GraphQLClient } = require('graphql-request');
const crypto = require('crypto');

// Keep track of processed webhooks with timestamps
const processedWebhooks = new Map();
const WEBHOOK_TIMEOUT = 60000; // 1 minute

// Clean up old webhook IDs periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, timestamp] of processedWebhooks.entries()) {
    if (now - timestamp > WEBHOOK_TIMEOUT) {
      processedWebhooks.delete(id);
    }
  }
}, WEBHOOK_TIMEOUT);

// Helper function to check if WMS is authenticated
async function isWMSAuthenticated(shop) {
  const store = await Store.findOne({
    where: { shop }
  });
  return store && store.is_wms_authenticated;
}

// Function to fetch and save order data
const fetchAndSaveOrder = async (shop, accessToken, orderId) => {
  try {
    const client = new GraphQLClient(`https://${shop}/admin/api/2024-01/graphql.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });

    const orderQuery = `{
      order(id: "gid://shopify/Order/${orderId}") {
        id
        name
        createdAt
        totalPrice
        note
        email
        paymentGatewayNames
        transactions(first: 5) {
          gateway
        }
        billingAddress {
          address1
          address2
          city
          company
          country
          firstName
          lastName
          name
          phone
          province
          zip
        }
        shippingAddress {
          address1
          address2
          city
          company
          country
          firstName
          lastName
          name
          phone
          province
          zip
        }
        lineItems(first: 50) {
          edges {
            node {
              id
              title
              quantity
              taxLines {
                rate
                title
                price
                priceSet {
                  shopMoney {
                    amount
                  }
                }
              }
              variant {
                sku
                price
                title
                weight
                weightUnit
                inventoryQuantity
                product {
                  title
                  description
                  vendor
                  productType
                  tags
                  variants(first: 1) {
                    edges {
                      node {
                        sku
                        barcode
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;

    console.log(`Fetching order data for order ${orderId}...`);
    const orderData = await client.request(orderQuery);
    const order = orderData.order;

    console.log(`Fetching order data for order data ${order.lineItems}`);

    {order.lineItems.edges.map((e,i)=>{
      console.log(e,'orderlineITemData'+i);
      console.log(e.node.taxLines,'orderlineITemData'+i);
      // console.log(e.taxLines,'orderlineITemData'+i);
      e.node.taxLines?.map((t)=>{
        console.log(t,'tax data')
      })
    })}

    // Determine paymentType
    let paymentType = "Prepaid";
    if (
      (order.paymentGatewayNames && order.paymentGatewayNames.some(name => name.toLowerCase().includes("cod"))) ||
      (order.transactions && order.transactions.some(tx => tx.gateway === "cash_on_delivery"))
    ) {
      paymentType = "COD";
    }

    // Transform Shopify order data to match our new structure
    const orderDataToSave = {
      orderNumber: order.id.split('/').pop(),
      FreightChargeAmount: order.totalShippingPrice || null,
      dateTime: order.createdAt,
      b_address: {
        Address1: order.billingAddress?.address1 || "",
        Address2: order.billingAddress?.address2 || "",
        City: order.billingAddress?.city || "",
        Company: order.billingAddress?.company || "",
        Contact: order.billingAddress?.name || "",
        Country: order.billingAddress?.country || "",
        Email: order.email || "",
        Phone1: order.billingAddress?.phone || "",
        State: order.billingAddress?.province || "",
        ZipCode: order.billingAddress?.zip || ""
      },
      c_address: {
        Address1: order.billingAddress?.address1 || "",
        Address2: order.billingAddress?.address2 || "",
        City: order.billingAddress?.city || "",
        Company: order.billingAddress?.company || "",
        Contact: order.billingAddress?.name || "",
        Country: order.billingAddress?.country || "",
        Email: order.email || "",
        Phone1: order.billingAddress?.phone || "",
        State: order.billingAddress?.province || "",
        ZipCode: order.billingAddress?.zip || ""
      },
      d_address: {
        Address1: order.shippingAddress?.address1 || "",
        Address2: order.shippingAddress?.address2 || "",
        City: order.shippingAddress?.city || "",
        Company: order.shippingAddress?.company || "",
        Contact: order.shippingAddress?.name || "",
        Country: order.shippingAddress?.country || "",
        Email: order.email || "",
        Phone1: order.shippingAddress?.phone || "",
        State: order.shippingAddress?.province || "",
        ZipCode: order.shippingAddress?.zip || ""
      },
      plugin_key: "SHOPIFY",
      cts_service: '',
      cts_value: '',
      country: order.shippingAddress?.country || "IN",
      // facility: "WMWHSE2",
      plugin_store_name: shop,
      plugin_domain:'https://09b4-61-12-91-218.ngrok-free.app',
      store_notes: order.note || "",
      orderItems: order.lineItems.edges
        .filter(edge => {
          const tags = edge.node.variant?.product?.tags || [];
          return tags.includes('Aramex-Stock');
        })
        .map((edge, index) => ({
          extern_line_no: index + 1,
          qty: edge.node.quantity,
          sku: edge.node.variant?.sku || edge.node.variant?.product?.variants?.edges[0]?.node?.sku || "",
          unit_price: parseFloat(edge.node.variant?.price || 0),
          title: edge.node.title || "",
          tax_rate: edge.node.taxLines && edge.node.taxLines.length > 0 ? 
            parseFloat(edge.node.taxLines[0].price || 0) : 0
        }))
    }; 
    
    await Order.upsert(orderDataToSave, {
      where: {
        orderNumber: order.name,
        shop: shop
      }
    });
    delete orderDataToSave.shop;

    // Send order data to external API
    try {
      console.log('Sending order data to external API...');
      const store = await Store.findOne({ where: { shop } });
      if (!store || !store.wms_jwt_token) {
        console.error('Store not found or WMS not authenticated');
        throw new Error('Store not found or WMS not authenticated');
      }

      const response = await fetch('http://23.20.82.222:8000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.wms_jwt_token}`
        },
        body: JSON.stringify(orderDataToSave)
      });
console.log(response)
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log('Order data successfully sent to external API:', apiResponse);
    } catch (error) {
      console.log(error,'fdsdfsfsdfsdf')
      console.error('Error sending order data to external API:', error.message);
      // Don't throw the error as we still want to return success to Shopify
    }

    console.log(`Order ${orderId} processed successfully`);
    return true;
  } catch (error) {
    console.error(`Error processing order ${orderId}:`, error);
    throw error;
  }
};

// Sync all orders for a store
exports.syncAllOrders = async (shop, accessToken) => {
  try {
    console.log(`=== Starting Order Sync for shop: ${shop} ===`);
    
    const client = new GraphQLClient(`https://${shop}/admin/api/2024-01/graphql.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });

    let hasNextPage = true;
    let cursor = null;
    let totalOrders = 0;
    const BATCH_SIZE = 250; // Increased batch size for better performance
    const MAX_CONCURRENT_BATCHES = 5; // Number of parallel batches to process
    let activeBatches = 0;
    let pendingOrders = [];

    while (hasNextPage) {
      const ordersQuery = `{
        orders(first: ${BATCH_SIZE}${cursor ? `, after: "${cursor}"` : ''}) {
          edges {
            node {
              id
            }
            cursor
          }
          pageInfo {
            hasNextPage
          }
        }
      }`;

      const result = await client.request(ordersQuery);
      const orders = result.orders;

      // Add orders to pending queue
      pendingOrders.push(...orders.edges.map(edge => edge.node.id.split('/').pop()));

      // Process orders in parallel batches
      while (pendingOrders.length > 0 && activeBatches < MAX_CONCURRENT_BATCHES) {
        const batchOrders = pendingOrders.splice(0, BATCH_SIZE);
        activeBatches++;

        // Process batch in parallel
        Promise.all(batchOrders.map(orderId => 
          fetchAndSaveOrder(shop, accessToken, orderId)
            .catch(error => {
              console.error(`Error processing order ${orderId}:`, error);
              return null; // Continue with other orders even if one fails
            })
        )).then(() => {
          activeBatches--;
          totalOrders += batchOrders.length;
          console.log(`Processed ${totalOrders} orders so far...`);
        });
      }

      hasNextPage = orders.pageInfo.hasNextPage;
      if (hasNextPage) {
        cursor = orders.edges[orders.edges.length - 1].cursor;
      }
    }

    // Wait for any remaining batches to complete
    while (activeBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`=== Order Sync Complete. Processed ${totalOrders} orders ===`);
    return totalOrders;
  } catch (error) {
    console.error('Error syncing orders:', error);
    throw error;
  }
};

// Handle order webhooks
exports.handleOrderWebhook = async (req, res) => {
  try {
    const { topic, shop, data } = req.webhookData;
    console.log('=== Processing Order Webhook ===');
    console.log('Topic:', topic);
    console.log('Shop:', shop);
    console.log('Order ID:', data.id);

    // Create a unique webhook ID using shop and order ID only (not including topic)
    const webhookId = `${shop}-${data.id}`;
    
    // Check if this webhook was recently processed
    if (processedWebhooks.has(webhookId)) {
      console.log(`Order ${data.id} already processed recently: ${webhookId}`);
      return res.status(200).send('Order already processed');
    }

    // Add webhook to processed set with timestamp
    processedWebhooks.set(webhookId, Date.now());

    const store = await Store.findOne({ where: { shop } });
    if (!store) {
      console.error(`Store not found: ${shop}`);
      return res.status(404).send('Store not found');
    }

    // Process both create and update events
    await fetchAndSaveOrder(shop, store.accessToken, data.id);

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Error processing webhook');
  }
};

// Register webhooks for a store
exports.registerWebhooks = async (shop, accessToken) => {
  console.log(`=== Starting Webhook Registration for shop: ${shop} ===`);
  console.log('Access Token:', accessToken ? 'Present' : 'Missing');
  
  if (!process.env.SHOPIFY_APP_URL) {
    console.error('SHOPIFY_APP_URL environment variable is not set');
    throw new Error('SHOPIFY_APP_URL environment variable is not set');
  }

  const baseUrl = process.env.SHOPIFY_APP_URL.replace(/\/$/, '');
  console.log('Base URL for webhooks:', baseUrl);
  
  try {
    const webhooks = [
      {
        topic: 'orders/create',
        address: `${baseUrl}/webhooks/orders`,
        format: 'json'
      },
      {
        topic: 'orders/updated',
        address: `${baseUrl}/webhooks/orders`,
        format: 'json'
      },
      {
        topic: 'app/uninstalled',
        address: `${baseUrl}/webhooks/app/uninstalled`,
        format: 'json'
      }
    ];

    console.log('Webhooks to register:', JSON.stringify(webhooks, null, 2));

    // First, get existing webhooks
    console.log('Fetching existing webhooks...');
    const response = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch existing webhooks:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch existing webhooks: ${response.statusText}`);
    }

    const { webhooks: existingWebhooks } = await response.json();
    console.log(`Found ${existingWebhooks.length} existing webhooks:`, JSON.stringify(existingWebhooks, null, 2));

    // Delete existing webhooks
    for (const webhook of existingWebhooks) {
      console.log(`Deleting existing webhook: ${webhook.topic} (ID: ${webhook.id})`);
      const deleteResponse = await fetch(`https://${shop}/admin/api/2024-01/webhooks/${webhook.id}.json`, {
        method: 'DELETE',
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      });
      
      if (!deleteResponse.ok) {
        console.error(`Failed to delete webhook ${webhook.topic}:`, await deleteResponse.text());
      } else {
        console.log(`Successfully deleted webhook: ${webhook.topic}`);
      }
    }

    // Register new webhooks
    for (const webhook of webhooks) {
      try {
        console.log(`Registering webhook: ${webhook.topic}`);
        const response = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({ webhook })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to register webhook ${webhook.topic}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
        } else {
          const result = await response.json();
          console.log(`Successfully registered webhook: ${webhook.topic}`, JSON.stringify(result, null, 2));
        }
      } catch (error) {
        console.error(`Error registering webhook ${webhook.topic}:`, error);
      }
    }
    
    console.log('=== Webhook Registration Complete ===');
  } catch (error) {
    console.error('Error in webhook registration:', error);
    throw error;
  }
};

// Handle app uninstall webhook
exports.handleAppUninstalled = async (req, res) => {
  try {
    const { topic, shop, data } = req.webhookData;
    console.log('=== Processing App Uninstall Webhook ===');
    console.log('Webhook Data:', {
      topic,
      shop,
      data: JSON.stringify(data, null, 2)
    });
    console.log('Request Headers:', JSON.stringify(req.headers, null, 2));

    const store = await Store.findOne({ where: { shop } });
    if (!store) {
      console.error(`Store not found: ${shop}`);
      return res.status(404).send('Store not found');
    }

    console.log('Found store:', {
      shop: store.shop,
      hasJWT: !!store.wms_jwt_token,
      hasStoreKey: !!store.wms_store_key
    });

    // Only clear the JWT token
    const updateResult = await store.update({
      wms_jwt_token: null,
      wms_store_key: null,
      wms_facility_id: null,
      wms_SSA_login: null,
      wms_SSA_password: null
    });

    console.log('Update result:', JSON.stringify(updateResult, null, 2));
    console.log(`JWT token cleared for shop: ${shop}`);
    res.status(200).send('JWT token cleared successfully');
  } catch (error) {
    console.error('App uninstall webhook error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).send('Error processing app uninstall webhook');
  }
}; 