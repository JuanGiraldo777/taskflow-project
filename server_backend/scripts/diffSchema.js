/**
 * @file server_backend/scripts/diffSchema.js
 * @description Compara el schema completo (TODAS las tablas y columnas)
 * entre local y producción — no solo las tablas que uno asuma que cambiaron.
 * Nace de un descuido real: migrateProdSchema.js (2026-09-04) solo tocó
 * products/categories/genders/presentations/product_variants porque esas
 * eran las tablas que la reestructuración de Fases 1-4 obviamente tocaba,
 * pero cart_items también había ganado una columna (variant_id) en algún
 * momento y nunca se revisó — el POST /cart/items empezó a tirar 500 en
 * producción porque a esa tabla le faltaba la columna. Solo lectura.
 *
 * Uso:
 *   node scripts/diffSchema.js
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

  async function loadSchema(pool, dbName) {
    const [cols] = await pool.query(
      `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [dbName],
    );
    const byTable = new Map();
    for (const c of cols) {
      if (!byTable.has(c.TABLE_NAME)) byTable.set(c.TABLE_NAME, new Map());
      byTable.get(c.TABLE_NAME).set(c.COLUMN_NAME, c);
    }
    return byTable;
  }

  const [[{ localDb }]] = await localPool.query("SELECT DATABASE() as localDb");
  const [[{ prodDb }]] = await prodPool.query("SELECT DATABASE() as prodDb");

  const [localSchema, prodSchema] = await Promise.all([
    loadSchema(localPool, localDb),
    loadSchema(prodPool, prodDb),
  ]);

  const allTables = new Set([...localSchema.keys(), ...prodSchema.keys()]);
  let anyDiff = false;

  for (const table of [...allTables].sort()) {
    const localCols = localSchema.get(table);
    const prodCols = prodSchema.get(table);

    if (!localCols) {
      console.log(`[TABLA SOLO EN PRODUCCIÓN] ${table}`);
      anyDiff = true;
      continue;
    }
    if (!prodCols) {
      console.log(`[TABLA SOLO EN LOCAL, FALTA EN PRODUCCIÓN] ${table}`);
      anyDiff = true;
      continue;
    }

    const allCols = new Set([...localCols.keys(), ...prodCols.keys()]);
    const tableDiffs = [];

    for (const col of allCols) {
      const l = localCols.get(col);
      const p = prodCols.get(col);
      if (!l) {
        tableDiffs.push(`  columna "${col}" SOLO en producción`);
        continue;
      }
      if (!p) {
        tableDiffs.push(`  columna "${col}" FALTA en producción (existe en local: ${l.COLUMN_TYPE}, nullable=${l.IS_NULLABLE})`);
        continue;
      }
      if (l.COLUMN_TYPE !== p.COLUMN_TYPE || l.IS_NULLABLE !== p.IS_NULLABLE) {
        tableDiffs.push(
          `  columna "${col}" distinta — local: ${l.COLUMN_TYPE} nullable=${l.IS_NULLABLE} | prod: ${p.COLUMN_TYPE} nullable=${p.IS_NULLABLE}`,
        );
      }
    }

    if (tableDiffs.length > 0) {
      console.log(`[DIFERENCIAS] ${table}`);
      tableDiffs.forEach((d) => console.log(d));
      anyDiff = true;
    }
  }

  if (!anyDiff) {
    console.log("Sin diferencias de schema entre local y producción.");
  }

  await localPool.end();
  await prodPool.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exitCode = 1;
});
