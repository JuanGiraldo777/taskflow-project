/**
 * @file server_backend/src/services/product.service.js
 * @description Servicios de catálogo: búsqueda, filtros, detalle y relacionados.
 */
const pool = require("../config/db");

// Precio a mostrar: para un original es su propio precio (con descuento si
// aplica); para un preparado no hay un precio único en `products`, así que
// se usa el más barato de sus presentaciones ("Desde $X").
const PRICE_EXPR = `
  CASE
    WHEN p.type = 'original' THEN COALESCE(p.discounted_price, p.original_price)
    ELSE (
      SELECT MIN(pr.price)
      FROM product_variants pv
      JOIN presentations pr ON pr.id = pv.presentation_id
      WHERE pv.product_id = p.id
    )
  END
`;

// "Trending"/"top ventas": todavía no hay un módulo de pedidos que dé un
// conteo de ventas real, así que se usa como referencia viewed_products
// (vistas de producto reales, de cualquier usuario) — mejora sola a medida
// que el sitio recibe tráfico real, en vez de ser un orden inventado.
const TRENDING_EXPR = `(
  SELECT COUNT(*) FROM viewed_products vprod WHERE vprod.product_id = p.id
)`;

const getAll = async ({
  search,
  category,
  brand,
  type,
  gender,
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

  if (type === "original" || type === "preparado") {
    conditions.push("p.type = ?");
    params.push(type);
  }

  if (gender) {
    conditions.push("g.slug = ?");
    params.push(gender);
  }

  if (category) {
    // "category" llega como slug desde el filtro (igual que "gender" y
    // "brand"), no como id — comparar contra p.category_id directo nunca
    // hubiera dado match. Bug real, encontrado al probar por primera vez
    // el filtro de categoría end-to-end (Fase 3, navegación por menú).
    conditions.push("c.slug = ?");
    params.push(category);
  }

  if (brand) {
    const brands = Array.isArray(brand) ? brand : [brand];
    const placeholders = brands.map(() => "?").join(", ");
    conditions.push(`b.slug IN (${placeholders})`);
    params.push(...brands);
  }

  if (minPrice) {
    conditions.push(`${PRICE_EXPR} >= ?`);
    params.push(parseFloat(minPrice));
  }

  if (maxPrice) {
    conditions.push(`${PRICE_EXPR} <= ?`);
    params.push(parseFloat(maxPrice));
  }

  const whereClause =
    conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const sortOptions = {
    "price-asc": `${PRICE_EXPR} ASC`,
    "price-desc": `${PRICE_EXPR} DESC`,
    "name-asc": "p.name ASC",
    "name-desc": "p.name DESC",
    newest: "p.created_at DESC",
    trending: `${TRENDING_EXPR} DESC, p.created_at DESC`,
  };
  const orderClause = `ORDER BY ${sortOptions[sortBy] || "p.created_at DESC"}`;

  const pageNum = Number(parseInt(page) || 1);
  const limitNum = Number(parseInt(limit) || 10);
  const offset = (pageNum - 1) * limitNum;

  const dataQuery = `
    SELECT
      p.id,
      p.name,
      p.type,
      b.name           AS brand,
      p.original_price,
      p.discounted_price,
      ${PRICE_EXPR}    AS price,
      p.stock,
      c.name           AS category,
      g.name           AS gender,
      pi.url           AS image
    FROM products p
    LEFT JOIN categories     c  ON p.category_id = c.id
    LEFT JOIN brands         b  ON p.brand_id    = b.id
    LEFT JOIN genders        g  ON p.gender_id   = g.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = TRUE
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands      b ON p.brand_id    = b.id
    LEFT JOIN genders     g ON p.gender_id   = g.id
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
      p.gender_id,
      p.type,
      p.name,
      p.description,
      p.original_price,
      p.discounted_price,
      p.stock,
      p.created_at,
      b.name AS brand,
      c.name AS category,
      g.name AS gender
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands     b ON p.brand_id    = b.id
    LEFT JOIN genders    g ON p.gender_id   = g.id
    WHERE p.id = ?
  `,
    [id],
  );

  if (rows.length === 0) {
    throw new Error("NOT_FOUND");
  }

  const product = rows[0];

  const [images] = await pool.execute(
    "SELECT url, is_main FROM product_images WHERE product_id = ? ORDER BY is_main DESC",
    [id],
  );

  if (product.type === "preparado") {
    const [variants] = await pool.execute(
      `SELECT
        pv.id      AS variant_id,
        pv.stock,
        pr.id      AS presentation_id,
        pr.label,
        pr.price
      FROM product_variants pv
      JOIN presentations pr ON pr.id = pv.presentation_id
      WHERE pv.product_id = ?
      ORDER BY pr.price ASC`,
      [id],
    );

    const price = variants.length
      ? Math.min(...variants.map((v) => Number(v.price)))
      : null;

    return { ...product, images, variants, price };
  }

  const price = product.discounted_price ?? product.original_price;
  return { ...product, images, variants: [], price };
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

// Mismo criterio que scripts/importCatalog.js (no se comparte código entre
// scripts/ y src/, así que se repite la lógica, no la duplicación de un
// import): minúsculas, sin acentos, espacios/símbolos → guiones.
const slugify = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const createBrand = async (name) => {
  const slug = slugify(name);
  if (!slug) throw new Error("INVALID_BRAND_NAME");

  const [existing] = await pool.execute(
    "SELECT id FROM brands WHERE slug = ?",
    [slug],
  );
  if (existing.length > 0) throw new Error("BRAND_EXISTS");

  const [result] = await pool.execute(
    "INSERT INTO brands (name, slug) VALUES (?, ?)",
    [name.trim(), slug],
  );
  return { id: result.insertId, name: name.trim(), slug };
};

const getAllGenders = async () => {
  const [rows] = await pool.execute(
    "SELECT id, name, slug FROM genders ORDER BY id ASC",
  );
  return rows;
};

const getAllPresentations = async () => {
  const [rows] = await pool.execute(
    "SELECT id, label, price FROM presentations ORDER BY price ASC",
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
      p.type,
      p.original_price,
      p.discounted_price,
      ${PRICE_EXPR} AS price,
      b.name  AS brand,
      c.name  AS category,
      g.name  AS gender,
      pi.url  AS image
    FROM products p
    LEFT JOIN brands         b  ON p.brand_id    = b.id
    LEFT JOIN categories     c  ON p.category_id = c.id
    LEFT JOIN genders        g  ON p.gender_id   = g.id
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
      p.type,
      p.original_price,
      p.discounted_price,
      ${PRICE_EXPR} AS price,
      b.name  AS brand,
      c.name  AS category,
      g.name  AS gender,
      pi.url  AS image
    FROM products p
    LEFT JOIN brands         b  ON p.brand_id    = b.id
    LEFT JOIN categories     c  ON p.category_id = c.id
    LEFT JOIN genders        g  ON p.gender_id   = g.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = TRUE
    WHERE p.category_id = ? AND p.id NOT IN (${placeholders})
    LIMIT ?`,
    [categoryId, ...existingIds, needed],
  );

  return [...byBrand, ...byCategory];
};

// Qué sexos son válidos para cada combinación type+categoría. Vive aquí (no
// en la BD, sin CHECK constraint) porque el catálogo real todavía puede
// cambiar esta regla — así se ajusta editando este objeto, sin migración.
// Los preparados no tienen subcategoría real — solo existe la categoría
// "Preparados", y el sexo (dama/caballero/unisex) hace las veces de
// clasificación. Los originales sí distinguen árabe/nicho/diseñador, cada
// uno con sus sexos válidos.
const VALID_GENDERS_BY_TYPE_CATEGORY = {
  preparado: {
    preparados: ["dama", "caballero", "unisex"],
  },
  original: {
    arabe: ["dama", "caballero", "unisex"],
    nicho: ["dama", "caballero", "unisex"],
    disenador: ["dama", "caballero"],
  },
};

const validateGenderForCategory = async (type, categoryId, genderId) => {
  const [[category]] = await pool.execute(
    "SELECT slug FROM categories WHERE id = ?",
    [categoryId],
  );
  const [[gender]] = await pool.execute(
    "SELECT slug FROM genders WHERE id = ?",
    [genderId],
  );

  if (!category) throw new Error("INVALID_CATEGORY");
  if (!gender) throw new Error("INVALID_GENDER");

  const allowed = VALID_GENDERS_BY_TYPE_CATEGORY[type]?.[category.slug] || [];
  if (!allowed.includes(gender.slug)) {
    throw new Error("INVALID_GENDER_FOR_CATEGORY");
  }
};

const create = async ({
  type,
  categoryId,
  brandId,
  genderId,
  name,
  description,
  originalPrice,
  discountedPrice,
  stock,
  imageUrls,
  variants,
}) => {
  await validateGenderForCategory(type, categoryId, genderId);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO products
        (category_id, brand_id, gender_id, type, name, description, original_price, discounted_price, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        categoryId,
        brandId,
        genderId,
        type,
        name,
        description || null,
        type === "original" ? originalPrice : null,
        type === "original" ? discountedPrice || null : null,
        type === "original" ? stock || 0 : 0,
      ],
    );

    const productId = result.insertId;

    if (type === "preparado") {
      for (const variant of variants) {
        await connection.execute(
          "INSERT INTO product_variants (product_id, presentation_id, stock) VALUES (?, ?, ?)",
          [productId, variant.presentationId, variant.stock || 0],
        );
      }
    }

    // La primera URL es la imagen principal (is_main, la que se ve en las
    // tarjetas); el resto arma la galería de la página de detalle. Ninguna
    // es obligatoria — hay productos sin foto todavía (import real, ver
    // importCatalog.js) y el frontend ya tiene placeholder para ese caso.
    const cleanImageUrls = (imageUrls || [])
      .map((url) => (typeof url === "string" ? url.trim() : ""))
      .filter(Boolean);
    for (const [index, url] of cleanImageUrls.entries()) {
      await connection.execute(
        "INSERT INTO product_images (product_id, url, is_main) VALUES (?, ?, ?)",
        [productId, url, index === 0],
      );
    }

    await connection.commit();
    return getById(productId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const update = async (
  id,
  {
    type,
    categoryId,
    brandId,
    genderId,
    name,
    description,
    originalPrice,
    discountedPrice,
    stock,
    variants,
    imageUrls,
  },
) => {
  const [existing] = await pool.execute(
    "SELECT id FROM products WHERE id = ?",
    [id],
  );
  if (existing.length === 0) {
    throw new Error("NOT_FOUND");
  }

  await validateGenderForCategory(type, categoryId, genderId);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE products
       SET category_id = ?, brand_id = ?, gender_id = ?, type = ?, name = ?, description = ?,
           original_price = ?, discounted_price = ?, stock = ?
       WHERE id = ?`,
      [
        categoryId,
        brandId,
        genderId,
        type,
        name,
        description || null,
        type === "original" ? originalPrice : null,
        type === "original" ? discountedPrice || null : null,
        type === "original" ? stock || 0 : 0,
        id,
      ],
    );

    if (type === "preparado") {
      // Se reemplazan todas las variantes: más simple que calcular un diff
      // entre las presentaciones viejas y nuevas, y el admin siempre manda
      // la lista completa de presentaciones vigentes.
      await connection.execute(
        "DELETE FROM product_variants WHERE product_id = ?",
        [id],
      );
      for (const variant of variants || []) {
        await connection.execute(
          "INSERT INTO product_variants (product_id, presentation_id, stock) VALUES (?, ?, ?)",
          [id, variant.presentationId, variant.stock || 0],
        );
      }
    }

    // Igual que las variantes: se reemplazan todas. Pero a diferencia de
    // variants (que el form de preparados siempre manda completo),
    // imageUrls es opcional acá — si el caller ni lo manda (undefined), no
    // se tocan las imágenes existentes; solo un array explícito (aunque
    // sea vacío) las reemplaza. Evita que un PUT que no sepa de imágenes
    // las borre por accidente.
    if (imageUrls !== undefined) {
      await connection.execute(
        "DELETE FROM product_images WHERE product_id = ?",
        [id],
      );
      const cleanImageUrls = imageUrls
        .map((url) => (typeof url === "string" ? url.trim() : ""))
        .filter(Boolean);
      for (const [index, url] of cleanImageUrls.entries()) {
        await connection.execute(
          "INSERT INTO product_images (product_id, url, is_main) VALUES (?, ?, ?)",
          [id, url, index === 0],
        );
      }
    }

    await connection.commit();
    return getById(id);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
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
  getAllGenders,
  getAllPresentations,
  getRelated,
  create,
  update,
  remove,
  createBrand,
};
