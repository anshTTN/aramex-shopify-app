// const Store = require("../models/Store");
// const { GraphQLClient } = require("graphql-request");

// const decodeJwt = (token) => {
//   try {
//     const payload = token.split(".")[1];
//     const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
//     const jsonPayload = decodeURIComponent(
//       atob(base64)
//         .split("")
//         .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
//         .join("")
//     );
//     return JSON.parse(jsonPayload);
//   } catch (error) {
//     console.error("Error decoding token:", error);
//     return null;
//   }
// };

// const mapToShopifyStatus = (status) => {
//   const statusMap = {
//     "Created Externally": "UNFULFILLED",
//     Allocated: "UNFULFILLED",
//     "Did Not Allocate": "UNFULFILLED",
//     Released: "UNFULFILLED",
//     "Picked Complete": "PARTIALLY_FULFILLED",
//     "Pack Complete": "PARTIALLY_FULFILLED",
//     Blocked: "UNFULFILLED",
//     "Cancelled Internally": "CANCELLED",
//     "Cancelled Externally": "CANCELLED",
//     "Shipped Complete": "FULFILLED",
//     "Delivered Accepted": "FULFILLED",
//     "Delivered Rejected": "PARTIALLY_FULFILLED",
//   };

//   return statusMap[status] || "UNFULFILLED";
// };

// exports.updateOrderDetails = async (req, res) => {
//   try {
//     const { store_name, order_id, AWB, LatestStatus } = req.body;
//     console.log(store_name, order_id);

//     // Validate required fields
//     if (!store_name || !order_id) {
//       return res.status(400).json({
//         error: "Missing required fields",
//         required: ["store_name", "order_id"],
//       });
//     }

//     // Get and validate bearer token
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ error: "Missing or invalid bearer token" });
//     }

//     const token = authHeader.split(" ")[1];
//     const decodedToken = decodeJwt(token);
//     console.log(decodedToken, "decodedToken");

//     if (!decodedToken) {
//       return res.status(401).json({ error: "Invalid token format" });
//     }

//     // Find store and get access token
//     const store = await Store.findOne({
//       where: { shop:store_name },
//     });

//     if (!store) {
//       return res.status(404).json({ error: "Store not found" });
//     }

//     // Decode store's JWT token
//     const storeDecodedToken = decodeJwt(store.wms_jwt_token);
//     console.log(storeDecodedToken, "storeDecodedToken");
//     if (!storeDecodedToken) {
//       return res.status(401).json({ error: "Invalid store token" });
//     }

//     // Verify facility and store ID match
//     if (
//       decodedToken.facility !== storeDecodedToken.facility ||
//       decodedToken.storerkey !== storeDecodedToken.storerkey
//     ) {
//       return res.status(403).json({
//         error: "Invalid facility or store ID",
//         message:
//           "The provided facility and store ID do not match the store configuration",
//       });
//     }

//     // Initialize GraphQL client
//     const client = new GraphQLClient(
//       `https://${store_name}/admin/api/2024-01/graphql.json`,
//       {
//         headers: { "X-Shopify-Access-Token": store.accessToken },
//       }
//     );

//     // First, get the order's fulfillment orders
//     const getOrderQuery = `
//       query getOrder($id: ID!) {
//         order(id: $id) {
//           id
//           name
//           fulfillmentOrders(first: 1) {
//             edges {
//               node {
//                 id
//                 lineItems(first: 50) {
//                   edges {
//                     node {
//                       id
//                       remainingQuantity
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     `;

//     const orderData = await client.request(getOrderQuery, {
//       id: `gid://shopify/Order/${order_id}`,
//     });

//     // Get the first fulfillment order and its line items
//     console.log(orderData);
//     const fulfillmentOrder = orderData.order.fulfillmentOrders.edges[0].node;
//     const lineItems = fulfillmentOrder.lineItems.edges
//       .filter((edge) => edge.node.remainingQuantity > 0)
//       .map((edge) => ({
//         id: edge.node.id,
//         quantity: edge.node.remainingQuantity,
//       }));

//     // Check if there are any line items to fulfill
//     if (lineItems.length === 0) {
//       return res.status(400).json({
//         error: "No fulfillable items found",
//         message: "All items in this order have already been fulfilled",
//       });
//     }

