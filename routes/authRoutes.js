const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth routes
router.get('/', authController.auth);
router.get('/callback', authController.authCallback);

module.exports = router; 