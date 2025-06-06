const express = require('express');
const router = express.Router();
const orderUpdateController = require('../controllers/orderUpdateController');

// Route to update order details
router.post('/api/orders/update', orderUpdateController.updateOrderDetails);

module.exports = router; 