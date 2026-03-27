/**
 * @file server_backend/src/middlewares/errorHandler.js
 * @description Middleware global de errores con mapeo semántico a HTTP.
 */
const { nodeEnv } = require("../config/env");

const errorHandler = (err, req, res, next) => {
  // Log interno siempre — para debugging en servidor
  console.error(`[${new Date().toISOString()}] ${err.message}`);

  // ── JSON malformado (SyntaxError de express.json()) ─────────────────────
  // Error del cliente — el body no es JSON válido
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res
      .status(400)
      .json({ error: "JSON malformado en el body de la petición" });
  }

  // ── Errores de negocio — mapeo semántico a HTTP ──────────────────────────
  const businessErrors = {
    NOT_FOUND: { status: 404, message: "Recurso no encontrado" },
    INVALID_CREDENTIALS: {
      status: 401,
      message: "Email o contraseña incorrectos",
    },
    EMAIL_TAKEN: { status: 409, message: "El email ya está registrado" },
    ALREADY_REVIEWED: {
      status: 409,
      message: "Ya has dejado una reseña para este producto",
    },
    OUT_OF_STOCK: { status: 400, message: "Stock insuficiente" },
    INVALID_QUANTITY: {
      status: 400,
      message: "La cantidad debe ser mayor que 0",
    },
  };

  const businessError = businessErrors[err.message];
  if (businessError) {
    return res
      .status(businessError.status)
      .json({ error: businessError.message });
  }

  // ── Error no controlado — 500 ────────────────────────────────────────────
  // En desarrollo: mostrar el stack trace para debugging
  // En producción: mensaje genérico — nunca filtrar detalles internos
  const isDev = nodeEnv === "development";

  res.status(500).json({
    error: "Error interno del servidor",
    ...(isDev && { details: err.message, stack: err.stack }),
  });
};

module.exports = errorHandler;
