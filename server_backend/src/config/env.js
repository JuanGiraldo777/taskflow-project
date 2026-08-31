/**
 * @file server_backend/src/config/env.js
 * @description Carga y valida variables de entorno críticas del backend.
 */
const path = require("path");

// Fail Fast — si falta una variable crítica, el servidor se niega a arrancar.
// dotenv sin `path` siempre busca ".env" a secas; aquí elegimos el archivo
// según NODE_ENV para poder mantener .env.local y .env.production separados.
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
require("dotenv").config({ path: path.resolve(__dirname, "../../", envFile) });

const requiredVars = [
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_NAME",
  "JWT_SECRET",
];

requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Variable de entorno requerida no definida: ${varName}`);
  }
});

module.exports = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
  },
};
