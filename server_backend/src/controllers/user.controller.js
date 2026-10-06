/**
 * @file server_backend/src/controllers/user.controller.js
 * @description Controlador de perfil de usuario e historial de visualización.
 */
const userService = require("../services/user.service");
const { text } = require("../utils/validation");

// ── GET /api/v1/users/:id ───────────────────────────────────────────────────
const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // El usuario solo puede ver su propio perfil
    if (req.user.id !== id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const user = await userService.getById(id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/v1/users/:id ───────────────────────────────────────────────────
const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (req.user.id !== id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const fullName = text(req.body.fullName);
    const favoritePerfume = text(req.body.favoritePerfume);
    const perfumeRec = text(req.body.perfumeRec);

    if (!fullName) {
      return res.status(400).json({ error: "fullName es obligatorio" });
    }
    // Mismos topes que las columnas (VARCHAR 100): más largo daba un 500.
    if (fullName.length < 2 || fullName.length > 100) {
      return res
        .status(400)
        .json({ error: "El nombre debe tener entre 2 y 100 caracteres" });
    }
    if (favoritePerfume.length > 100 || perfumeRec.length > 100) {
      return res.status(400).json({
        error: "El perfume favorito y la recomendación admiten hasta 100 caracteres",
      });
    }

    const updated = await userService.update(id, {
      fullName,
      favoritePerfume,
      perfumeRec,
    });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/v1/users/:id ────────────────────────────────────────────────
const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (req.user.id !== id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    await userService.remove(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/users/:id/history ──────────────────────────────────────────
const getHistory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (req.user.id !== id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const history = await userService.getHistory(id);
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/users/:id/history ─────────────────────────────────────────
const addToHistory = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { productId } = req.body;

    if (req.user.id !== userId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    if (!productId) {
      return res.status(400).json({ error: "productId es obligatorio" });
    }

    await userService.addToHistory(userId, productId);
    res.status(201).json({ message: "Producto añadido al historial" });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/users/:id/privacy-consent ──────────────────────────────────
// Para cuentas anteriores a la política: guarda la prueba de que aceptó.
const acceptPrivacy = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.id !== id) {
      return res.status(403).json({ error: "No autorizado" });
    }
    if (req.body.accept !== true) {
      return res.status(400).json({ error: "Falta la aceptación de la política" });
    }
    const result = await userService.acceptPrivacy(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getById, update, remove, getHistory, addToHistory, acceptPrivacy };
