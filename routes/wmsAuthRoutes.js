const express = require('express');
const router = express.Router();
const wmsAuthController = require('../controllers/wmsAuthController');

router.post('/authenticate', wmsAuthController.authenticateWMS);

module.exports = router; 