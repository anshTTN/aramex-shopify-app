const { GraphQLClient } = require('graphql-request');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Shop = require('../models/Shop');

// Helper function to check if WMS is authenticated
async function isWMSAuthenticated(shop) {
  const store = await Store.findOne({
    where: { shop }
  });
  return store && store.is_wms_authenticated;
}

exports.syncAll = async (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).json({ error: 'Missing shop parameter' });

  // Check if WMS is authenticated before syncing
  const authenticated = await isWMSAuthenticated(shop);
  if (!authenticated) {
    return res.status(403).json({ error: 'WMS authentication required before syncing' });
  }

  const store = await Store.findOne({
    where: { shop: shop }
  });
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const client = new GraphQLClient(`https://${shop}/admin/api/2024-01/graphql.json`, {
    headers: { 'X-Shopify-Access-Token': store.accessToken }
  });

  try {
    // 1. Sync Products
    const productsQuery = `{
      products(first: 10) {
        edges {
          node {
            id
            title
            description
            images(first: 1) { edges { node { url } } }
            variants(first: 10) {
              edges {
                node {
                  title
                  price
                  inventoryQuantity
                }
              }
            }
          }
        }
      }
    }`;
    const productsData = await client.request(productsQuery);
    
    // Process and save products
    for (const edge of productsData.products.edges) {
      const product = edge.node;
      await Product.create({
        shop,
        productId: product.id,
        title: product.title,
        description: product.description,
        imageUrl: product.images.edges[0]?.node.url,
        variants: JSON.stringify(product.variants.edges.map(e => e.node))
      });
    }

    // 2. Sync Orders
    const ordersQuery = `{
      orders(first: 10) {
        edges {
          node {
            id
            email
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  price
                }
              }
            }
          }
        }
      }
    }`;
    const ordersData = await client.request(ordersQuery);
    
    // Process and save orders
    for (const edge of ordersData.orders.edges) {
      const order = edge.node;
      await Order.create({
        shop,
        orderId: order.id,
        email: order.email,
        lineItems: JSON.stringify(order.lineItems.edges.map(e => e.node))
      });
    }

    // 3. Sync Customers
    const customersQuery = `{
      customers(first: 10) {
        edges {
          node {
            id
            firstName
            lastName
            email
          }
        }
      }
    }`;
    const customersData = await client.request(customersQuery);
    
    // Process and save customers
    for (const edge of customersData.customers.edges) {
      const customer = edge.node;
      await Customer.create({
        shop,
        customerId: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email
      });
    }

    // 4. Sync Shop Details
    const shopQuery = `{
      shop {
        id
        name
        email
        myshopifyDomain
        primaryDomain { url }
        currencyCode
        plan { displayName }
      }
    }`;
    const shopData = await client.request(shopQuery);
    
    // Save shop details
    await Shop.create({
      shop,
      name: shopData.shop.name,
      email: shopData.shop.email,
      myshopifyDomain: shopData.shop.myshopifyDomain,
      primaryDomain: shopData.shop.primaryDomain.url,
      currencyCode: shopData.shop.currencyCode,
      plan: shopData.shop.plan.displayName
    });

    res.json({ success: true, message: 'Sync completed successfully' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Error during sync', details: error.message });
  }
}; 