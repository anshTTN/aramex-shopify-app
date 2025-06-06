const Store = require('../models/Store');
const { GraphQLClient } = require('graphql-request');

exports.updateOrderDetails = async (req, res) => {
  try {
    const { shop, orderId, referenceNumber, trackingNumber, orderStatus } = req.body;

    // Validate required fields
    if (!shop || !orderId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['shop', 'orderId']
      });
    }

    // Find store and get access token
    const store = await Store.findOne({
      where: { shop }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Initialize GraphQL client
    const client = new GraphQLClient(`https://${shop}/admin/api/2024-01/graphql.json`, {
      headers: { 'X-Shopify-Access-Token': store.accessToken }
    });

    // Prepare the mutation
    const mutation = `
      mutation orderUpdate($input: OrderInput!) {
        orderUpdate(input: $input) {
          order {
            id
            name
            note
            fulfillmentStatus
            trackingInfo {
              number
              company
            }
            metafields(first: 10) {
              edges {
                node {
                  id
                  key
                  value
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Prepare the input variables
    const variables = {
      input: {
        id: `gid://shopify/Order/${orderId}`,
        note: referenceNumber ? `Reference Number: ${referenceNumber}` : undefined,
        fulfillmentStatus: orderStatus ? orderStatus.toUpperCase() : undefined,
        trackingInfo: trackingNumber ? {
          number: trackingNumber,
          company: "Standard Shipping" // You can customize this
        } : undefined
      }
    };

    // Execute the mutation
    const response = await client.request(mutation, variables);

    // Check for errors
    if (response.orderUpdate.userErrors.length > 0) {
      return res.status(400).json({
        error: 'Failed to update order',
        details: response.orderUpdate.userErrors
      });
    }

    // If reference number is provided, add it as a metafield
    if (referenceNumber) {
      const metafieldMutation = `
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const metafieldVariables = {
        metafields: [{
          ownerId: `gid://shopify/Order/${orderId}`,
          namespace: "custom",
          key: "reference_number",
          value: referenceNumber,
          type: "single_line_text_field"
        }]
      };

      await client.request(metafieldMutation, metafieldVariables);
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      order: response.orderUpdate.order
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      error: 'Failed to update order',
      details: error.message
    });
  }
}; 