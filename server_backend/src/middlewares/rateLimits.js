/**
 * @file server_backend/src/middlewares/rateLimits.js
 * @description Límites de intentos por IP (o por usuario) para frenar spam y fuerza bruta.
 *
 * Solo se limitan el login, el registro y las escrituras — nunca las
 * lecturas (GET): el catálogo lo piden también Google y el Worker de
 * Cloudflare desde unas pocas IPs compartidas, y limitarlas los bloquearía.
 *
 * La IP real del visitante sale de req.ip, que depende de "trust proxy"
 * en index.js (3 saltos: Cloudflare → balanceador de Render → proxy local).
 * Contador en memoria: suficiente con una sola instancia en Render; se
 * reinicia si el servidor se reinicia.
 */
const { rateLimit } = require("express-rate-limit");

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

function limiter({ windowMs, limit, message, ...rest }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: message },
    ...rest,
  });
}

// Registro: 10 cuentas por hora por IP. Holgado a propósito: en Colombia
// muchos móviles salen a internet por la misma IP del operador (CGNAT).
const registerLimiter = limiter({
  windowMs: HOUR,
  limit: 10,
  message:
    "Demasiados registros desde esta conexión. Intenta de nuevo en una hora.",
});

// Login: 10 intentos FALLIDOS cada 15 min por IP. Los correctos no cuentan.
const loginLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  message:
    "Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.",
});

// Reseñas: 10 por hora por USUARIO (va después de verifyToken, así que
// req.user existe) — no por IP, para no castigar a quien comparte red.
const reviewLimiter = limiter({
  windowMs: HOUR,
  limit: 10,
  keyGenerator: (req) => `user:${req.user.id}`,
  message: "Has enviado muchas reseñas seguidas. Intenta de nuevo más tarde.",
});

// Resto de escrituras (carrito, favoritos, perfil, admin): tope amplio
// contra abuso automatizado; una compra normal no se acerca.
const writeLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 300,
  skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
  message: "Demasiadas acciones seguidas. Espera unos minutos.",
});

module.exports = { registerLimiter, loginLimiter, reviewLimiter, writeLimiter };
