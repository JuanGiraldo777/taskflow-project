const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { jwt: jwtConfig } = require("../config/env");

// ── Registro ────────────────────────────────────────────────────────────────
const register = async ({ fullName, email, password }) => {
  // Verificar si el email ya existe
  const [existing] = await pool.execute(
    "SELECT id FROM users WHERE email = ?",
    [email],
  );
  if (existing.length > 0) {
    throw new Error("EMAIL_TAKEN");
  }

  // Hashear la contraseña — el 10 es el salt rounds (coste computacional)
  // Nunca se guarda la contraseña en texto plano
  const passwordHash = await bcrypt.hash(password, 10);

  // Insertar usuario en la BD
  const [result] = await pool.execute(
    "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
    [fullName, email, passwordHash],
  );

  return {
    id: result.insertId,
    fullName,
    email,
    role: "user",
  };
};

// ── Login ───────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {
  // Buscar usuario por email
  const [rows] = await pool.execute(
    "SELECT id, full_name, email, password_hash, role FROM users WHERE email = ?",
    [email],
  );
  if (rows.length === 0) {
    // Mismo error que contraseña incorrecta — no revelar si el email existe
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = rows[0];

  // Comparar contraseña con el hash almacenado
  // bcrypt.compare hashea internamente el password y compara — nunca texto plano
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Generar token JWT firmado con el secreto
  // El payload contiene solo lo necesario — nunca meter password_hash aquí
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn },
  );

  return {
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
  };
};

module.exports = { register, login };
