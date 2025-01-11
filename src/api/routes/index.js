const express = require('express');
const routesV1 = require('./v1');
const healthRoute = require('./health.route');

const router = express.Router();

/**
 * GET /status
 */
router.get('/api/status', (req, res) => res.send('OK'));

/**
 * API Routes
 */
router.use(routesV1);
router.use('/app', healthRoute);

module.exports = router;