const { GraphQLClient } = require('graphql-request');
const Store = require('../models/Store');
const Product = require('../models/Product');

const GET_PRODUCTS = `
  query {
    products(first: 10) {
      edges {
        node {
          id
          title
          description
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                inventoryQuantity
              }
            }
          }
        }
      }
    }
  }
`;

exports.syncProducts = async (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).json({ error: 'Missing shop parameter' });
  try {
    const store = await Store.findOne({ shop });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    const shopifyClient = new GraphQLClient(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      { headers: { 'X-Shopify-Access-Token': store.accessToken } }
    );
    const data = await shopifyClient.request(GET_PRODUCTS);
    for (const { node } of data.products.edges) {
      const productData = {
        shopifyId: node.id,
        shop,
        title: node.title,
        description: node.description,
        images: node.images.edges.map(edge => edge.node.url),
        variants: node.variants.edges.map(edge => ({
          title: edge.node.title,
          price: parseFloat(edge.node.price),
          inventoryQuantity: edge.node.inventoryQuantity
        }))
      };
      await Product.findOneAndUpdate(
        { shopifyId: node.id, shop },
        productData,
        { upsert: true, new: true }
      );
    }
    res.json({ message: 'Products synced successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync products' });
  }
};

exports.getProducts = async (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).json({ error: 'Missing shop parameter' });
  try {
    const products = await Product.find({ shop });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}; 