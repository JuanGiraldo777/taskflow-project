/**
 * @file server_backend/scripts/fixCartItemsSchema.js
 * @description cart_items.variant_id faltaba en producción — se agregó en
 * algún momento a la tabla local (para poder identificar la presentación
 * elegida de un producto preparado dentro del carrito) pero nunca se migró.
 * Cualquier POST /cart/items fallaba con 500 ("Unknown column 'variant_id'
 * in field list"), tanto para originales como preparados, porque el INSERT
 * siempre incluye esa columna. Encontrado 2026-09-04 vía diffSchema.js.
 * Idempotente — seguro correrlo más de una vez.
 *
 * Uso:
 *   NODE_ENV=production node scripts/fixCartItemsSchema.js
 */
const pool = require("../src/config/db");

(async () => {
  try {
    const [before] = await pool.query(
      "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'variant_id'",
    );

    if (before.length > 0) {
      console.log("cart_items.variant_id ya existe, no hay nada que hacer.");
      return;
    }

    await pool.query(
      "ALTER TABLE cart_items ADD COLUMN variant_id INT DEFAULT NULL AFTER product_id",
    );
    console.log("Columna cart_items.variant_id agregada.");

    await pool.query(
      "ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE",
    );
    console.log("Foreign key cart_items.variant_id -> product_variants(id) agregada.");

    console.log("\nListo — cart_items ahora coincide con local.");
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
