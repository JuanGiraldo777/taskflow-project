const { Router } = require("express");
const userController = require("../controllers/user.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = Router();

// Todas las rutas de usuario requieren token válido
router.use(verifyToken);

router.get("/:id", userController.getById);
router.put("/:id", userController.update);
router.delete("/:id", userController.remove);
router.get("/:id/history", userController.getHistory);
router.post("/:id/history", userController.addToHistory);

module.exports = router;
