/**
 * @file server_backend/src/config/cors.js
 * @description Orígenes (sitios web) que pueden llamar a la API desde el navegador.
 *
 * Antes era cors() sin opciones = cualquier sitio de internet podía usar la
 * API desde el navegador de un visitante. Ahora solo el frontend propio.
 * Las peticiones sin cabecera Origin (curl, cron-job.org, el Worker de
 * Cloudflare pidiendo datos del producto) no son de navegador y se permiten:
 * CORS es una regla del navegador, no una barrera para servidores.
 *
 * Al conectar el dominio propio hay que añadirlo aquí (con y sin www).
 */
const ALLOWED_ORIGINS = new Set([
  // Frontend actual en Vercel — se quita cuando el dominio propio esté activo.
  "https://taskflow-project-khaki.vercel.app",
  // Desarrollo local (ejercicio_web/_devserver.py, puerto 5500 por defecto).
  "http://localhost:5500",
  "http://127.0.0.1:5500",
]);

const corsOptions = {
  origin(origin, callback) {
    // Sin Origin = no es un navegador → se permite. Origen desconocido →
    // false: la respuesta sale sin cabeceras CORS y el navegador la bloquea.
    callback(null, !origin || ALLOWED_ORIGINS.has(origin));
  },
  // El navegador guarda 2 h la respuesta de la petición previa (OPTIONS)
  // en vez de repetirla antes de cada llamada.
  maxAge: 7200,
};

module.exports = { corsOptions, ALLOWED_ORIGINS };
