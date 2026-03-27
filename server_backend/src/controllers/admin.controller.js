/**
 * @file server_backend/src/controllers/admin.controller.js
 * @description Controlador de administración para gestión de usuarios.
 */
const adminService = require("../services/admin.service");

const getAllUsers = async (req, res, next) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de usuario inválido" });
    }

    if (Number(req.user.id) === id) {
      return res
        .status(400)
        .json({ error: "No puedes eliminar tu propia cuenta de admin" });
    }

    await adminService.removeUser(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, deleteUser };
