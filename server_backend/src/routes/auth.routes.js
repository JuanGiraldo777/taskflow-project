/**
 * @file server_backend/src/routes/auth.routes.js
 * @description Definición de rutas de autenticación bajo /api/v1/auth.
 */
const { Router } = require("express");
const authController = require("../controllers/auth.controller");

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
