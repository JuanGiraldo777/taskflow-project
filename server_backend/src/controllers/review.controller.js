/**
 * @file server_backend/src/controllers/review.controller.js
 * @description Controlador de reseñas por producto.
 */
const reviewService = require("../services/review.service");
const { text, parseRating } = require("../utils/validation");

const MAX_COMMENT_LENGTH = 1000;

// Puntuación entera 1-5 y comentario opcional de hasta 1000 caracteres.
// Antes "rating" no se validaba como número y el comentario no tenía tope
// (la columna es TEXT: cabían ~64 KB por reseña).
function parseReviewBody(body) {
  const rating = parseRating(body.rating);
  if (rating === null) {
    return { error: "La puntuación debe ser un número entero entre 1 y 5" };
  }
  const comment = text(body.comment);
  if (comment.length > MAX_COMMENT_LENGTH) {
    return {
      error: `El comentario no puede superar los ${MAX_COMMENT_LENGTH} caracteres`,
    };
  }
  return { rating, comment };
}

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
    const { rating, comment, error } = parseReviewBody(req.body);
    if (error) return res.status(400).json({ error });

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
    const { rating, comment, error } = parseReviewBody(req.body);
    if (error) return res.status(400).json({ error });

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
