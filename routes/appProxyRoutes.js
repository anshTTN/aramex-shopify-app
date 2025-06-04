const express = require('express');
const router = express.Router();
const appProxyController = require('../controllers/appProxyController');

router.get('/app-proxy', appProxyController.appProxy);
router.get('/', appProxyController.rootRedirect);

module.exports = router; 