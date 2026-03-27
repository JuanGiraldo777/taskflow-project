/**
 * @file server_backend/src/services/wishlist.service.js
 * @description Servicios de wishlist con control de duplicados.
 */
const pool = require("../config/db");

// ── Ver wishlist del usuario ────────────────────────────────────────────────
const getWishlist = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
      wi.id,
      wi.added_at,
      p.id             AS product_id,
      p.name,
      p.original_price,
      p.discounted_price,
      COALESCE(p.discounted_price, p.original_price) AS price,
      b.name           AS brand,
      pi.url           AS image
    FROM wishlist_items wi
    JOIN products      p  ON wi.product_id = p.id
    JOIN brands        b  ON p.brand_id    = b.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = TRUE
    WHERE wi.user_id = ?
    ORDER BY wi.added_at DESC`,
    [userId],
  );
  return rows;
};

// ── Añadir producto a wishlist ──────────────────────────────────────────────
const addItem = async (userId, productId) => {
  // Verificar que el producto existe
  const [products] = await pool.execute(
    "SELECT id FROM products WHERE id = ?",
    [productId],
  );
  if (products.length === 0) throw new Error("NOT_FOUND");

  // Evitar duplicados silenciosamente
  const [existing] = await pool.execute(
    "SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?",
    [userId, productId],
  );
  if (existing.length > 0) return getWishlist(userId);

  await pool.execute(
    "INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)",
    [userId, productId],
  );

  return getWishlist(userId);
};

// ── Eliminar item de wishlist ───────────────────────────────────────────────
const removeItem = async (userId, itemId) => {
  const [result] = await pool.execute(
    "DELETE FROM wishlist_items WHERE id = ? AND user_id = ?",
    [itemId, userId],
  );
  if (result.affectedRows === 0) throw new Error("NOT_FOUND");
  return getWishlist(userId);
};

// ── Vaciar wishlist completa ───────────────────────────────────────────────
const clearWishlist = async (userId) => {
  await pool.execute("DELETE FROM wishlist_items WHERE user_id = ?", [userId]);
};

module.exports = { getWishlist, addItem, removeItem, clearWishlist };
