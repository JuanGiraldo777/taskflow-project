/**
 * @file server_backend/scripts/fixCatalogData.js
 * @description Correcciones de datos del catálogo encontradas en la revisión
 * de duplicados del 2026-09-25 (ninguna era un producto duplicado — eran
 * errores de tipeo que venían de los Excel de origen):
 *
 *   1. Marca duplicada: "Issey Miyakee" (typo) + "Issey Miyake". Se unifica
 *      en "Issey Miyake" — el filtro por marca mostraba dos entradas y al
 *      elegir "Issey Miyake" no aparecía el perfume original.
 *   2. Marca "Arabiyat Prestiege" -> "Arabiyat Prestige" (nombre y slug).
 *   3. Nombres de producto: "Light Blue D&C" -> "D&G", "ISSEY MIYAKEE LEAU D
 *      ISSEY" -> "ISSEY MIYAKE L'EAU D'ISSEY", "ARABIYAT PRESTIEGE ..." ->
 *      "ARABIYAT PRESTIGE ...".
 *   4. Restaura en PRODUCCIÓN "VERSACE EROS POUR HOMME 100ML EDT" (borrado
 *      después del 2026-09-04 por una cuenta admin, no por el desarrollador),
 *      copiándolo de la base LOCAL con su descripción e imágenes.
 *
 * Aplica 1-3 en LAS DOS bases (local y producción) para que sigan iguales
 * (diffLocalVsProd.js empareja por nombre). Todo se matchea por nombre/slug,
 * nunca por id — los ids no coinciden entre bases. Idempotente: si algo ya
 * está corregido, lo salta. Cada base va en una transacción.
 *
 * Los mismos errores también quedan corregidos en importCatalog.js, para que
 * una reimportación futura desde los Excel no los vuelva a traer.
 *
 * DRY-RUN por defecto. Para escribir de verdad:
 *   node scripts/fixCatalogData.js --commit
 * Requiere .env.local y .env.production (se conecta a las dos).
 */
const mysql = require("mysql2/promise");
const path = require("path");
const dotenv = require("dotenv");

const COMMIT = process.argv.includes("--commit");

// [slug incorrecto, nombre correcto, slug correcto]
const BRAND_FIXES = [
  ["issey-miyakee", "Issey Miyake", "issey-miyake"],
  ["arabiyat-prestiege", "Arabiyat Prestige", "arabiyat-prestige"],
];

// [nombre actual exacto, nombre corregido]
const NAME_FIXES = [
  ["Light Blue D&C", "Light Blue D&G"],
  [
    "ISSEY MIYAKEE LEAU D ISSEY POUR FEMME 100ML EDT",
    "ISSEY MIYAKE L'EAU D'ISSEY POUR FEMME 100ML EDT",
  ],
  [
    "ARABIYAT PRESTIEGE MAHD AL DAHAB 100ML EDP",
    "ARABIYAT PRESTIGE MAHD AL DAHAB 100ML EDP",
  ],
  ["ARABIYAT PRESTIEGE UHUD 100ML EDP", "ARABIYAT PRESTIGE UHUD 100ML EDP"],
];

const PRODUCT_TO_RESTORE = "VERSACE EROS POUR HOMME 100ML EDT";

function makePool(envFile, ssl) {
  const env = {};
  dotenv.config({ path: path.resolve(__dirname, "..", envFile), processEnv: env, quiet: true });
  return mysql.createPool({
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT, 10),
    user: env.DB_USER,
    password: env.DB_PASSWORD || "",
    database: env.DB_NAME,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
  });
}

async function fixBrands(conn, log) {
  for (const [wrongSlug, rightName, rightSlug] of BRAND_FIXES) {
    const [[wrong]] = await conn.query("SELECT id, name FROM brands WHERE slug = ?", [wrongSlug]);
    const [[right]] = await conn.query("SELECT id, name FROM brands WHERE slug = ?", [rightSlug]);

    if (!wrong) {
      log(`  marca "${wrongSlug}": ya no existe (ya corregida)`);
      continue;
    }
    const [[{ n }]] = await conn.query("SELECT COUNT(*) AS n FROM products WHERE brand_id = ?", [wrong.id]);

    if (right) {
      // Las dos existen: se pasan los productos a la correcta y se borra la mala.
      log(`  marca "${wrong.name}" (id ${wrong.id}) -> se une a "${right.name}" (id ${right.id}); mueve ${n} producto(s) y borra la duplicada`);
      await conn.query("UPDATE products SET brand_id = ? WHERE brand_id = ?", [right.id, wrong.id]);
      await conn.query("DELETE FROM brands WHERE id = ?", [wrong.id]);
    } else {
      log(`  marca "${wrong.name}" (id ${wrong.id}, ${n} producto(s)) -> se renombra a "${rightName}" / slug "${rightSlug}"`);
      await conn.query("UPDATE brands SET name = ?, slug = ? WHERE id = ?", [rightName, rightSlug, wrong.id]);
    }
  }
}

