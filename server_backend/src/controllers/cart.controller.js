const cartService = require("../services/cart.service");

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId)
      return res.status(400).json({ error: "productId es obligatorio" });

    const cart = await cartService.addItem(
      req.user.id,
      productId,
      quantity || 1,
    );
    res.status(201).json(cart);
  } catch (err) {
    if (err.message === "OUT_OF_STOCK")
      return res.status(400).json({ error: "Stock insuficiente" });
    next(err);
  }
};

const updateQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity)
      return res.status(400).json({ error: "quantity es obligatorio" });

    const cart = await cartService.updateQuantity(
      req.user.id,
      parseInt(req.params.id, 10),
      quantity,
    );
    res.status(200).json(cart);
  } catch (err) {
    if (err.message === "OUT_OF_STOCK")
      return res.status(400).json({ error: "Stock insuficiente" });
    if (err.message === "INVALID_QUANTITY")
      return res
        .status(400)
        .json({ error: "La cantidad debe ser mayor que 0" });
    next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeItem(
      req.user.id,
      parseInt(req.params.id, 10),
    );
    res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await cartService.clearCart(req.user.id);
    res.status(200).json({ message: "carrito vacio" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addItem, updateQuantity, removeItem, clearCart };
