/**
 * @file server_backend/src/middlewares/antiSpam.js
 * @description Filtro invisible de bots para formularios públicos (registro y reseñas).
 *
 * Dos trampas que un humano nunca activa:
 * - Honeypot: el formulario tiene un campo "website" oculto. Las personas
 *   no lo ven y lo dejan vacío; los bots que rellenan todo, no.
 * - Tiempo mínimo: el frontend manda cuántos ms pasaron desde que se
 *   mostró el formulario. Un bot lo envía al instante; una persona tarda
 *   al menos un par de segundos en escribir.
 *
 * No reemplaza al límite de intentos (rateLimits.js): un bot que llame a
 * la API directamente puede falsear estos campos, y ahí lo frena el límite.
 */
const MIN_FILL_MS = 2000;

function antiSpam(req, res, next) {
  const { website, formElapsedMs } = req.body;

  if (typeof website === "string" && website.trim() !== "") {
    return res.status(400).json({ error: "No se pudo procesar el formulario." });
  }

  const elapsed = Number(formElapsedMs);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
    return res.status(400).json({
      error:
        "El formulario se envió demasiado rápido. Espera unos segundos y vuelve a intentarlo (si el problema sigue, recarga la página).",
    });
  }

  next();
}

module.exports = antiSpam;