async function fixNames(conn, log) {
  for (const [oldName, newName] of NAME_FIXES) {
    const [rows] = await conn.query("SELECT id FROM products WHERE name = ?", [oldName]);
    if (rows.length === 0) {
      log(`  "${oldName}": no está (ya corregido)`);
      continue;
    }
    log(`  "${oldName}" -> "${newName}" (${rows.length} producto(s))`);
    await conn.query("UPDATE products SET name = ? WHERE name = ?", [newName, oldName]);
  }
}

async function restoreProduct(localPool, prodConn, log) {
  const [[already]] = await prodConn.query("SELECT id FROM products WHERE name = ?", [PRODUCT_TO_RESTORE]);
  if (already) {
    log(`  "${PRODUCT_TO_RESTORE}" ya existe en producción (id ${already.id}) — nada que restaurar`);
    return;
  }
  const [[src]] = await localPool.query(
    `SELECT p.*, c.slug AS category_slug, g.slug AS gender_slug, b.slug AS brand_slug
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN genders g ON g.id = p.gender_id
     JOIN brands b ON b.id = p.brand_id
     WHERE p.name = ?`,
    [PRODUCT_TO_RESTORE],
  );
  if (!src) {
    log(`  ERROR: "${PRODUCT_TO_RESTORE}" tampoco está en la base LOCAL — no se puede restaurar desde ahí`);
    return;
  }
  const [images] = await localPool.query(
    "SELECT url, is_main FROM product_images WHERE product_id = ? ORDER BY is_main DESC, id",
    [src.id],
  );
  // Los ids de categoría/sexo/marca difieren entre bases: se resuelven por slug.
  const [[cat]] = await prodConn.query("SELECT id FROM categories WHERE slug = ?", [src.category_slug]);
  const [[gen]] = await prodConn.query("SELECT id FROM genders WHERE slug = ?", [src.gender_slug]);
  const [[brand]] = await prodConn.query("SELECT id FROM brands WHERE slug = ?", [src.brand_slug]);
  if (!cat || !gen || !brand) {
    log(`  ERROR: no se encontró en producción categoría/sexo/marca (${src.category_slug}/${src.gender_slug}/${src.brand_slug})`);
    return;
  }
  log(
    `  restaura "${src.name}" [${src.type}, ${src.category_slug}, ${src.gender_slug}, ${src.brand_slug}, ` +
      `$${Number(src.original_price).toLocaleString("es-CO")}, stock ${src.stock}, ${images.length} imagen(es), ` +
      `descripción: ${src.description ? "sí" : "NO"}]`,
  );
  const [ins] = await prodConn.query(
    `INSERT INTO products (category_id, brand_id, gender_id, type, name, description, original_price, discounted_price, stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cat.id, brand.id, gen.id, src.type, src.name, src.description, src.original_price, src.discounted_price, src.stock],
  );
  for (const img of images) {
    await prodConn.query("INSERT INTO product_images (product_id, url, is_main) VALUES (?, ?, ?)", [
      ins.insertId,
      img.url,
      img.is_main,
    ]);
  }
  log(`  -> id nuevo en producción: ${ins.insertId}${COMMIT ? "" : " (dry-run: se revierte)"}`);
}

async function runOn(label, pool, work) {
  const conn = await pool.getConnection();
  const lines = [];
  const log = (s) => lines.push(s);
  try {
    await conn.beginTransaction();
    await work(conn, log);
    if (COMMIT) await conn.commit();
    else await conn.rollback(); // dry-run: se ejecuta todo y se deshace
  } catch (err) {
    await conn.rollback();
    lines.push(`  ERROR (se revirtió todo en ${label}): ${err.message}`);
    process.exitCode = 1;
  } finally {
    conn.release();
  }
  console.log(`\n=== ${label} ===\n${lines.join("\n")}`);
}

async function main() {
  const localPool = makePool(".env.local", false);
  const prodPool = makePool(".env.production", true);

  console.log(
    COMMIT
      ? "Modo COMMIT — se escribe en local y en producción."
      : "Modo DRY-RUN — se ejecuta todo dentro de una transacción y se deshace. Corre con --commit para aplicar.",
  );

  await runOn("LOCAL", localPool, async (conn, log) => {
    await fixBrands(conn, log);
    await fixNames(conn, log);
  });

  await runOn("PRODUCCIÓN", prodPool, async (conn, log) => {
    await fixBrands(conn, log);
    await fixNames(conn, log);
    await restoreProduct(localPool, conn, log);
  });

  // Informativo: solo una cuenta admin puede borrar productos.
  const [admins] = await prodPool.query("SELECT id, email, created_at FROM users WHERE role = 'admin' ORDER BY id");
  console.log(`\nCuentas con rol admin en producción (solo estas pueden borrar productos): ${admins.length}`);
  admins.forEach((a) => console.log(`  id ${a.id}  ${a.email}  (creada ${new Date(a.created_at).toISOString().slice(0, 10)})`));

  await localPool.end();
  await prodPool.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exitCode = 1;
});