//     const mutation = `
//       mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
//         fulfillmentCreateV2(fulfillment: $fulfillment) {
//           fulfillment {
//             id
//             trackingInfo {
//               number
//               company
//               url
//             }
//             status
//           }
//           userErrors {
//             field
//             message
//           }
//         }
//       }
//     `;

//     // Variables for the mutation
//     const variables = {
//       fulfillment: {
//         lineItemsByFulfillmentOrder: [
//           {
//             fulfillmentOrderId: fulfillmentOrder.id,
//             fulfillmentOrderLineItems: lineItems,
//           },
//         ],
//         trackingInfo:
//           AWB !== ""
//             ? {
//                 number: AWB,
//                 company: "Other",
//                 url:
//                   decodedToken.facility === "WMWHSE9"
//                     ? "https://www.track.aramex.nl/order-status?code=eyJlbWFpbCI6InRyYWNrQGFyYW1leC5ubCJ9&order-number=" +
//                       AWB
//                     : "https://www.aramex.com/sa/en/track/results?mode=0&ShipmentNumber=" +
//                       AWB,
//               }
//             : {
//                 number: AWB,
//               },
//         notifyCustomer: true,
//       },
//     };

//     const response = await client.request(mutation, variables);

//     // Check if tracking info was updated successfully or if there are no errors
//     if (
//       response.fulfillmentCreateV2.fulfillment?.trackingInfo?.number === AWB ||
//       (response.fulfillmentCreateV2.userErrors &&
//         response.fulfillmentCreateV2.userErrors.length === 0)
//     ) {
//       // If status is provided, try to update it separately
//       if (LatestStatus) {
//         try {
//           const mappedStatus = mapToShopifyStatus(LatestStatus);
//           console.log("Original Status:", LatestStatus);
//           console.log("Mapped Status:", mappedStatus);

//           const statusUpdateResponse = await client.request(
//             `
//             mutation orderUpdate($input: OrderInput!) {
//               orderUpdate(input: $input) {
//                 order {
//                   id
//                   displayFulfillmentStatus
//                   fulfillments(first: 1) {
//                     nodes {
//                       status
//                     }
//                   }
//                 }
//                 userErrors {
//                   field
//                   message
//                 }
//               }
//             }
//           `,
//             {
//               input: {
//                 id: `gid://shopify/Order/${order_id}`,
//                 fulfillments: [
//                   {
//                     status: mappedStatus,
//                   },
//                 ],
//               },
//             }
//           );

//           // Log the response to verify the status update
//           console.log("Status Update Response:", statusUpdateResponse);

//           if (
//             statusUpdateResponse.orderUpdate.userErrors &&
//             statusUpdateResponse.orderUpdate.userErrors.length > 0
//           ) {
//             console.error(
//               "Status update errors:",
//               statusUpdateResponse.orderUpdate.userErrors
//             );
//           }
//         } catch (statusError) {
//           console.error("Status update failed:", statusError);
//         }
//       }

//       return res.json({
//         success: true,
//         message: "Order updated successfully",
//         fulfillment: response.fulfillmentCreateV2.fulfillment,
//       });
//     }

//     // Only return error if there are actual errors
//     if (
//       response.fulfillmentCreateV2.userErrors &&
//       response.fulfillmentCreateV2.userErrors.length > 0
//     ) {
//       return res.status(400).json({
//         error: "Failed to update order",
//         details: response.fulfillmentCreateV2.userErrors,
//       });
//     }

//     // If we get here, consider it a success
//     return res.json({
//       success: true,
//       message: "Order updated successfully",
//       fulfillment: response.fulfillmentCreateV2.fulfillment,
//     });
//   } catch (error) {
//     console.error("Error updating order:", error);
//     res.status(500).json({
//       error: "Failed to update order",
//       details: error.message,
//     });
//   }
// };

const Store = require("../models/Store");
const { GraphQLClient } = require("graphql-request");

const decodeJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const mapToShopifyStatus = (status) => {
  const statusMap = {
    "Created Externally": "UNFULFILLED",
    Allocated: "UNFULFILLED",
    "Did Not Allocate": "UNFULFILLED",
    Released: "UNFULFILLED",
    "Picked Complete": "PARTIALLY_FULFILLED",
    "Pack Complete": "PARTIALLY_FULFILLED",
    Blocked: "UNFULFILLED",
    "Cancelled Internally": "CANCELLED",
    "Cancelled Externally": "CANCELLED",
    "Shipped Complete": "FULFILLED",
    "Delivered Accepted": "FULFILLED",
    "Delivered Rejected": "PARTIALLY_FULFILLED",
  };

  return statusMap[status] || "UNFULFILLED";
};

exports.updateOrderDetails = async (req, res) => {
  try {
    const { store_name, order_id, AWB, LatestStatus } = req.body;
    console.log(store_name, order_id);

    // Validate required fields
    if (!store_name || !order_id) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["store_name", "order_id"],
      });
    }

    // Get and validate bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid bearer token" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = decodeJwt(token);
    console.log(decodedToken, "decodedToken");

    if (!decodedToken) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Find store and get access token
    const store = await Store.findOne({
      where: { shop: store_name },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Decode store's JWT token
    const storeDecodedToken = decodeJwt(store.wms_jwt_token);
    console.log(storeDecodedToken, "storeDecodedToken");
    if (!storeDecodedToken) {
      return res.status(401).json({ error: "Invalid store token" });
    }

    // Verify facility and store ID match
    if (
      decodedToken.facility !== storeDecodedToken.facility ||
      decodedToken.storerkey !== storeDecodedToken.storerkey
    ) {
      return res.status(403).json({
        error: "Invalid facility or store ID",
        message:
          "The provided facility and store ID do not match the store configuration",
      });
    }

    // Initialize GraphQL client
    const client = new GraphQLClient(
      `https://${store_name}/admin/api/2024-01/graphql.json`,
      {
        headers: { "X-Shopify-Access-Token": store.accessToken },
      }
    );

    // First, get the order's fulfillment orders
    const getOrderQuery = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          name
          fulfillments(first: 1) {
            edges {
              node {
                id
                status
                trackingInfo {
                  number
                  company
                  url
                }
              }
            }
          }
        }
      }
    `;

    const orderData = await client.request(getOrderQuery, {
      id: `gid://shopify/Order/${order_id}`,
    });

    // Get the first fulfillment order
    console.log(orderData);
    const fulfillment = orderData.order.fulfillments.edges[0]?.node;

    // If fulfillment doesn't exist, create a new one (if needed)
    if (!fulfillment) {
      return res.status(400).json({
        error: "No fulfillment found for the order",
        message: "Order fulfillment does not exist",
      });
    }

    const mappedStatus = mapToShopifyStatus(LatestStatus);
    console.log("Original Status:", LatestStatus);
    console.log("Mapped Status:", mappedStatus);

    const mutation = `
      mutation fulfillmentUpdate($input: FulfillmentInput!) {
        fulfillmentUpdate(input: $input) {
          fulfillment {
            id
            trackingInfo {
              number
              company
              url
            }
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Variables for the mutation to update fulfillment status and tracking info
    const variables = {
      input: {
        id: fulfillment.id,
        trackingInfo: {
          number: AWB,
          company: "Other",
          url: `https://www.track.aramex.nl/order-status?code=${AWB}`,
        },
        status: mappedStatus, // Update the fulfillment status
      },
    };

    const response = await client.request(mutation, variables);

    // Check if tracking info was updated successfully or if there are no errors
    if (
      response.fulfillmentUpdate.fulfillment?.trackingInfo?.number === AWB ||
      (response.fulfillmentUpdate.userErrors &&
        response.fulfillmentUpdate.userErrors.length === 0)
    ) {
      return res.json({
        success: true,
        message: "Order fulfillment updated successfully",
        fulfillment: response.fulfillmentUpdate.fulfillment,
      });
    }

    // Only return error if there are actual errors
    if (
      response.fulfillmentUpdate.userErrors &&
      response.fulfillmentUpdate.userErrors.length > 0
    ) {
      return res.status(400).json({
        error: "Failed to update order",
        details: response.fulfillmentUpdate.userErrors,
      });
    }

    return res.json({
      success: true,
      message: "Order updated successfully",
      fulfillment: response.fulfillmentUpdate.fulfillment,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      error: "Failed to update order",
      details: error.message,
    });
  }
};
