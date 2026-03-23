const express = require("express");
const cors = require("cors");
const { port } = require("./config/env");
const errorHandler = require("./middlewares/errorHandler");

// ── Rutas ───────────────────────────────────────────────────────────────────
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const brandRoutes = require("./routes/brand.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const cartRoutes = require("./routes/cart.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const reviewRoutes = require("./routes/review.routes");

const app = express();

// ── Middlewares globales ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Servidor Maison activo" });
});

// ── Rutas de negocio ────────────────────────────────────────────────────────
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/brands", brandRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/reviews", reviewRoutes);

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
