/**
 * @file ejercicio_web/js/api/client.js
 * @description Cliente HTTP del frontend para consumir la API REST del backend.
 */
const BASE_URL = "https://maison-backend-7pq8.onrender.com/api/v1";

function getToken() {
  return localStorage.getItem("token");
}

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Verifica que el backend esté activo en localhost:3000.",
    );
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new CustomEvent("session-expired"));
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error desconocido");
  }

  return data;
}

export const productsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();

    if (params.search) query.append("search", params.search);
    if (params.category) query.append("category", params.category);
    if (params.minPrice) query.append("minPrice", params.minPrice);
    if (params.maxPrice) query.append("maxPrice", params.maxPrice);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    if (params.brands && params.brands.length > 0) {
      params.brands.forEach((brand) => query.append("brand", brand));
    }

    const queryString = query.toString();
    return request(`/products${queryString ? `?${queryString}` : ""}`);
  },
  getById: (id) => request(`/products/${id}`),
};

export const categoriesApi = {
  getAll: () => request("/categories"),
};

export const brandsApi = {
  getAll: () => request("/brands"),
};

export const authApi = {
  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const userApi = {
  getById: (id) => request(`/users/${id}`),
  update: (id, data) =>
    request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id) => request(`/users/${id}`, { method: "DELETE" }),
  getHistory: (id) => request(`/users/${id}/history`),
  addToHistory: (id, productId) =>
    request(`/users/${id}/history`, {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),
};

export const cartApi = {
  getCart: () => request("/cart"),
  addItem: (productId, quantity) =>
    request("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    }),
  updateQuantity: (itemId, quantity) =>
    request(`/cart/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),
  removeItem: (itemId) =>
    request(`/cart/items/${itemId}`, {
      method: "DELETE",
    }),
  clearCart: () => request("/cart", { method: "DELETE" }),
};

export const wishlistApi = {
  getWishlist: () => request("/wishlist"),
  addItem: (productId) =>
    request("/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),
  removeItem: (itemId) =>
    request(`/wishlist/${itemId}`, {
      method: "DELETE",
    }),
  clearWishlist: () => request("/wishlist", { method: "DELETE" }),
};

export const reviewsApi = {
  getByProduct: (productId) => request(`/reviews/${productId}`),
  create: (productId, data) =>
    request(`/reviews/${productId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Nuevos — reseñas de tienda
  getStoreReviews: (page = 1, limit = 10) =>
    request(`/reviews?page=${page}&limit=${limit}`),

  createStoreReview: (data) =>
    request("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
