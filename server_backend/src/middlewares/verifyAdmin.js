/**
 * @file server_backend/src/middlewares/verifyAdmin.js
 * @description Middleware de autorización para rutas exclusivas de administradores.
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Acceso restringido a administradores" });
  }

  next();
};

module.exports = verifyAdmin;
