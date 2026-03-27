/**
 * @file server_backend/src/routes/cart.routes.js
 * @description Definición de rutas de carrito bajo /api/v1/cart.
 */
const { Router } = require("express");
const cartController = require("../controllers/cart.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = Router();

router.use(verifyToken);

router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.put("/items/:id", cartController.updateQuantity);
router.delete("/items/:id", cartController.removeItem);
router.delete("/", cartController.clearCart);

module.exports = router;
