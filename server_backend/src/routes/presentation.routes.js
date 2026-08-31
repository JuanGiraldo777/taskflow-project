/**
 * @file server_backend/src/routes/presentation.routes.js
 * @description Definición de rutas de presentaciones (1oz, 3oz, combos...) bajo /api/v1/presentations.
 */
const { Router } = require('express');
const productController = require('../controllers/product.controller');

const router = Router();

router.get('/', productController.getAllPresentations);

module.exports = router;
