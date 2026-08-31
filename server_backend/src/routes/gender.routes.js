/**
 * @file server_backend/src/routes/gender.routes.js
 * @description Definición de rutas de sexos (Dama/Caballero/Unisex) bajo /api/v1/genders.
 */
const { Router } = require('express');
const productController = require('../controllers/product.controller');

const router = Router();

router.get('/', productController.getAllGenders);

module.exports = router;
