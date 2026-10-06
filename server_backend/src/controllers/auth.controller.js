/**
 * @file server_backend/src/controllers/auth.controller.js
 * @description Controlador de autenticación: registro e inicio de sesión.
 */
const authService = require("../services/auth.service");
const { text, isValidEmail } = require("../utils/validation");

// ── POST /api/v1/auth/register ──────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const fullName = text(req.body.fullName);
    const email = text(req.body.email);
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ error: "fullName, email y password son obligatorios" });
    }
    // Autorización previa y expresa (Ley 1581 de 2012, art. 9): sin la
    // casilla marcada no se crea la cuenta.
    if (req.body.acceptPrivacy !== true) {
      return res.status(400).json({
        error: "Para crear tu cuenta debes aceptar la Política de Tratamiento de Datos.",
      });
    }
    if (fullName.length < 2 || fullName.length > 100) {
      return res
        .status(400)
        .json({ error: "El nombre debe tener entre 2 y 100 caracteres" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "El email no es válido" });
    }
    // Mínimo 8 solo para cuentas NUEVAS (el login acepta las de 6-7 que ya
    // existen). Máximo 72 BYTES: bcrypt ignora todo lo que pase de ahí.
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
      return res
        .status(400)
        .json({ error: "La contraseña no puede superar los 72 caracteres" });
    }

    const user = await authService.register({ fullName, email, password });
    res.status(201).json(user);
  } catch (err) {
    if (err.message === "EMAIL_TAKEN") {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    next(err);
  }
};

// ── POST /api/v1/auth/login ─────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const email = text(req.body.email);
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "email y password son obligatorios" });
    }

    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    if (err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }
    next(err);
  }
};

module.exports = { register, login };
