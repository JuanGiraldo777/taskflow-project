/**
 * @file server_backend/src/routes/review.routes.js
 * @description Definición de rutas de reseñas bajo /api/v1/reviews.
 */
const { Router } = require("express");
const reviewController = require("../controllers/review.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = Router();

// Ver reseñas es publico - no requiere token
router.get("/:productId", reviewController.getByProduct);

// Crear reseña requiere token
router.post("/:productId", verifyToken, reviewController.create);

module.exports = router;
