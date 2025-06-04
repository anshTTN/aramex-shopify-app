# Shopify Store Connector

This Node.js application is a public Shopify app that can be installed by any Shopify store. It connects stores with their websites using the Shopify Admin API with GraphQL and syncs product information to a local database.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Shopify Partner account
- Shopify app credentials (API key and secret)

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   APP_URL=your_app_url
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   ```

4. Start the application:
   ```bash
   npm run dev
   ```

## Installation Process

1. Store owners can install your app by visiting:
   ```
   https://your-app-url/auth?shop=store-name.myshopify.com
   ```

2. They will be redirected to Shopify's OAuth screen to authorize the app
3. After authorization, the app will be installed and can start syncing products

## API Endpoints

- `GET /auth`: Initiates the OAuth installation process
- `GET /auth/callback`: Handles the OAuth callback from Shopify
- `GET /api/sync-products?shop=store-name.myshopify.com`: Syncs products from a specific store
- `GET /api/products?shop=store-name.myshopify.com`: Retrieves all products for a specific store

## Features

- OAuth authentication for multiple stores
- GraphQL integration with Shopify Admin API
- MongoDB database for storing product information
- Automatic product synchronization
- RESTful API endpoints for accessing product data
- Support for multiple stores

## Security

Make sure to:
- Keep your `.env` file secure and never commit it to version control
- Use environment variables for sensitive information
- Implement proper authentication for your API endpoints in production
- Validate all incoming requests from Shopify
- Use HTTPS in production

## Development

To test the app locally:
1. Use a tool like ngrok to create a secure tunnel to your local server
2. Update your app's URL in the Shopify Partner dashboard to point to your ngrok URL
3. Update the APP_URL in your .env file to match your ngrok URL

## Support

For any issues or questions, please open an issue in the repository. 