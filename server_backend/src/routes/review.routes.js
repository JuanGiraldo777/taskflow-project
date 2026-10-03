/**
 * @file server_backend/src/routes/review.routes.js
 * @description Definición de rutas de reseñas bajo /api/v1/reviews.
 */
const { Router } = require("express");
const reviewController = require("../controllers/review.controller");
const verifyToken = require("../middlewares/verifyToken");
const antiSpam = require("../middlewares/antiSpam");
const { reviewLimiter } = require("../middlewares/rateLimits");

const router = Router();

// ── Reseñas de TIENDA (sin productId) ───────────────────────────────────────
// IMPORTANTE: estas rutas van ANTES de /:productId
router.get("/", reviewController.getStoreReviews);
router.post("/", verifyToken, reviewLimiter, antiSpam, reviewController.createStoreReview);

// ── Reseñas de PRODUCTO (con productId) ─────────────────────────────────────
router.get("/:productId", reviewController.getByProduct);

router.post("/:productId", verifyToken, reviewLimiter, antiSpam, reviewController.create);

module.exports = router;
