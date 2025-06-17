const express = require('express');
const router = express.Router();
const orderUpdateController = require('../controllers/orderUpdateController');

// Route to update order details
router.post('/aramex/order-sync-data', orderUpdateController.updateOrderDetails);

module.exports = router; 