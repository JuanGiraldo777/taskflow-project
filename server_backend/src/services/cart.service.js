/**
 * @file server_backend/src/services/cart.service.js
 * @description Servicios de negocio para carrito y validación de stock.
 */
const pool = require("../config/db");

// ── Ver carrito completo del usuario ────────────────────────────────────────
const getCart = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
      ci.id,
      ci.quantity,
      ci.added_at,
      ci.variant_id,
      p.id             AS product_id,
      p.type,
      p.name,
      p.original_price,
      p.discounted_price,
      pr.label         AS variant_label,
      CASE
        WHEN p.type = 'preparado' THEN pr.price
        ELSE COALESCE(p.discounted_price, p.original_price)
      END              AS price,
      b.name           AS brand,
      pi.url           AS image
    FROM cart_items ci
    JOIN products      p  ON ci.product_id = p.id
    JOIN brands        b  ON p.brand_id    = b.id
    LEFT JOIN product_variants pv ON ci.variant_id = pv.id
    LEFT JOIN presentations    pr ON pv.presentation_id = pr.id
    LEFT JOIN product_images   pi ON pi.product_id = p.id AND pi.is_main = TRUE
    WHERE ci.user_id = ?
    ORDER BY ci.added_at DESC`,
    [userId],
  );

  // Calcular el total del carrito
  const total = rows.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { items: rows, total: parseFloat(total.toFixed(2)) };
};

// ── Añadir producto al carrito ──────────────────────────────────────────────
// Para preparados, variantId es obligatorio (identifica la presentación) y el
// stock se valida contra product_variants, no contra products.
const addItem = async (userId, productId, variantId, quantity = 1) => {
  const [products] = await pool.execute(
    "SELECT id, type, stock FROM products WHERE id = ?",
    [productId],
  );
  if (products.length === 0) throw new Error("NOT_FOUND");
  const product = products[0];

  let availableStock = product.stock;
  let effectiveVariantId = null;

  if (product.type === "preparado") {
    if (!variantId) throw new Error("VARIANT_REQUIRED");

    const [variants] = await pool.execute(
      "SELECT id, stock FROM product_variants WHERE id = ? AND product_id = ?",
      [variantId, productId],
    );
    if (variants.length === 0) throw new Error("INVALID_VARIANT");

    effectiveVariantId = variants[0].id;
    availableStock = variants[0].stock;
  }

  if (availableStock < quantity) throw new Error("OUT_OF_STOCK");

  // "<=> ?" (NULL-safe equal) porque en originales variant_id es NULL, y
  // NULL = NULL da falso en SQL normal — así sí matchea la fila existente.
  const [existing] = await pool.execute(
    "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND variant_id <=> ?",
    [userId, productId, effectiveVariantId],
  );

  if (existing.length > 0) {
    const newQuantity = existing[0].quantity + quantity;
    if (availableStock < newQuantity) throw new Error("OUT_OF_STOCK");

    await pool.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", [
      newQuantity,
      existing[0].id,
    ]);
    return getCart(userId);
  }

  await pool.execute(
    "INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)",
    [userId, productId, effectiveVariantId, quantity],
  );

  return getCart(userId);
};

// ── Cambiar cantidad de un item ─────────────────────────────────────────────
const updateQuantity = async (userId, itemId, quantity) => {
  if (quantity < 1) throw new Error("INVALID_QUANTITY");

  const [items] = await pool.execute(
    `SELECT ci.id, ci.variant_id, p.stock AS product_stock, pv.stock AS variant_stock
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     LEFT JOIN product_variants pv ON ci.variant_id = pv.id
     WHERE ci.id = ? AND ci.user_id = ?`,
    [itemId, userId],
  );
  if (items.length === 0) throw new Error("NOT_FOUND");

  const availableStock = items[0].variant_id
    ? items[0].variant_stock
    : items[0].product_stock;
  if (availableStock < quantity) throw new Error("OUT_OF_STOCK");

  await pool.execute(
    "UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?",
    [quantity, itemId, userId],
  );

  return getCart(userId);
};

// ── Eliminar item del carrito ───────────────────────────────────────────────
const removeItem = async (userId, itemId) => {
  const [result] = await pool.execute(
    "DELETE FROM cart_items WHERE id = ? AND user_id = ?",
    [itemId, userId],
  );
  if (result.affectedRows === 0) throw new Error("NOT_FOUND");
  return getCart(userId);
};

// ── Vaciar carrito completo ─────────────────────────────────────────────────
const clearCart = async (userId) => {
  await pool.execute("DELETE FROM cart_items WHERE user_id = ?", [userId]);
};

module.exports = { getCart, addItem, updateQuantity, removeItem, clearCart };
