const productService = require('../services/product.service');

const getAll = async (req, res, next) => {
  try {
    const { search, category, brand, minPrice, maxPrice, sortBy, page, limit } = req.query;

    if (minPrice && isNaN(parseFloat(minPrice))) {
      return res.status(400).json({ error: 'minPrice debe ser un número' });
    }
    if (maxPrice && isNaN(parseFloat(maxPrice))) {
      return res.status(400).json({ error: 'maxPrice debe ser un número' });
    }
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      return res.status(400).json({ error: 'minPrice no puede ser mayor que maxPrice' });
    }

    const result = await productService.getAll({
      search, category, brand, minPrice, maxPrice, sortBy, page, limit
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
      return res.status(400).json({ error: 'ID de producto inválido' });
    }

    const product = await productService.getById(parseInt(id));
    res.status(200).json(product);
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

module.exports = { getAll, getById, getAllCategories, getAllBrands };
