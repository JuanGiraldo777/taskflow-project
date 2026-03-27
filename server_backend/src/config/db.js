/**
 * @file server_backend/src/config/db.js
 * @description Configuración del pool de conexiones MySQL para el backend.
 */
const mysql  = require('mysql2/promise');
const { db, nodeEnv } = require('./env');

// Aiven requiere SSL en producción. En local no es necesario.
const sslConfig = nodeEnv === 'production'
  ? { rejectUnauthorized: false }
  : false;

const pool = mysql.createPool({
  host:     db.host,
  port:     db.port,
  user:     db.user,
  password: db.password,
  database: db.database,
  ssl:      sslConfig,
  waitForConnections: true,
  connectionLimit:    10,
});

module.exports = pool;