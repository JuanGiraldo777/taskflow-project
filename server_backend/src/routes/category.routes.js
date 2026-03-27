/**
 * @file server_backend/src/routes/category.routes.js
 * @description Definición de rutas de categorías bajo /api/v1/categories.
 */
const { Router } = require('express');
const productController = require('../controllers/product.controller');

const router = Router();

router.get('/', productController.getAllCategories);

module.exports = router;
