/**
 * @file server_backend/scripts/fixProductPriceNullable.js
 * @description products.original_price había quedado NOT NULL en producción
 * (schema viejo, de cuando solo existían productos originales). schema.sql
 * ya lo define como nullable — los productos type='preparado' no usan este
 * campo (su precio vive en product_variants/presentations) e insertan NULL.
 * Se detectó el 2026-09-04 al importar el catálogo real: los 60 preparados
 * fallaban con "Column 'original_price' cannot be null". Idempotente.
 *
 * Uso:
 *   NODE_ENV=production node scripts/fixProductPriceNullable.js
 */
const pool = require("../src/config/db");

(async () => {
  try {
    const [before] = await pool.query(
      "SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'original_price'",
    );
    console.log("Estado actual de products.original_price:", before[0]);

    if (before[0]?.IS_NULLABLE === "YES") {
      console.log("Ya acepta NULL, no hay nada que hacer.");
      return;
    }

    await pool.query(
      "ALTER TABLE products MODIFY COLUMN original_price DECIMAL(10,2) DEFAULT NULL",
    );
    console.log("Listo — products.original_price ahora acepta NULL.");
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
