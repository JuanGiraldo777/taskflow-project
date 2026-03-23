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
