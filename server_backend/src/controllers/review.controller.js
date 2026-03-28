/**
 * @file server_backend/src/controllers/review.controller.js
 * @description Controlador de reseñas por producto.
 */
const reviewService = require("../services/review.service");

const getByProduct = async (req, res, next) => {
  try {
    const reviews = await reviewService.getByProduct(
      parseInt(req.params.productId, 10),
    );
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating)
      return res.status(400).json({ error: "rating es obligatorio" });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: "rating debe estar entre 1 y 5" });

    const review = await reviewService.create(
      req.user.id,
      parseInt(req.params.productId, 10),
      { rating, comment },
    );
    res.status(201).json(review);
  } catch (err) {
    if (err.message === "ALREADY_REVIEWED") {
      return res
        .status(409)
        .json({ error: "Ya has dejado una reseña para este producto" });
    }
    next(err);
  }
};

const getStoreReviews = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await reviewService.getStoreReviews({ page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const createStoreReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({ error: "rating es obligatorio" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating debe estar entre 1 y 5" });
    }

    const review = await reviewService.createStoreReview(req.user.id, {
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.message === "ALREADY_REVIEWED") {
      return res.status(409).json({
        error: "Ya has dejado una reseña de la tienda",
      });
    }
    next(err);
  }
};

module.exports = { getByProduct, create, getStoreReviews, createStoreReview };
