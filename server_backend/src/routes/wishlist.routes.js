const { Router } = require("express");
const wishlistController = require("../controllers/wishlist.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = Router();

router.use(verifyToken);

router.get("/", wishlistController.getWishlist);
router.post("/", wishlistController.addItem);
router.delete("/:id", wishlistController.removeItem);
router.delete("/", wishlistController.clearWishlist);

module.exports = router;
