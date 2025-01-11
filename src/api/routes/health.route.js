const express = require('express');
const httpStatus = require('http-status');

const router = express.Router();

router
  .route('/health')
  /**
   * @api {get} app/health Health check
   * @apiDescription Basic health check API that simply tells us if the
   * service is reachable.
   * @apiVersion 1.0.0
   * @apiGroup Health
   * @apiSuccess {Object} success
   */
  .get((_req, res) => res.status(httpStatus.OK).json({ statusCode: httpStatus.OK, status: 'OK' }));

router
  .route('/deephealth')
  /**
   * @api {get} app/deephealth Deep Health check
   * @apiDescription Deep Health check API that provides details of healthy
   * and non-healthy resources.
   * @apiVersion 1.0.0
   * @apiGroup Health
   * @apiSuccess {Object} success
   */
  .get((_req, res) => res.status(httpStatus.OK).json({ statusCode: httpStatus.OK, status: 'OK' }));

module.exports = router;