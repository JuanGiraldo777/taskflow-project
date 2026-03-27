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

const createProduct = async (req, res, next) => {
  try {
    const {
      categoryId,
      brandId,
      name,
      description,
      originalPrice,
      discountedPrice,
      stock,
      imageUrl,
    } = req.body;

    if (!categoryId || !brandId || !name || !originalPrice) {
      return res.status(400).json({
        error: "categoryId, brandId, name y originalPrice son obligatorios",
      });
    }

    if (originalPrice <= 0) {
      return res
        .status(400)
        .json({ error: "originalPrice debe ser mayor que 0" });
    }

    if (discountedPrice && discountedPrice >= originalPrice) {
      return res.status(400).json({
        error: "discountedPrice debe ser menor que originalPrice",
      });
    }

    const product = await productService.create({
      categoryId,
      brandId,
      name,
      description,
      originalPrice,
      discountedPrice,
      stock,
      imageUrl,
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de producto inválido" });
    }

    const {
      categoryId,
      brandId,
      name,
      description,
      originalPrice,
      discountedPrice,
      stock,
    } = req.body;

    if (!categoryId || !brandId || !name || !originalPrice) {
      return res.status(400).json({
        error: "categoryId, brandId, name y originalPrice son obligatorios",
      });
    }

    if (discountedPrice && discountedPrice >= originalPrice) {
      return res.status(400).json({
        error: "discountedPrice debe ser menor que originalPrice",
      });
    }

    const product = await productService.update(id, {
      categoryId,
      brandId,
      name,
      description,
      originalPrice,
      discountedPrice,
      stock,
    });

    res.status(200).json(product);
  } catch (err) {
    next(err);
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
  createProduct,
  updateProduct,
  deleteProduct,
};
