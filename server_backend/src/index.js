/**
 * @file server_backend/src/index.js
 * @description Punto de entrada del backend Express. Configura middlewares, rutas y manejo global de errores.
 */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { port } = require("./config/env");
const pool = require("./config/db");
const { corsOptions } = require("./config/cors");
const { writeLimiter } = require("./middlewares/rateLimits");
const errorHandler = require("./middlewares/errorHandler");

// ── Rutas ───────────────────────────────────────────────────────────────────
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const brandRoutes = require("./routes/brand.routes");
const genderRoutes = require("./routes/gender.routes");
const presentationRoutes = require("./routes/presentation.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const cartRoutes = require("./routes/cart.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const reviewRoutes = require("./routes/review.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// ── Proxy de Render ─────────────────────────────────────────────────────────
// Las peticiones llegan visitante → Cloudflare → balanceador de Render →
// proxy local. Medido en producción (2026-10-03): X-Forwarded-For llega como
// "visitante, IP de Cloudflare, IP interna de Render". Confiar en 3 saltos
// hace que req.ip sea la IP real del visitante; con 1 sería la del
// balanceador, la misma para todos, y el límite de intentos bloquearía a
// todo el mundo a la vez. Nunca usar `true` (dejaría falsear la IP).
app.set("trust proxy", 3);

// ── Middlewares globales ────────────────────────────────────────────────────
// helmet: cabeceras de seguridad estándar (y quita "X-Powered-By: Express").
// crossOriginResourcePolicy "cross-origin": la API la consume otro dominio.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(corsOptions));
// 20 KB sobra para cualquier formulario del sitio (una reseña de 1000
// caracteres pesa ~3 KB) y evita que alguien mande cuerpos gigantes.
app.use(express.json({ limit: "20kb" }));
// En Express 5, req.body queda undefined si la petición no trae JSON, y
// los controladores que hacen `const { x } = req.body` lanzaban un 500.
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});
app.use("/api/v1", writeLimiter);

// ── Health check ────────────────────────────────────────────────────────────
// Lo llama cron-job.org cada pocos minutos para que Render no se duerma.
// Además toca la base de datos (SELECT 1) para que Aiven tampoco la apague
// por inactividad. Siempre responde 200 si el servidor vive; el estado de
// la base va en el cuerpo, para que una caída de Aiven no haga que Render
// reinicie el servicio en bucle.
app.get("/health", async (req, res) => {
  let db = "ok";
  try {
    await pool.query({ sql: "SELECT 1", timeout: 3000 });
  } catch {
    db = "error";
  }
  res.status(200).json({ status: "ok", db, message: "Servidor Maison activo" });
});

// ── Rutas de negocio ────────────────────────────────────────────────────────
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/brands", brandRoutes);
app.use("/api/v1/genders", genderRoutes);
app.use("/api/v1/presentations", presentationRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/admin", adminRoutes);

// ── Middleware 404 — rutas inexistentes ─────────────────────────────────────
// Debe ir DESPUÉS de todas las rutas y ANTES del errorHandler
// Captura cualquier petición que no coincida con ninguna ruta definida
app.use((req, res) => {
  res
    .status(404)
    .json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

// ── Middleware global de errores ────────────────────────────────────────────
// Debe ir SIEMPRE al final — después del 404
// Express lo identifica por tener exactamente 4 parámetros (err, req, res, next)
app.use(errorHandler);

// ── Arranque ────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Servidor Maison corriendo en http://localhost:${port}`);
});
