/**
 * @file server_backend/src/routes/brand.routes.js
 * @description Definición de rutas de marcas bajo /api/v1/brands.
 */
const { Router } = require('express');
const productController = require('../controllers/product.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyAdmin = require('../middlewares/verifyAdmin');

const router = Router();

router.get('/', productController.getAllBrands);
router.post('/', verifyToken, verifyAdmin, productController.createBrand);

module.exports = router;
