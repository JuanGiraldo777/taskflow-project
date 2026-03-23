const express = require("express");
const cors = require("cors");
const { port } = require("./config/env");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const cartRoutes = require("./routes/cart.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const reviewRoutes = require("./routes/review.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const brandRoutes = require("./routes/brand.routes");

const app = express();

// ── Middlewares globales ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
// Endpoint para verificar que el servidor responde correctamente.
// Útil también para que Koyeb compruebe que el servicio está vivo.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Servidor Maison activo" });
});

// ── Rutas de negocio ────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/brands", brandRoutes);

// ── Middleware global de errores (siempre al final, requiere 4 parámetros) ──
// Express identifica los middlewares de error por tener exactamente 4 params.
// Si tiene 3, Express lo trata como middleware normal y los errores no llegan.
app.use((err, req, res, next) => {
  console.error(err);

  if (err.message === "NOT_FOUND")
    return res.status(404).json({ error: "Recurso no encontrado" });
  if (err.message === "INVALID_CREDENTIALS")
    return res.status(401).json({ error: "Email o contraseña incorrectos" });
  if (err.message === "EMAIL_TAKEN")
    return res.status(409).json({ error: "El email ya está registrado" });
  if (err.message === "OUT_OF_STOCK")
    return res.status(400).json({ error: "Stock insuficiente" });
  if (err.message === "ALREADY_REVIEWED")
    return res
      .status(409)
      .json({ error: "Ya has dejado una reseña para este producto" });
  if (err.message === "INVALID_QUANTITY")
    return res.status(400).json({ error: "La cantidad debe ser mayor que 0" });

  // Para cualquier otro error no controlado: log interno, respuesta genérica.
  // Nunca devolver err.stack al cliente — expone detalles internos del servidor.
  res.status(500).json({ error: "Error interno del servidor" });
});

// ── Arranque ────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Servidor Maison corriendo en http://localhost:${port}`);
});
