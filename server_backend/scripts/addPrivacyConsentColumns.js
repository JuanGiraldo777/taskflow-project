/**
 * @file server_backend/scripts/addPrivacyConsentColumns.js
 * @description Agrega a users las columnas que guardan la prueba de la
 * autorización de datos personales (Ley 1581 de 2012):
 *   - privacy_accepted_at    DATETIME NULL  → cuándo aceptó
 *   - privacy_policy_version VARCHAR(20) NULL → qué versión de la política
 * Las cuentas que ya existen quedan en NULL: el sitio les pedirá aceptar la
 * política en su próximo inicio de sesión.
 *
 * HAY QUE CORRERLO (local y producción) ANTES de publicar el backend que
 * usa estas columnas; si no, el registro y el perfil fallarían.
 * Idempotente: si las columnas ya existen, no hace nada.
 *
 * DRY-RUN por defecto (solo muestra qué haría). Para aplicar: --commit.
 * Uso (Git Bash, desde server_backend/):
 *   node scripts/addPrivacyConsentColumns.js                          (local, dry-run)
 *   node scripts/addPrivacyConsentColumns.js --commit                 (local)
 *   NODE_ENV=production node scripts/addPrivacyConsentColumns.js      (producción, dry-run)
 *   NODE_ENV=production node scripts/addPrivacyConsentColumns.js --commit
 */
const pool = require("../src/config/db");
const { db } = require("../src/config/env");

const COMMIT = process.argv.includes("--commit");
const COLUMNS = [
  {
    name: "privacy_accepted_at",
    ddl: "ALTER TABLE users ADD COLUMN privacy_accepted_at DATETIME NULL DEFAULT NULL AFTER role",
  },
  {
    name: "privacy_policy_version",
    ddl: "ALTER TABLE users ADD COLUMN privacy_policy_version VARCHAR(20) NULL DEFAULT NULL AFTER privacy_accepted_at",
  },
];

(async () => {
  try {
    console.log(
      `Base: ${db.database} (${process.env.NODE_ENV === "production" ? "PRODUCCIÓN" : "LOCAL"})` +
        (COMMIT ? " — APLICANDO CAMBIOS" : " — dry-run, no se cambia nada"),
    );

    const [existing] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
         AND COLUMN_NAME IN ('privacy_accepted_at', 'privacy_policy_version')`,
    );
    const have = new Set(existing.map((r) => r.COLUMN_NAME));
    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM users");

    const missing = COLUMNS.filter((c) => !have.has(c.name));
    if (missing.length === 0) {
      console.log("Las dos columnas ya existen. No hay nada que hacer.");
      return;
    }

    for (const col of missing) {
      if (COMMIT) {
        await pool.query(col.ddl);
        console.log(`Columna users.${col.name} agregada.`);
      } else {
        console.log(`Se agregaría users.${col.name}`);
      }
    }
    console.log(
      `\n${total} cuenta(s) existente(s) quedan sin aceptación registrada (NULL): ` +
        "se les pedirá aceptar la política al iniciar sesión.",
    );
    if (!COMMIT) {
      console.log("\n(Dry-run) Para aplicarlo, repite el mismo comando agregando --commit al final.");
    } else {
      console.log("\nListo.");
    }
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
