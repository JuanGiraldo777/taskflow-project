const pool = require("../config/db");

const getAllUsers = async () => {
  const [rows] = await pool.execute(
    `SELECT
      id, full_name, email, role,
      discount_code, created_at
     FROM users
     ORDER BY created_at DESC`,
  );

  return rows;
};

const removeUser = async (id) => {
  const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    throw new Error("NOT_FOUND");
  }
};

module.exports = { getAllUsers, removeUser };
