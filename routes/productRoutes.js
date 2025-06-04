const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const shopifyDataController = require('../controllers/shopifyDataController');
const syncController = require('../controllers/syncController');

router.get('/api/sync-products', productController.syncProducts);
router.get('/api/products', productController.getProducts);

// New APIs for order details and user (shop) details
router.get('/api/order-details', shopifyDataController.getOrderDetails);
router.get('/api/user-details', shopifyDataController.getUserDetails);

// Sync all data (products, shop, orders, customers)
router.get('/api/sync-all', syncController.syncAll);

module.exports = router; 