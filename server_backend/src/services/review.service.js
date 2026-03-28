/**
 * @file server_backend/src/services/review.service.js
 * @description Servicios de reseñas y generación de código de descuento.
 */
const pool = require("../config/db");

// ── Generador de código de descuento ────────────────────────────────────────
// Formato: MAISON-2026-XXXXXX (6 caracteres aleatorios alfanuméricos)
const generateDiscountCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const code = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `MAISON-2026-${code}`;
};

// ── Ver reseñas de un producto ──────────────────────────────────────────────
const getByProduct = async (productId) => {
  const [rows] = await pool.query(
    `SELECT
      r.id,
      r.rating,
      r.comment,
      r.created_at,
      u.full_name AS author
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC`,
    [productId],
  );
  return rows;
};

// ── Crear reseña + generar discount_code ────────────────────────────────────
const create = async (userId, productId, { rating, comment }) => {
  // Verificar que el producto existe
  const [products] = await pool.execute(
    "SELECT id FROM products WHERE id = ?",
    [productId],
  );
  if (products.length === 0) throw new Error("NOT_FOUND");

  // Un usuario solo puede dejar una reseña por producto
  const [existing] = await pool.execute(
    "SELECT id FROM reviews WHERE user_id = ? AND product_id = ?",
    [userId, productId],
  );
  if (existing.length > 0) throw new Error("ALREADY_REVIEWED");

  // Insertar la reseña
  const [result] = await pool.execute(
    "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)",
    [userId, productId, rating, comment || null],
  );

  // Generar discount_code y actualizar en el perfil del usuario
  // Recompensa por dejar una reseña - formato MAISON-2026-XXXXXX
  const discountCode = generateDiscountCode();
  await pool.execute("UPDATE users SET discount_code = ? WHERE id = ?", [
    discountCode,
    userId,
  ]);

  return {
    id: result.insertId,
    rating,
    comment: comment || null,
    discountCode,
  };
};

// ── Reseñas de tienda — paginadas ───────────────────────────────────────────
// product_id IS NULL identifica las reseñas de tienda
const getStoreReviews = async ({ page, limit }) => {
  const pageNum = Number(parseInt(page) || 1);
  const limitNum = Number(parseInt(limit) || 10);
  const offset = (pageNum - 1) * limitNum;

  const [rows] = await pool.query(
    `SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name AS author
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id IS NULL
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?`,
    [limitNum, offset],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM reviews WHERE product_id IS NULL`,
  );

  return {
    data: rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// ── Crear reseña de tienda ───────────────────────────────────────────────────
// Misma lógica que create() pero sin product_id
// También genera discount_code MAISON-2026-XXXXXX
const createStoreReview = async (userId, { rating, comment }) => {
  // Un usuario solo puede dejar una reseña de tienda
  const [existing] = await pool.execute(
    "SELECT id FROM reviews WHERE user_id = ? AND product_id IS NULL",
    [userId],
  );
  if (existing.length > 0) throw new Error("ALREADY_REVIEWED");

  const [result] = await pool.execute(
    "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, NULL, ?, ?)",
    [userId, rating, comment || null],
  );

  // Generar discount_code igual que en reseñas de producto
  const discountCode = generateDiscountCode();
  await pool.execute("UPDATE users SET discount_code = ? WHERE id = ?", [
    discountCode,
    userId,
  ]);

  return {
    id: result.insertId,
    rating,
    comment: comment || null,
    discountCode,
  };
};

module.exports = { getByProduct, create, getStoreReviews, createStoreReview };
