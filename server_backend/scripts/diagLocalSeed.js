/**
 * @file server_backend/scripts/diagLocalSeed.js
 * @description Diagnóstico de solo lectura contra la base de datos LOCAL.
 * Lista los datos de las tablas de referencia (genders, presentations,
 * categories, brands) para poder replicarlos en producción, donde todavía
 * no existen. No modifica nada.
 *
 * Uso (PowerShell, desde server_backend/):
 *   node scripts/diagLocalSeed.js
 */
const pool = require("../src/config/db");

async function main() {
  const [genders] = await pool.query("SELECT * FROM genders ORDER BY id");
  console.log("=== genders (local) ===");
  console.log(JSON.stringify(genders));

  const [presentations] = await pool.query("SELECT * FROM presentations ORDER BY id");
  console.log("\n=== presentations (local) ===");
  console.log(JSON.stringify(presentations));

  const [categories] = await pool.query("SELECT * FROM categories ORDER BY id");
  console.log("\n=== categories (local) ===");
  console.log(JSON.stringify(categories));

  const [brands] = await pool.query("SELECT * FROM brands ORDER BY id");
  console.log("\n=== brands (local) ===");
  console.log(JSON.stringify(brands));

  const [[{ cnt }]] = await pool.query("SELECT COUNT(*) as cnt FROM products");
  console.log("\n=== local products count ===", cnt);

  const [typeBreakdown] = await pool.query(
    "SELECT type, COUNT(*) as n FROM products GROUP BY type",
  );
  console.log("=== local products by type ===", JSON.stringify(typeBreakdown));

  await pool.end();
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
