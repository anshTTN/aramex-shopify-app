const Store = require('../models/Store');
const { GraphQLClient } = require('graphql-request');

exports.getOrderDetails = async (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).json({ error: 'Missing shop parameter' });
  
  const store = await Store.findOne({
    where: { shop: shop }
  });
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const client = new GraphQLClient(`https://${shop}/admin/api/2024-01/graphql.json`, {
    headers: { 'X-Shopify-Access-Token': store.accessToken }
  });

  const query = `{
    orders(first: 10) {
      edges {
        node {
          id
          name
          email
          createdAt
          totalPrice
          lineItems(first: 5) { edges { node { title quantity price } } }
        }
      }
    }
  }`;

  try {
    const data = await client.request(query);
    res.json(data.orders.edges.map(e => e.node));
  } catch (error) {
    console.error('Order details error:', error);
    res.status(500).json({ error: 'Failed to fetch order details', details: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).json({ error: 'Missing shop parameter' });
  
  const store = await Store.findOne({
    where: { shop: shop }
  });
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const client = new GraphQLClient(`https://${shop}/admin/api/2024-01/graphql.json`, {
    headers: { 'X-Shopify-Access-Token': store.accessToken }
  });

  const query = `{
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

  try {
    const data = await client.request(query);
    res.json(data.shop);
  } catch (error) {
    console.error('User details error:', error);
    res.status(500).json({ error: 'Failed to fetch shop details', details: error.message });
  }
}; 