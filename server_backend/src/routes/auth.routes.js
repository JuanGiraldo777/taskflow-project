/**
 * @file server_backend/src/routes/auth.routes.js
 * @description Definición de rutas de autenticación bajo /api/v1/auth.
 */
const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const antiSpam = require("../middlewares/antiSpam");
const { registerLimiter, loginLimiter } = require("../middlewares/rateLimits");

const router = Router();

router.post("/register", registerLimiter, antiSpam, authController.register);
router.post("/login", loginLimiter, authController.login);

module.exports = router;
