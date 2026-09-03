/**
 * @file server_backend/scripts/diffLocalVsProd.js
 * @description Compara TODOS los campos de contenido entre local y
 * producción, producto por producto (emparejado por nombre, ya que los ids
 * no coinciden tras la reimportación). Solo lectura — no escribe nada en
 * ninguna de las dos bases.
 *
 * Nace del bug de las descripciones (2026-09-04): updateDescriptions.js
 * solo se había corrido en local y nunca en producción. Este script existe
 * para que ese tipo de desincronización no se vuelva a colar sin que lo
 * notemos — compara precio, stock, descripción, cantidad de imágenes, y
 * para preparados, las presentaciones/stock de cada variante.
 *
 * Uso:
 *   node scripts/diffLocalVsProd.js
 */
const mysql = require("mysql2/promise");
const path = require("path");
const dotenv = require("dotenv");

async function main() {
  const localEnv = {};
  dotenv.config({ path: path.resolve(__dirname, "../.env.local"), processEnv: localEnv });
  const localPool = mysql.createPool({
    host: localEnv.DB_HOST,
    port: parseInt(localEnv.DB_PORT, 10),
    user: localEnv.DB_USER,
    password: localEnv.DB_PASSWORD || "",
    database: localEnv.DB_NAME,
  });

  const prodEnv = {};
  dotenv.config({ path: path.resolve(__dirname, "../.env.production"), processEnv: prodEnv });
  const prodPool = mysql.createPool({
    host: prodEnv.DB_HOST,
    port: parseInt(prodEnv.DB_PORT, 10),
    user: prodEnv.DB_USER,
    password: prodEnv.DB_PASSWORD,
    database: prodEnv.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  async function loadFull(pool) {
    const [products] = await pool.query(`
      SELECT p.id, p.name, p.type, p.description, p.original_price, p.discounted_price, p.stock,
             b.name AS brand, c.name AS category, g.name AS gender
      FROM products p
      JOIN brands b ON b.id = p.brand_id
      JOIN categories c ON c.id = p.category_id
      JOIN genders g ON g.id = p.gender_id
    `);
    const [images] = await pool.query(
      "SELECT product_id, COUNT(*) as n FROM product_images GROUP BY product_id",
    );
    const [variants] = await pool.query(`
      SELECT pv.product_id, pr.label, pv.stock
      FROM product_variants pv
      JOIN presentations pr ON pr.id = pv.presentation_id
    `);

    const imageCount = new Map(images.map((r) => [r.product_id, r.n]));
    const variantsByProduct = new Map();
    for (const v of variants) {
      if (!variantsByProduct.has(v.product_id)) variantsByProduct.set(v.product_id, []);
      variantsByProduct.get(v.product_id).push(`${v.label}:${v.stock}`);
    }

    const byName = new Map();
    for (const p of products) {
      byName.set(p.name.trim().toLowerCase(), {
        ...p,
        imageCount: imageCount.get(p.id) || 0,
        variants: (variantsByProduct.get(p.id) || []).sort().join(","),
      });
    }
    return byName;
  }

  const [localByName, prodByName] = await Promise.all([
    loadFull(localPool),
    loadFull(prodPool),
  ]);

  console.log(`Local: ${localByName.size} productos | Producción: ${prodByName.size} productos\n`);

  const onlyInLocal = [];
  const onlyInProd = [];
  const diffs = [];

  for (const [name, local] of localByName) {
    const prod = prodByName.get(name);
    if (!prod) {
      onlyInLocal.push(name);
      continue;
    }

    const fieldsToCompare = [
      ["type", local.type, prod.type],
      ["brand", local.brand, prod.brand],
      ["category", local.category, prod.category],
      ["gender", local.gender, prod.gender],
      ["description_vacia", !local.description, !prod.description],
      ["original_price", local.original_price, prod.original_price],
      ["discounted_price", local.discounted_price, prod.discounted_price],
      ["stock", local.stock, prod.stock],
      ["imageCount", local.imageCount, prod.imageCount],
      ["variants", local.variants, prod.variants],
    ];

    const mismatches = fieldsToCompare.filter(([, a, b]) => String(a) !== String(b));
    if (mismatches.length > 0) {
      diffs.push({ name, mismatches });
    }
  }

  for (const name of prodByName.keys()) {
    if (!localByName.has(name)) onlyInProd.push(name);
  }

  if (onlyInLocal.length > 0) {
    console.log(`Solo en LOCAL (${onlyInLocal.length}):`);
    onlyInLocal.forEach((n) => console.log(`  ${n}`));
    console.log("");
  }

  if (onlyInProd.length > 0) {
    console.log(`Solo en PRODUCCIÓN (${onlyInProd.length}):`);
    onlyInProd.forEach((n) => console.log(`  ${n}`));
    console.log("");
  }

  if (diffs.length > 0) {
    console.log(`Diferencias de contenido en productos que SÍ existen en ambos (${diffs.length}):`);
    diffs.forEach(({ name, mismatches }) => {
      console.log(`  ${name}`);
      mismatches.forEach(([field, a, b]) =>
        console.log(`    - ${field}: local="${a}" vs prod="${b}"`),
      );
    });
  } else {
    console.log("Sin diferencias de contenido entre los productos que coinciden por nombre.");
  }

  await localPool.end();
  await prodPool.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exitCode = 1;
});
