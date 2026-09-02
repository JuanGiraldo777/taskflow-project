/**
 * @file server_backend/scripts/fixReviewsSchema.js
 * @description Corrige reviews.product_id de NOT NULL a NULL — bug real
 * encontrado el 2026-09-02: las reseñas de tienda (index.html, sin producto
 * asociado) insertan product_id = NULL a propósito, pero la columna había
 * quedado NOT NULL, así que cada intento fallaba con 500. Ya corregido en
 * schema.sql para instalaciones nuevas; este script arregla una base de
 * datos que YA existe (local o producción) sin perder datos.
 *
 * Uso:
 *   node scripts/fixReviewsSchema.js              (contra local, NODE_ENV=development por defecto)
 *   NODE_ENV=production node scripts/fixReviewsSchema.js   (contra producción — pedir confirmación antes de correrlo así)
 */
const pool = require("../src/config/db");

(async () => {
  try {
    const [before] = await pool.query(
      "SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND COLUMN_NAME = 'product_id'",
    );
    console.log("Estado actual de reviews.product_id:", before[0]);

    if (before[0]?.IS_NULLABLE === "YES") {
      console.log("Ya acepta NULL, no hay nada que hacer.");
      return;
    }

    await pool.query("ALTER TABLE reviews MODIFY COLUMN product_id INT NULL");
    console.log("Listo — reviews.product_id ahora acepta NULL.");
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
