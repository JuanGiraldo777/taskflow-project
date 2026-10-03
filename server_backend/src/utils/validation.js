/**
 * @file server_backend/src/utils/validation.js
 * @description Validaciones compartidas de los datos que llegan en el body.
 *
 * Los límites coinciden con las columnas de schema.sql (full_name 100,
 * email 150, favorite_perfume/perfume_rec 100): validar aquí devuelve un
 * 400 claro en vez del 500 que daba MySQL al recibir un texto más largo.
 */

// Formato práctico de email (algo@dominio.ext), no el RFC completo.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Texto recortado, o "" si no es un string (números, objetos, null...). */
function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
  return email.length <= 150 && EMAIL_RE.test(email);
}

/** Puntuación válida = entero de 1 a 5 (acepta "5" y 5). Devuelve el número o null. */
function parseRating(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

/** Entero positivo acotado para ?page y ?limit. */
function boundedInt(value, { fallback, min = 1, max }) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

module.exports = { text, isValidEmail, parseRating, boundedInt };
