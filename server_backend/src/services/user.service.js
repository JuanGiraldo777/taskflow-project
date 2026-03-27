/**
 * @file server_backend/src/services/user.service.js
 * @description Servicios de perfil de usuario e historial de productos vistos.
 */
const pool = require("../config/db");

// ── Obtener perfil ──────────────────────────────────────────────────────────
const getById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
      id, full_name, email, favorite_perfume,
      perfume_rec, discount_code, role, created_at
    FROM users WHERE id = ?`,
    [id],
  );
  if (rows.length === 0) throw new Error("NOT_FOUND");
  return rows[0];
};

// ── Actualizar perfil ───────────────────────────────────────────────────────
const update = async (id, { fullName, favoritePerfume, perfumeRec }) => {
  await pool.execute(
    `UPDATE users
     SET full_name = ?, favorite_perfume = ?, perfume_rec = ?
     WHERE id = ?`,
    [fullName, favoritePerfume || null, perfumeRec || null, id],
  );
  return getById(id);
};

// ── Borrar perfil ───────────────────────────────────────────────────────────
const remove = async (id) => {
  const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]);
  if (result.affectedRows === 0) throw new Error("NOT_FOUND");
};

// ── Historial de productos vistos ───────────────────────────────────────────
// Mantiene solo las últimas 10 entradas por usuario
const getHistory = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT
      vp.viewed_at,
      p.id, p.name,
      p.original_price, p.discounted_price,
      COALESCE(p.discounted_price, p.original_price) AS price,
      b.name  AS brand,
      pi.url  AS image
    FROM viewed_products vp
    JOIN products      p  ON vp.product_id = p.id
    JOIN brands        b  ON p.brand_id    = b.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = TRUE
    WHERE vp.user_id = ?
    ORDER BY vp.viewed_at DESC
    LIMIT 10`,
    [userId],
  );
  return rows;
};

// ── Registrar producto visto ────────────────────────────────────────────────
const addToHistory = async (userId, productId) => {
  // Insertar la vista
  await pool.execute(
    "INSERT INTO viewed_products (user_id, product_id) VALUES (?, ?)",
    [userId, productId],
  );

  // Mantener solo las últimas 10 — borrar el exceso
  await pool.execute(
    `DELETE FROM viewed_products
     WHERE user_id = ?
     AND id NOT IN (
       SELECT id FROM (
         SELECT id FROM viewed_products
         WHERE user_id = ?
         ORDER BY viewed_at DESC
         LIMIT 10
       ) AS latest
     )`,
    [userId, userId],
  );
};

module.exports = { getById, update, remove, getHistory, addToHistory };
