// Fail Fast — si falta una variable crítica, el servidor se niega a arrancar.
require('dotenv').config();

const requiredVars = ['PORT', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];

requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Variable de entorno requerida no definida: ${varName}`);
  }
});

module.exports = {
  port:    process.env.PORT,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  },
};