/**
 * @file server_backend/src/services/product.service.js
 * @description Servicios de catálogo: búsqueda, filtros, detalle y relacionados.
 */
const pool = require("../config/db");

const getAll = async ({
  search,
  category,
  brand,
  minPrice,
  maxPrice,
  sortBy,
  page,
  limit,
}) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push("(p.name LIKE ? OR b.name LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    conditions.push("p.category_id = ?");
    params.push(category);
  }

  if (brand) {
    const brands = Array.isArray(brand) ? brand : [brand];
    const placeholders = brands.map(() => "?").join(", ");
    conditions.push(`b.slug IN (${placeholders})`);
    params.push(...brands);
  }

  if (minPrice) {
    conditions.push("COALESCE(p.discounted_price, p.original_price) >= ?");
    params.push(parseFloat(minPrice));
  }

  if (maxPrice) {
    conditions.push("COALESCE(p.discounted_price, p.original_price) <= ?");
    params.push(parseFloat(maxPrice));
  }

  const whereClause =
    conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const sortOptions = {
    "price-asc": "COALESCE(p.discounted_price, p.original_price) ASC",
    "price-desc": "COALESCE(p.discounted_price, p.original_price) DESC",
    "name-asc": "p.name ASC",
    "name-desc": "p.name DESC",
  };
  const orderClause = `ORDER BY ${sortOptions[sortBy] || "p.created_at DESC"}`;

  const pageNum = Number(parseInt(page) || 1);
  const limitNum = Number(parseInt(limit) || 10);
  const offset = (pageNum - 1) * limitNum;

  const dataQuery = `
    SELECT
      p.id,
      p.name,
      b.name                                        AS brand,
      p.original_price,
      p.discounted_price,
      COALESCE(p.discounted_price, p.original_price) AS price,
      p.stock,
      c.name                                        AS category,
      pi.url                                        AS image
    FROM products p
    LEFT JOIN categories     c  ON p.category_id = c.id
    LEFT JOIN brands         b  ON p.brand_id    = b.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = TRUE
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    ${whereClause}
  `;

  const [[rows], [[{ total }]]] = await Promise.all([
    pool.query(dataQuery, [...params, limitNum, offset]),
    pool.execute(countQuery, params),
  ]);

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

const getById = async (id) => {
  const [rows] = await pool.execute(
    `
    SELECT
      p.id,
      p.brand_id,
      p.category_id,
      p.name,
      p.description,
      p.original_price,
      p.discounted_price,
      COALESCE(p.discounted_price, p.original_price) AS price,
      p.stock,
      p.created_at,
      b.name AS brand,
      c.name AS category
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands     b ON p.brand_id    = b.id
    WHERE p.id = ?
  `,
    [id],
  );

  if (rows.length === 0) {
    throw new Error("NOT_FOUND");
  }

  const [images] = await pool.execute(
    "SELECT url, is_main FROM product_images WHERE product_id = ? ORDER BY is_main DESC",
    [id],
  );

  return { ...rows[0], images };
};

const getAllCategories = async () => {
  const [rows] = await pool.execute("SELECT id, name, slug FROM categories");
  return rows;
};

const getAllBrands = async () => {
  const [rows] = await pool.execute(
    "SELECT id, name, slug FROM brands ORDER BY name ASC",
  );
  return rows;
};

// Productos relacionados
// Prioriza misma marca (excluyendo el producto actual) y completa con categoría.
const getRelated = async (productId, brandId, categoryId) => {
  const [byBrand] = await pool.query(
    `SELECT
      p.id,
      p.name,
      p.original_price,
      p.discounted_price,
      COALESCE(p.discounted_price, p.original_price) AS price,
      b.name  AS brand,
      pi.url  AS image
    FROM products p
    LEFT JOIN brands         b  ON p.brand_id    = b.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = TRUE
    WHERE p.brand_id = ? AND p.id != ?
    LIMIT 4`,
    [brandId, productId],
  );

  if (byBrand.length >= 4) {
    return byBrand;
  }

  const existingIds = [productId, ...byBrand.map((p) => p.id)];
  const placeholders = existingIds.map(() => "?").join(", ");
  const needed = 4 - byBrand.length;

  const [byCategory] = await pool.query(
    `SELECT
      p.id,
      p.name,
      p.original_price,
      p.discounted_price,
      COALESCE(p.discounted_price, p.original_price) AS price,
      b.name  AS brand,
      pi.url  AS image
    FROM products p
    LEFT JOIN brands         b  ON p.brand_id    = b.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = TRUE
    WHERE p.category_id = ? AND p.id NOT IN (${placeholders})
    LIMIT ?`,
    [categoryId, ...existingIds, needed],
  );

  return [...byBrand, ...byCategory];
};

const create = async ({
  categoryId,
  brandId,
  name,
  description,
  originalPrice,
  discountedPrice,
  stock,
  imageUrl,
}) => {
  const [result] = await pool.execute(
    `INSERT INTO products
      (category_id, brand_id, name, description, original_price, discounted_price, stock)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      categoryId,
      brandId,
      name,
      description || null,
      originalPrice,
      discountedPrice || null,
      stock || 0,
    ],
  );

  const productId = result.insertId;

  if (imageUrl) {
    await pool.execute(
      "INSERT INTO product_images (product_id, url, is_main) VALUES (?, ?, TRUE)",
      [productId, imageUrl],
    );
  }

  return getById(productId);
};

const update = async (
  id,
  {
    categoryId,
    brandId,
    name,
    description,
    originalPrice,
    discountedPrice,
    stock,
  },
) => {
  const [existing] = await pool.execute(
    "SELECT id FROM products WHERE id = ?",
    [id],
  );
  if (existing.length === 0) {
    throw new Error("NOT_FOUND");
  }

  await pool.execute(
    `UPDATE products
     SET category_id = ?, brand_id = ?, name = ?, description = ?,
         original_price = ?, discounted_price = ?, stock = ?
     WHERE id = ?`,
    [
      categoryId,
      brandId,
      name,
      description || null,
      originalPrice,
      discountedPrice || null,
      stock,
      id,
    ],
  );

  return getById(id);
};

const remove = async (id) => {
  const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [
    id,
  ]);
  if (result.affectedRows === 0) {
    throw new Error("NOT_FOUND");
  }
};

module.exports = {
  getAll,
  getById,
  getAllCategories,
  getAllBrands,
  getRelated,
  create,
  update,
  remove,
};
