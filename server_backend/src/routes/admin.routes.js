/**
 * @file server_backend/src/routes/admin.routes.js
 * @description Definición de rutas de administración bajo /api/v1/admin.
 */
const { Router } = require("express");
const adminController = require("../controllers/admin.controller");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

const router = Router();

router.use(verifyToken, verifyAdmin);

router.get("/users", adminController.getAllUsers);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
