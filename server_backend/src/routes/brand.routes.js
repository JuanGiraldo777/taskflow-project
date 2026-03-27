/**
 * @file server_backend/src/routes/brand.routes.js
 * @description Definición de rutas de marcas bajo /api/v1/brands.
 */
const { Router } = require('express');
const productController = require('../controllers/product.controller');

const router = Router();

router.get('/', productController.getAllBrands);

module.exports = router;
