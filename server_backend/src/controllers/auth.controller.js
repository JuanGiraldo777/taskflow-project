const authService = require("../services/auth.service");

// ── POST /api/v1/auth/register ──────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ error: "fullName, email y password son obligatorios" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const user = await authService.register({ fullName, email, password });
    res.status(201).json(user);
  } catch (err) {
    if (err.message === "EMAIL_TAKEN") {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    next(err);
  }
};

// ── POST /api/v1/auth/login ─────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "email y password son obligatorios" });
    }

    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    if (err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }
    next(err);
  }
};

module.exports = { register, login };
