/**
 * @file server_backend/scripts/diagProdSchema.js
 * @description Diagnóstico de solo lectura contra la base de datos de
 * producción (Aiven). No modifica nada — solo lista tablas y columnas
 * para confirmar si el schema nuevo (genders/presentations/product_variants,
 * products.type, products.gender_id) ya existe ahí o no.
 *
 * Uso (PowerShell, desde server_backend/):
 *   $env:NODE_ENV="production"; node scripts/diagProdSchema.js
 */
process.env.NODE_ENV = "production";
const pool = require("../src/config/db");

async function main() {
  const [tables] = await pool.query("SHOW TABLES");
  console.log("=== TABLES ===");
  console.log(tables.map((t) => Object.values(t)[0]).join(", "));

  const [prodCols] = await pool.query("DESCRIBE products");
  console.log("\n=== products columns ===");
  prodCols.forEach((c) => console.log(`  ${c.Field}: ${c.Type} ${c.Null === "NO" ? "NOT NULL" : ""}`));

  try {
    const [reviewCols] = await pool.query("DESCRIBE reviews");
    console.log("\n=== reviews.product_id ===");
    console.log(reviewCols.find((c) => c.Field === "product_id"));
  } catch (e) {
    console.log("\n(no se pudo leer reviews:", e.message, ")");
  }

  const [[{ cnt }]] = await pool.query("SELECT COUNT(*) as cnt FROM products");
  console.log("\n=== products row count ===", cnt);

  const [prodRows] = await pool.query(
    "SELECT id, name, category_id, brand_id, original_price, stock FROM products ORDER BY id",
  );
  console.log("\n=== existing products ===");
  prodRows.forEach((p) => console.log(`  #${p.id} ${p.name} (cat=${p.category_id} brand=${p.brand_id} price=${p.original_price} stock=${p.stock})`));

  const [[{ users }]] = await pool.query("SELECT COUNT(*) as users FROM users");
  const [[{ cartRows }]] = await pool.query("SELECT COUNT(*) as cartRows FROM cart_items");
  const [[{ wishRows }]] = await pool.query("SELECT COUNT(*) as wishRows FROM wishlist_items");
  const [[{ reviewRows }]] = await pool.query("SELECT COUNT(*) as reviewRows FROM reviews");
  const [[{ viewedRows }]] = await pool.query("SELECT COUNT(*) as viewedRows FROM viewed_products");
  console.log("\n=== usage counts ===");
  console.log({ users, cartRows, wishRows, reviewRows, viewedRows });

  await pool.end();
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
