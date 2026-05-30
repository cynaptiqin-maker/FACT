'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
router.use(authenticate);
router.all('*', (req, res) => res.status(503).json({ message: 'Module under development', module: 'pharmacy-finance' }));
module.exports = router;
