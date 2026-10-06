/**
 * @file server_backend/scripts/diagDbVersion.js
 * @description SOLO LECTURA. Muestra la versión de MySQL a la que se conecta
 * el backend. Aiven terminó el soporte de MySQL 8.0 el 2026-10-31: tras la
 * actualización debe decir 8.4.x. No cambia nada.
 *
 * Uso (Git Bash, desde server_backend/):
 *   NODE_ENV=production node scripts/diagDbVersion.js
 */
const pool = require("../src/config/db");
const { db } = require("../src/config/env");

(async () => {
  try {
    const [[{ version }]] = await pool.query("SELECT VERSION() AS version");
    const [[{ users }]] = await pool.query("SELECT COUNT(*) AS users FROM users");
    const [[{ products }]] = await pool.query("SELECT COUNT(*) AS products FROM products");
    console.log(`Base: ${db.database} (${process.env.NODE_ENV === "production" ? "PRODUCCIÓN" : "LOCAL"}) — solo lectura`);
    console.log(`Versión de MySQL: ${version}`);
    console.log(`Cuentas: ${users} · Productos: ${products}`);
    console.log(
      version.startsWith("8.0")
        ? "\nATENCIÓN: sigue en MySQL 8.0 (fin de soporte en Aiven: 2026-10-31). Falta actualizar la versión."
        : "\nBien: ya no está en MySQL 8.0.",
    );
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
