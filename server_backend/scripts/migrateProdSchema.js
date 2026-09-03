/**
 * @file server_backend/scripts/migrateProdSchema.js
 * @description Migra una base de datos que todavía tiene el schema VIEJO
 * (de antes de la reestructuración de Fases 1-4: sin genders/presentations/
 * product_variants, sin products.type/gender_id, con categorías por familia
 * olfativa en vez de Árabe/Nicho/Diseñador/Preparados) al schema actual.
 *
 * Confirmado el 2026-09-04 contra la BD de producción (Aiven): tenía 9
 * productos de prueba de un modelo de negocio anterior, incompatibles con
 * el modelo actual (sin género, categorías que ya no existen). Este script
 * los borra (en cascada arrastra sus product_images/cart_items/wishlist_items/
 * reviews/viewed_products asociados — ya evaluado como impacto mínimo: 3
 * usuarios reales en toda la BD) junto con las categorías viejas, y deja el
 * schema idéntico al de schema.sql. Después de correr esto, corre
 * `importCatalog.js --commit` para poblar el catálogo real.
 *
 * Es IDEMPOTENTE: si products.type ya existe, asume que la migración ya se
 * corrió y no vuelve a tocar nada (así no hay riesgo de borrar el catálogo
 * ya importado si se ejecuta dos veces por error).
 *
 * Uso (PowerShell, desde server_backend/):
 *   $env:NODE_ENV="production"
 *   node scripts/migrateProdSchema.js
 */
const pool = require("../src/config/db");

async function columnExists(table, column) {
  const [rows] = await pool.query(
    "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column],
  );
  return rows.length > 0;
}

async function main() {
  const [[{ dbName }]] = await pool.query("SELECT DATABASE() as dbName");
  console.log(`Conectado a la base de datos: ${dbName} (NODE_ENV=${process.env.NODE_ENV})`);

  if (await columnExists("products", "type")) {
    console.log(
      "products.type ya existe — esta BD ya está migrada. No se toca nada.",
    );
    return;
  }

  console.log("\n--- Schema viejo detectado. Iniciando migración. ---\n");

  // 1) Vaciar productos viejos (incompatibles con el modelo actual).
  //    ON DELETE CASCADE en el schema se encarga de product_images,
  //    cart_items, wishlist_items, reviews (las que tengan product_id) y
  //    viewed_products asociados a estos productos.
  const [delProducts] = await pool.query("DELETE FROM products");
  console.log(`1) Borrados ${delProducts.affectedRows} productos viejos (+ dependientes en cascada).`);

  // 2) Vaciar categorías viejas (ya no quedan productos referenciándolas).
  const [delCategories] = await pool.query("DELETE FROM categories");
  console.log(`2) Borradas ${delCategories.affectedRows} categorías viejas.`);

  // 3) genders
  await pool.query(`
    CREATE TABLE IF NOT EXISTS genders (
      id   INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      slug VARCHAR(50) NOT NULL UNIQUE
    )
  `);
  await pool.query(
    "INSERT INTO genders (name, slug) VALUES ('Dama','dama'), ('Caballero','caballero'), ('Unisex','unisex')",
  );
  console.log("3) Tabla genders creada y poblada (Dama/Caballero/Unisex).");

  // 4) presentations
  await pool.query(`
    CREATE TABLE IF NOT EXISTS presentations (
      id    INT AUTO_INCREMENT PRIMARY KEY,
      label VARCHAR(50)    NOT NULL UNIQUE,
      price DECIMAL(10, 2) NOT NULL
    )
  `);
  await pool.query(`
    INSERT INTO presentations (label, price) VALUES
      ('1oz', 16000.00),
      ('3oz', 35000.00),
      ('Combo 3x1oz', 38000.00),
      ('Combo 3x3oz', 90000.00)
  `);
  console.log("4) Tabla presentations creada y poblada (1oz/3oz/combos).");

  // 5) categorías nuevas (mismo orden que local, para que los ids coincidan)
  await pool.query(`
    INSERT INTO categories (name, slug) VALUES
      ('Árabe', 'arabe'),
      ('Nicho', 'nicho'),
      ('Diseñador', 'disenador'),
      ('Preparados', 'preparados')
  `);
  console.log("5) Categorías nuevas insertadas (Árabe/Nicho/Diseñador/Preparados).");

  // 6) products.gender_id + products.type (tabla ya vacía → NOT NULL sin
  //    default es seguro)
  await pool.query(`
    ALTER TABLE products
      ADD COLUMN gender_id INT NOT NULL AFTER brand_id,
      ADD COLUMN type ENUM('original', 'preparado') NOT NULL AFTER gender_id,
      ADD CONSTRAINT fk_products_gender FOREIGN KEY (gender_id) REFERENCES genders(id)
  `);
  console.log("6) products.gender_id y products.type agregados.");

  // 7) product_variants
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      product_id      INT NOT NULL,
      presentation_id INT NOT NULL,
      stock           INT NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id)      REFERENCES products(id)      ON DELETE CASCADE,
      FOREIGN KEY (presentation_id) REFERENCES presentations(id),
      UNIQUE (product_id, presentation_id)
    )
  `);
  console.log("7) Tabla product_variants creada.");

  console.log(
    "\n--- Migración completa. Ahora corre: node scripts/importCatalog.js --commit ---",
  );
}

main()
  .catch((err) => {
    console.error("ERROR:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
