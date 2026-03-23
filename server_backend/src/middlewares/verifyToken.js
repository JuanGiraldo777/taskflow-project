const jwt = require("jsonwebtoken");
const { jwt: jwtConfig } = require("../config/env");

const verifyToken = (req, res, next) => {
  // El header debe venir como: Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verifica la firma del token con el JWT_SECRET
    // Si el token fue manipulado o expiró, lanza un error
    const payload = jwt.verify(token, jwtConfig.secret);

    // Mete el payload en req.user para que los controladores lo usen
    // A partir de aquí, req.user.id es el user_id del usuario autenticado
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

module.exports = verifyToken;
