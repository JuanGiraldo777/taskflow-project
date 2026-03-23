const pool = require("../config/db");

// ── Ver carrito completo del usuario ────────────────────────────────────────
const getCart = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
      ci.id,
      ci.quantity,
      ci.added_at,
      p.id             AS product_id,
      p.name,
      p.original_price,
      p.discounted_price,
      COALESCE(p.discounted_price, p.original_price) AS price,
      b.name           AS brand,
      pi.url           AS image
    FROM cart_items ci
    JOIN products      p  ON ci.product_id = p.id
    JOIN brands        b  ON p.brand_id    = b.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = TRUE
    WHERE ci.user_id = ?
    ORDER BY ci.added_at DESC`,
    [userId],
  );

  // Calcular el total del carrito
  const total = rows.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { items: rows, total: parseFloat(total.toFixed(2)) };
};

// ── Añadir producto al carrito ──────────────────────────────────────────────
const addItem = async (userId, productId, quantity = 1) => {
  // Verificar que el producto existe y tiene stock
  const [products] = await pool.execute(
    "SELECT id, stock FROM products WHERE id = ?",
    [productId],
  );
  if (products.length === 0) throw new Error("NOT_FOUND");
  if (products[0].stock < quantity) throw new Error("OUT_OF_STOCK");

  // Si el producto ya está en el carrito, incrementar cantidad
  const [existing] = await pool.execute(
    "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
    [userId, productId],
  );

  if (existing.length > 0) {
    const newQuantity = existing[0].quantity + quantity;
    if (products[0].stock < newQuantity) throw new Error("OUT_OF_STOCK");

    await pool.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", [
      newQuantity,
      existing[0].id,
    ]);
    return getCart(userId);
  }

  // Si no existe, insertar nuevo item
  await pool.execute(
    "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)",
    [userId, productId, quantity],
  );

  return getCart(userId);
};

// ── Cambiar cantidad de un item ─────────────────────────────────────────────
const updateQuantity = async (userId, itemId, quantity) => {
  if (quantity < 1) throw new Error("INVALID_QUANTITY");

  const [items] = await pool.execute(
    "SELECT ci.id, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.user_id = ?",
    [itemId, userId],
  );
  if (items.length === 0) throw new Error("NOT_FOUND");
  if (items[0].stock < quantity) throw new Error("OUT_OF_STOCK");

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
