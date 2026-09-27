/**
 * @file server_backend/scripts/setUserRole.js
 * @description Da o quita el rol de admin a una cuenta existente, por correo.
 * No hay endpoint para esto a propósito: el rol se cambia a mano, desde la
 * máquina de alguien que tiene las credenciales de la base.
 *
 * La persona tiene que registrarse primero en la web con su propio correo y
 * contraseña (así la contraseña nunca se comparte). Después de aplicar el
 * cambio tiene que CERRAR SESIÓN Y VOLVER A ENTRAR: el rol viaja dentro del
 * token que se genera al iniciar sesión (auth.service.js), y verifyAdmin lee
 * el rol del token, no de la base.
 *
 * DRY-RUN por defecto (solo muestra qué cambiaría). Para aplicar: --commit.
 * No deja quitarle el rol al último admin (nadie podría volver al panel).
 *
 * Uso (Git Bash, desde server_backend/):
 *   NODE_ENV=production node scripts/setUserRole.js correo@ejemplo.com admin
 *   NODE_ENV=production node scripts/setUserRole.js correo@ejemplo.com admin --commit
 *   NODE_ENV=production node scripts/setUserRole.js correo@ejemplo.com user --commit   (quitar admin)
 * Sin NODE_ENV=production trabaja sobre la base LOCAL.
 */
const args = process.argv.slice(2).filter((a) => a !== "--commit");
const COMMIT = process.argv.includes("--commit");
const [email, role] = args;
const ROLES = ["admin", "user"];

if (!email || !role || !ROLES.includes(role)) {
  console.error(
    "Uso: node scripts/setUserRole.js <correo> <admin|user> [--commit]\n" +
      "Ejemplo: NODE_ENV=production node scripts/setUserRole.js ana@correo.com admin",
  );
  process.exit(1);
}

const pool = require("../src/config/db");

async function main() {
  const [[{ db }]] = await pool.query("SELECT DATABASE() AS db");
  console.log(
    `Base: ${db} (${process.env.NODE_ENV === "production" ? "PRODUCCIÓN" : "LOCAL"}) — ` +
      (COMMIT ? "modo COMMIT, se va a escribir." : "modo DRY-RUN, no se escribe nada."),
  );

  const [users] = await pool.query(
    "SELECT id, full_name, email, role FROM users WHERE LOWER(email) = LOWER(?)",
    [email.trim()],
  );
  if (users.length === 0) {
    console.error(
      `\nNo existe ninguna cuenta con el correo "${email}". La persona tiene que registrarse primero en la web.`,
    );
    process.exitCode = 1;
    return;
  }
  const user = users[0];
  console.log(`\nCuenta: #${user.id} ${user.full_name} <${user.email}> — rol actual: ${user.role}`);

  if (user.role === role) {
    console.log(`Ya tiene el rol "${role}". No hay nada que cambiar.`);
    return;
  }

  if (user.role === "admin" && role !== "admin") {
    const [[{ admins }]] = await pool.query("SELECT COUNT(*) AS admins FROM users WHERE role = 'admin'");
    if (admins <= 1) {
      console.error("\nEs el ÚNICO admin: si se le quita el rol, nadie podría volver a entrar al panel. No se cambia nada.");
      process.exitCode = 1;
      return;
    }
  }

  console.log(`Cambio: rol "${user.role}" -> "${role}"`);
  if (!COMMIT) {
    console.log("\n(Dry-run) Para aplicarlo, repite el mismo comando agregando --commit al final.");
    return;
  }

  await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, user.id]);
  console.log(
    `\nListo. ${user.full_name} ahora tiene rol "${role}".` +
      "\nTiene que CERRAR SESIÓN Y VOLVER A ENTRAR para que el cambio le funcione." +
      (role !== "admin"
        ? "\nOjo: si tenía una sesión abierta, sigue con permisos de admin hasta que su token venza (7 días) o se cambie JWT_SECRET."
        : ""),
  );

  const [admins] = await pool.query("SELECT id, email FROM users WHERE role = 'admin' ORDER BY id");
  console.log(`\nAdmins actuales (${admins.length}): ${admins.map((a) => a.email).join(", ")}`);
}

main()
  .catch((err) => {
    console.error("ERROR:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
