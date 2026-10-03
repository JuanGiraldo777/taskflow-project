/**
 * @file ejercicio_web/js/escape.js
 * @description Escapa texto antes de insertarlo en el HTML con innerHTML.
 *
 * Todo dato que venga de un usuario (nombre, reseña, perfil, búsqueda) o de
 * la API (nombres de producto, marcas) pasa por escapeHtml antes de entrar
 * en un template string que termina en innerHTML. Sin esto, una reseña o un
 * nombre de cuenta con "<img src=x onerror=...>" se ejecutaba como código
 * en el navegador de quien la viera — incluido el admin, cuyo token de
 * sesión vive en localStorage.
 *
 * Sirve tanto para texto (<p>${escapeHtml(x)}</p>) como para atributos
 * entre comillas (alt="${escapeHtml(x)}"): el navegador devuelve el valor
 * original al leerlo (dataset, .alt, .value), así que no cambia nada visible.
 */
const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}
