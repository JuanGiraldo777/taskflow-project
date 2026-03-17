// Sistema de perfil de usuario local con uso de localStorage

const USER_STORAGE_KEY = "maison-user-profile";
const COUPON_STORAGE_KEY = "maison-user-coupon";

/**
 * Obtiene el perfil del usuario desde localStorage
 */
function getUserProfile() {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  return stored
    ? JSON.parse(stored)
    : {
        fullName: "",
        email: "",
        favoritePerfume: "",
        recommendation: "",
        viewedProducts: [],
      };
}

/**
 * Guarda el perfil del usuario en localStorage
 */
function saveUserProfile(profile) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
}

/**
 * Obtiene el nombre del usuario para pre-rellenar el formulario de reseñas
 */
export function getUserName() {
  const profile = getUserProfile();
  return profile.fullName || "";
}

/**
 * Obtiene la recomendación personal del usuario
 */
export function getUserRecommendation() {
  const profile = getUserProfile();
  return profile.recommendation || "";
}

/**
 * Registra un producto como visto
 */
export function trackProductView(id, name, price) {
  const profile = getUserProfile();

  // Agregar el producto al inicio del array
  const newProduct = { id, name, price };
  profile.viewedProducts.unshift(newProduct);

  // Mantener solo los últimos 5
  if (profile.viewedProducts.length > 5) {
    profile.viewedProducts = profile.viewedProducts.slice(0, 5);
  }

  saveUserProfile(profile);
}

/**
 * Genera un cupón de descuento único para el usuario
 */
function generateCoupon() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MAISON-2026-${code}`;
}

/**
 * Activa el cupón de descuento cuando se envía una reseña
 */
export function activateCoupon() {
  const coupon = localStorage.getItem(COUPON_STORAGE_KEY);
  if (!coupon) {
    // Solo generar si no existe
    const newCoupon = generateCoupon();
    localStorage.setItem(COUPON_STORAGE_KEY, newCoupon);
  }
}

/**
 * Obtiene el cupón activo del usuario
 */
function getUserCoupon() {
  return localStorage.getItem(COUPON_STORAGE_KEY) || null;
}

/**
 * Actualiza el perfil del usuario
 */
function updateUserProfile(fullName, email, favoritePerfume, recommendation) {
  const profile = getUserProfile();
  profile.fullName = fullName.trim();
  profile.email = email.trim();
  profile.favoritePerfume = favoritePerfume.trim();
  profile.recommendation = recommendation.trim();
  saveUserProfile(profile);
  updateUserIcon();
  renderProfileModal();
}

/**
 * Borra el perfil completo del usuario
 */
function deleteUserProfile() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(COUPON_STORAGE_KEY);
  updateUserIcon();
  renderProfileModal();
}

/**
 * Actualiza el icono del usuario en el header
 */
function updateUserIcon() {
  const profile = getUserProfile();
  const userButton = document.querySelector("#user-profile-btn");

  if (!userButton) return;

  if (profile.fullName) {
    // Obtener iniciales
    const names = profile.fullName.trim().split(" ");
    const initials = (
      (names[0]?.[0] || "") + (names[names.length - 1]?.[0] || "")
    )
      .toUpperCase()
      .slice(0, 2);

    userButton.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-(--accent) text-black flex items-center justify-center font-bold text-sm">
        ${initials}
      </div>
    `;
  } else {
    // Mostrar SVG original
    userButton.innerHTML = `
      <svg
        class="stroke-(--bg) cursor-pointer opacity-85 hover:opacity-100 hover:-translate-y-px transition-all duration-200"
        width="30"
        height="30"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
        />
      </svg>
    `;
  }
}

/**
 * Renderiza el modal del perfil de usuario
 */
