const express = require('express');
const cors    = require('cors');
const { port } = require('./config/env');

const app = express();

// ── Middlewares globales ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
// Endpoint para verificar que el servidor responde correctamente.
// Útil también para que Koyeb compruebe que el servicio está vivo.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor Maison activo' });
});

// ── Rutas de negocio (se añadirán en prompts posteriores) ───────────────────
// app.use('/api/v1/products',  productRoutes);
// app.use('/api/v1/cart',      cartRoutes);
// app.use('/api/v1/wishlist',  wishlistRoutes);
// app.use('/api/v1/reviews',   reviewRoutes);
// app.use('/api/v1/users',     userRoutes);
// app.use('/api/v1/auth',      authRoutes);

// ── Middleware global de errores (siempre al final, requiere 4 parámetros) ──
// Express identifica los middlewares de error por tener exactamente 4 params.
// Si tiene 3, Express lo trata como middleware normal y los errores no llegan.
app.use((err, req, res, next) => {
  console.error(err);

  if (err.message === 'NOT_FOUND') {
    return res.status(404).json({ error: 'Recurso no encontrado' });
  }

  // Para cualquier otro error no controlado: log interno, respuesta genérica.
  // Nunca devolver err.stack al cliente — expone detalles internos del servidor.
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Arranque ────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Servidor Maison corriendo en http://localhost:${port}`);
});