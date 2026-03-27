/**
 * @file server_backend/src/routes/product.routes.js
 * @description Definición de rutas de productos bajo /api/v1/products.
 */
const { Router } = require("express");
const productController = require("../controllers/product.controller");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

const router = Router();

router.get("/", productController.getAll);
router.get("/:id/related", productController.getRelated);
router.get("/:id", productController.getById);

router.post("/", verifyToken, verifyAdmin, productController.createProduct);
router.put("/:id", verifyToken, verifyAdmin, productController.updateProduct);
router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  productController.deleteProduct,
);

module.exports = router;
