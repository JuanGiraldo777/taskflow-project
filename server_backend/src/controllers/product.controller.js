/**
 * @file server_backend/src/controllers/product.controller.js
 * @description Controlador de catálogo de productos, marcas y categorías.
 */
const productService = require("../services/product.service");

const getAll = async (req, res, next) => {
  try {
    const { search, category, brand, minPrice, maxPrice, sortBy, page, limit } =
      req.query;

    if (minPrice && isNaN(parseFloat(minPrice))) {
      return res.status(400).json({ error: "minPrice debe ser un número" });
    }
    if (maxPrice && isNaN(parseFloat(maxPrice))) {
      return res.status(400).json({ error: "maxPrice debe ser un número" });
    }
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      return res
        .status(400)
        .json({ error: "minPrice no puede ser mayor que maxPrice" });
    }

    const result = await productService.getAll({
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      sortBy,
      page,
      limit,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const product = await productService.getById(parseInt(id));
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/products/:id/related
const getRelated = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const productId = parseInt(id);
    const product = await productService.getById(productId);
    const related = await productService.getRelated(
      productId,
      product.brand_id,
      product.category_id,
    );

    res.status(200).json(related);
  } catch (err) {
    next(err);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await productService.getAllCategories();
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
};

const getAllBrands = async (req, res, next) => {
  try {
    const brands = await productService.getAllBrands();
    res.status(200).json(brands);
  } catch (err) {
    next(err);
  }
};

const getAllGenders = async (req, res, next) => {
  try {
    const genders = await productService.getAllGenders();
    res.status(200).json(genders);
  } catch (err) {
    next(err);
  }
};

const getAllPresentations = async (req, res, next) => {
  try {
    const presentations = await productService.getAllPresentations();
    res.status(200).json(presentations);
  } catch (err) {
    next(err);
  }
};

// Valida las reglas comunes a create/update: type, ids obligatorios, y según
// el type, o bien originalPrice (original) o bien variants (preparado).
// Devuelve un mensaje de error, o null si todo está bien.
const validateProductPayload = ({
  type,
  categoryId,
  brandId,
  genderId,
  name,
  originalPrice,
  discountedPrice,
  variants,
}) => {
  if (!type || !["original", "preparado"].includes(type)) {
    return "type debe ser 'original' o 'preparado'";
  }

  if (!categoryId || !brandId || !genderId || !name) {
    return "categoryId, brandId, genderId y name son obligatorios";
  }

  if (type === "original") {
    if (!originalPrice || originalPrice <= 0) {
      return "originalPrice debe ser mayor que 0";
    }
    if (discountedPrice && discountedPrice >= originalPrice) {
      return "discountedPrice debe ser menor que originalPrice";
    }
  }

  if (type === "preparado") {
    if (!Array.isArray(variants) || variants.length === 0) {
      return "preparado necesita al menos una presentación en 'variants'";
    }
    const invalid = variants.some(
      (v) => !v.presentationId || v.stock == null || v.stock < 0,
    );
    if (invalid) {
      return "cada variante necesita presentationId y stock (>= 0)";
    }
  }

  return null;
};

// Traduce los errores de negocio que lanza product.service.js (la matriz
// sexo-subcategoría) a una respuesta 400 legible en vez de un 500 genérico.
const handleProductServiceError = (err, res, next) => {
  if (err.message === "INVALID_CATEGORY" || err.message === "INVALID_GENDER") {
    return res.status(400).json({ error: "categoryId o genderId inválido" });
  }
  if (err.message === "INVALID_GENDER_FOR_CATEGORY") {
    return res.status(400).json({
      error: "Ese sexo no es válido para la subcategoría elegida",
    });
  }
  next(err);
};

const createProduct = async (req, res, next) => {
  try {
    const {
      type,
      categoryId,
      brandId,
      genderId,
      name,
      description,
      originalPrice,
      discountedPrice,
      stock,
      imageUrl,
      variants,
    } = req.body;

    const validationError = validateProductPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const product = await productService.create({
      type,
      categoryId,
      brandId,
      genderId,
      name,
      description,
      originalPrice,
      discountedPrice,
      stock,
      imageUrl,
      variants,
    });

    res.status(201).json(product);
  } catch (err) {
    handleProductServiceError(err, res, next);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const {
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
    } = req.body;

    const validationError = validateProductPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const product = await productService.update(id, {
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
    });

    res.status(200).json(product);
  } catch (err) {
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    handleProductServiceError(err, res, next);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    await productService.remove(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  getRelated,
  getAllCategories,
  getAllBrands,
  getAllGenders,
  getAllPresentations,
  createProduct,
  updateProduct,
  deleteProduct,
};
