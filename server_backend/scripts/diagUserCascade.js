/**
 * @file server_backend/scripts/diagUserCascade.js
 * @description SOLO LECTURA. Comprueba que borrar una cuenta borra también sus
 * datos asociados (carrito, favoritos, reseñas, historial), como promete la
 * Política de Tratamiento de Datos (ejercicio_web/privacidad.html, sección 6).
 * Lo hace la base con ON DELETE CASCADE en cada clave foránea hacia users.
 * No cambia nada.
 *
 * Uso (Git Bash, desde server_backend/):
 *   node scripts/diagUserCascade.js                       (local)
 *   NODE_ENV=production node scripts/diagUserCascade.js   (producción)
 */
const pool = require("../src/config/db");
const { db } = require("../src/config/env");

const EXPECTED = ["cart_items", "wishlist_items", "reviews", "viewed_products"];

(async () => {
  try {
    console.log(`Base: ${db.database} (${process.env.NODE_ENV === "production" ? "PRODUCCIÓN" : "LOCAL"}) — solo lectura\n`);
    const [rows] = await pool.query(
      `SELECT k.TABLE_NAME AS tabla, k.COLUMN_NAME AS columna, r.DELETE_RULE AS al_borrar
       FROM information_schema.KEY_COLUMN_USAGE k
       JOIN information_schema.REFERENTIAL_CONSTRAINTS r
         ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
       WHERE k.TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME = 'users'
       ORDER BY k.TABLE_NAME`,
    );
    let ok = true;
    for (const t of EXPECTED) {
      const fk = rows.find((r) => r.tabla === t);
      const status = !fk ? "SIN CLAVE FORÁNEA" : fk.al_borrar === "CASCADE" ? "OK (CASCADE)" : `NO (${fk.al_borrar})`;
      if (status !== "OK (CASCADE)") ok = false;
      console.log(`${t.padEnd(16)} → ${status}`);
    }
    console.log(
      ok
        ? "\nTodo bien: borrar una cuenta borra sus datos asociados."
        : "\nATENCIÓN: alguna tabla no se borra en cascada. Avísale a Claude para preparar la corrección.",
    );
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