function renderProfileModal() {
  let modalHTML = document.getElementById("user-profile-modal");

  if (!modalHTML) {
    modalHTML = document.createElement("div");
    modalHTML.id = "user-profile-modal";
    document.body.appendChild(modalHTML);
  }

  const profile = getUserProfile();
  const coupon = getUserCoupon();

  modalHTML.innerHTML = `
    <div class="fixed inset-0 bg-black/50 z-[400] hidden flex items-center justify-center p-4" id="user-modal-overlay">
      <div class="bg-(--card-bg) rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-(--accent) border-opacity-30">
        <!-- Header -->
        <div class="bg-(--bg) p-6 border-b border-(--accent) border-opacity-30 flex justify-between items-center sticky top-0">
          <h2 class="font-serif text-2xl text-(--text) tracking-wide">Mi Perfil</h2>
          <button id="close-profile-modal" class="text-gray-400 hover:text-(--accent) transition-colors">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <!-- Avatar Section -->
          <div class="text-center pb-4 border-b border-gray-700">
            ${
              profile.fullName
                ? `
              <div class="w-20 h-20 rounded-full bg-(--accent) text-black flex items-center justify-center font-bold text-2xl mx-auto mb-3">
                ${((profile.fullName.split(" ")[0]?.[0] || "") + (profile.fullName.split(" ")[profile.fullName.split(" ").length - 1]?.[0] || ""))
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <p class="font-serif text-lg text-(--text)">${profile.fullName}</p>
              ${profile.email ? `<p class="text-sm text-gray-400">${profile.email}</p>` : ""}
            `
                : `<p class="text-(--text) opacity-60">Sin perfil guardado</p>`
            }
          </div>

          <!-- Editable Fields -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Nombre Completo</label>
              <input
                type="text"
                id="edit-fullname"
                value="${profile.fullName}"
                placeholder="Tu nombre completo"
                class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent)"
              />
            </div>

            <div>
              <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Email</label>
              <input
                type="email"
                id="edit-email"
                value="${profile.email}"
                placeholder="tu@email.com"
                class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent)"
              />
            </div>

            <div>
              <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Perfume Favorito</label>
              <input
                type="text"
                id="edit-favorite-perfume"
                value="${profile.favoritePerfume}"
                placeholder="Tu perfume favorito de Maison de L'Eternel"
                class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent)"
              />
            </div>

            <div>
              <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Recomendación Personal</label>
              <textarea
                id="edit-recommendation"
                placeholder="Recomenda un perfume a otros clientes..."
                rows="3"
                class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent) resize-none"
              >${profile.recommendation}</textarea>
            </div>
          </div>

          <!-- Coupon Section -->
          ${
            coupon
              ? `
            <div class="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-lg border-2 border-(--accent) border-opacity-50">
              <div class="text-center">
                <p class="text-sm text-(--text) mb-2">🎁 Tienes un cupón de descuento en tu próxima compra</p>
                <p class="font-mono font-bold text-(--accent) text-lg">${coupon}</p>
              </div>
            </div>
          `
              : ""
          }

          <!-- Viewed Products Section -->
          ${
            profile.viewedProducts && profile.viewedProducts.length > 0
              ? `
            <div class="border-t border-gray-700 pt-4">
              <h3 class="font-serif text-lg text-(--text) mb-3">Vistos Recientemente</h3>
              <div class="space-y-2">
                ${profile.viewedProducts
                  .map(
                    (product) => `
                  <div class="bg-(--bg) p-3 rounded flex justify-between items-center text-sm">
                    <span class="text-(--text)">${product.name}</span>
                    <span class="text-(--accent) font-semibold">$${product.price.toLocaleString()}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4 border-t border-gray-700">
            <button id="save-profile-btn" class="flex-1 px-4 py-2 bg-(--accent) text-black font-serif font-bold rounded hover:opacity-90 active:scale-95 transition-all">
              Guardar Cambios
            </button>
            <button id="delete-profile-btn" class="flex-1 px-4 py-2 border border-gray-600 text-(--text) font-sans rounded hover:border-(--accent) hover:text-(--accent) transition-all">
              Borrar Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  attachProfileModalListeners();
}

/**
 * Asigna listeners al modal del perfil
 */
function attachProfileModalListeners() {
  const overlay = document.getElementById("user-modal-overlay");
  const closeBtn = document.getElementById("close-profile-modal");
  const saveBtn = document.getElementById("save-profile-btn");
  const deleteBtn = document.getElementById("delete-profile-btn");
  const userIcon = document.getElementById("user-profile-btn");

  if (userIcon) {
    userIcon.addEventListener("click", () => {
      overlay?.classList.remove("hidden");
    });
  }

  closeBtn?.addEventListener("click", () => {
    overlay?.classList.add("hidden");
  });

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.add("hidden");
    }
  });

  saveBtn?.addEventListener("click", () => {
    const fullName = document.getElementById("edit-fullname")?.value || "";
    const email = document.getElementById("edit-email")?.value || "";
    const favoritePerfume = document.getElementById("edit-favorite-perfume")?.value || "";
    const recommendation = document.getElementById("edit-recommendation")?.value || "";

    updateUserProfile(fullName, email, favoritePerfume, recommendation);
    overlay?.classList.add("hidden");
  });

  deleteBtn?.addEventListener("click", () => {
    if (confirm("¿Estás seguro de que deseas borrar tu perfil?")) {
      deleteUserProfile();
      overlay?.classList.add("hidden");
    }
  });
}

/**
 * Inicializa el sistema de perfil de usuario
 */
export function initUser() {
  updateUserIcon();
  renderProfileModal();
}
