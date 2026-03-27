/**
 * @file server_backend/src/controllers/wishlist.controller.js
 * @description Controlador de lista de deseos del usuario autenticado.
 */
const wishlistService = require("../services/wishlist.service");

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.getWishlist(req.user.id);
    res.status(200).json(wishlist);
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ error: "productId es obligatorio" });

    const wishlist = await wishlistService.addItem(req.user.id, productId);
    res.status(201).json(wishlist);
  } catch (err) {
    next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.removeItem(
      req.user.id,
      parseInt(req.params.id, 10),
    );
    res.status(200).json(wishlist);
  } catch (err) {
    next(err);
  }
};

const clearWishlist = async (req, res, next) => {
  try {
    await wishlistService.clearWishlist(req.user.id);
    res.status(200).json({ message: "wishlist vacia" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWishlist, addItem, removeItem, clearWishlist };
