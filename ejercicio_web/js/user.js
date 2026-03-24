import { authApi, userApi } from "./api/client.js";

let isRegisterMode = false;

function normalizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    fullName: user.fullName || user.full_name || "",
    email: user.email || "",
    favoritePerfume: user.favoritePerfume || user.favorite_perfume || "",
    perfumeRec: user.perfumeRec || user.perfume_rec || "",
    discountCode: user.discountCode || user.discount_code || "",
    role: user.role || "user",
  };
}

export function getCurrentUser() {
  const stored = localStorage.getItem("user");
  return stored ? normalizeUser(JSON.parse(stored)) : null;
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

function saveSession(token, user) {
  if (token) {
    localStorage.setItem("token", token);
  }
  localStorage.setItem("user", JSON.stringify(normalizeUser(user)));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

async function handleLogin(email, password) {
  try {
    const result = await authApi.login({ email, password });
    saveSession(result.token, result.user);
    isRegisterMode = false;
    updateUserIcon();
    await renderProfileModal();
    window.dispatchEvent(new CustomEvent("user-logged-in"));
  } catch (err) {
    alert(err.message);
  }
}

async function handleRegister(fullName, email, password) {
  try {
    await authApi.register({ fullName, email, password });
    await handleLogin(email, password);
  } catch (err) {
    alert(err.message);
  }
}

function handleLogout() {
  clearSession();
  isRegisterMode = false;
  updateUserIcon();
  renderProfileModal();
  window.dispatchEvent(new CustomEvent("session-expired"));
}

async function handleUpdateProfile(fullName, favoritePerfume, perfumeRec) {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const updated = await userApi.update(user.id, {
      fullName,
      favoritePerfume,
      perfumeRec,
    });

    saveSession(localStorage.getItem("token"), {
      ...user,
      fullName: updated.full_name,
      favoritePerfume: updated.favorite_perfume,
      perfumeRec: updated.perfume_rec,
      discountCode: updated.discount_code,
    });

    updateUserIcon();
    await renderProfileModal();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteProfile() {
  const user = getCurrentUser();
  if (!user) return;

  if (!confirm("¿Estás seguro de que deseas borrar tu perfil?")) return;

  try {
    await userApi.remove(user.id);
    handleLogout();
  } catch (err) {
    alert(err.message);
  }
}

export async function trackProductView(productId) {
  const user = getCurrentUser();
  if (!user) return;

  try {
    await userApi.addToHistory(user.id, productId);
  } catch (err) {
    console.error("Error al registrar vista:", err);
  }
}

export function getUserName() {
  return getCurrentUser()?.fullName || "";
}

export function getUserRecommendation() {
  return getCurrentUser()?.perfumeRec || "";
}

function updateUserIcon() {
  const userButton = document.querySelector("#user-profile-btn");
  if (!userButton) return;

  const user = getCurrentUser();

  if (isLoggedIn() && user?.fullName) {
    const names = user.fullName.trim().split(" ").filter(Boolean);
    const initials = (
      (names[0]?.[0] || "") + (names[names.length - 1]?.[0] || "")
    )
      .toUpperCase()
      .slice(0, 2);

    userButton.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-(--accent) text-black flex items-center justify-center font-bold text-sm">
        ${initials || "U"}
      </div>
    `;
    return;
  }

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

async function getViewedHistory() {
  const user = getCurrentUser();
  if (!user) return [];

  try {
    return await userApi.getHistory(user.id);
  } catch (err) {
    console.error("Error al cargar historial:", err);
    return [];
  }
}

function buildAuthFormHtml() {
  return `
    <div class="p-6 space-y-6">
      <div class="text-center pb-2 border-b border-gray-700">
        <p class="text-(--text) opacity-80 font-sans text-sm">
          ${isRegisterMode ? "Crea tu cuenta para guardar carrito y favoritos" : "Inicia sesión para acceder a tu perfil"}
        </p>
      </div>

      <form id="auth-form" class="space-y-4">
        ${
          isRegisterMode
            ? `
          <div>
            <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Nombre Completo</label>
            <input
              type="text"
              id="auth-fullname"
              placeholder="Tu nombre completo"
              class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent)"
              required
            />
          </div>
        `
            : ""
        }

        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Email</label>
          <input
            type="email"
            id="auth-email"
            placeholder="tu@email.com"
            class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent)"
            required
          />
        </div>

        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Contraseña</label>
          <input
            type="password"
            id="auth-password"
            placeholder="••••••••"
            class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent)"
            minlength="6"
            required
          />
        </div>

        <button id="auth-submit-btn" type="submit" class="w-full px-4 py-2 bg-(--accent) text-black font-serif font-bold rounded hover:opacity-90 active:scale-95 transition-all">
          ${isRegisterMode ? "Crear Cuenta" : "Iniciar Sesión"}
        </button>
      </form>

      <button id="toggle-auth-mode" class="w-full px-4 py-2 border border-gray-600 text-(--text) font-sans rounded hover:border-(--accent) hover:text-(--accent) transition-all text-sm">
        ${isRegisterMode ? "Ya tengo cuenta" : "Crear cuenta nueva"}
      </button>
    </div>
  `;
}

function buildProfileHtml(user, history) {
  return `
    <div class="p-6 space-y-6">
      <div class="text-center pb-4 border-b border-gray-700">
        <div class="w-20 h-20 rounded-full bg-(--accent) text-black flex items-center justify-center font-bold text-2xl mx-auto mb-3">
          ${(
            (user.fullName?.split(" ")[0]?.[0] || "") +
            (user.fullName?.split(" ")[
              user.fullName?.split(" ").length - 1
            ]?.[0] || "")
          )
            .toUpperCase()
            .slice(0, 2)}
        </div>
        <p class="font-serif text-lg text-(--text)">${user.fullName}</p>
        <p class="text-sm text-gray-400">${user.email}</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Nombre Completo</label>
          <input
            type="text"
            id="edit-fullname"
            value="${user.fullName || ""}"
            placeholder="Tu nombre completo"
            class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent)"
          />
        </div>

        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Email</label>
          <input
            type="email"
            id="edit-email"
            value="${user.email || ""}"
            readonly
            class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-30 rounded text-sm opacity-70"
          />
        </div>

        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Perfume Favorito</label>
          <input
            type="text"
            id="edit-favorite-perfume"
            value="${user.favoritePerfume || ""}"
            placeholder="Tu perfume favorito de Maison de L'Eternel"
            class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent)"
          />
        </div>

        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Recomendación Personal</label>
          <textarea
            id="edit-recommendation"
            placeholder="Recomienda un perfume a otros clientes..."
            rows="3"
            class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent) resize-none"
          >${user.perfumeRec || ""}</textarea>
        </div>
      </div>

      ${
        user.discountCode
          ? `
        <div class="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-lg border-2 border-(--accent) border-opacity-50">
          <div class="text-center">
            <p class="text-sm text-(--text) mb-2">Tienes un cupón de descuento en tu próxima compra</p>
            <p class="font-mono font-bold text-(--accent) text-lg">${user.discountCode}</p>
          </div>
        </div>
      `
          : ""
      }

      ${
        history.length > 0
          ? `
        <div class="border-t border-gray-700 pt-4">
          <h3 class="font-serif text-lg text-(--text) mb-3">Vistos Recientemente</h3>
          <div class="space-y-2">
            ${history
              .map(
                (product) => `
              <div class="bg-(--bg) p-3 rounded flex justify-between items-center text-sm">
                <span class="text-(--text)">${product.name}</span>
                <span class="text-(--accent) font-semibold">$${Number(product.price || 0).toLocaleString()}</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }

      <div class="flex gap-3 pt-4 border-t border-gray-700">
        <button id="save-profile-btn" class="flex-1 px-4 py-2 bg-(--accent) text-black font-serif font-bold rounded hover:opacity-90 active:scale-95 transition-all">
          Guardar Cambios
        </button>
        <button id="delete-profile-btn" class="flex-1 px-4 py-2 border border-gray-600 text-(--text) font-sans rounded hover:border-(--accent) hover:text-(--accent) transition-all">
          Borrar Perfil
        </button>
      </div>
      <button id="logout-btn" class="w-full px-4 py-2 border border-gray-600 text-(--text) font-sans rounded hover:border-(--accent) hover:text-(--accent) transition-all text-sm">
        Cerrar sesión
      </button>
    </div>
  `;
}

async function renderProfileModal() {
  let modalRoot = document.getElementById("user-profile-modal");

  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "user-profile-modal";
    document.body.appendChild(modalRoot);
  }

  const user = getCurrentUser();
  const history = isLoggedIn() && user ? await getViewedHistory() : [];

  modalRoot.innerHTML = `
    <div class="fixed inset-0 bg-black/50 z-[400] hidden flex items-center justify-center p-4" id="user-modal-overlay">
      <div class="bg-(--card-bg) rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-(--accent) border-opacity-30">
        <div class="bg-(--bg) p-6 border-b border-(--accent) border-opacity-30 flex justify-between items-center sticky top-0">
          <h2 class="font-serif text-2xl text-(--text) tracking-wide">Mi Perfil</h2>
          <button id="close-profile-modal" class="text-gray-400 hover:text-(--accent) transition-colors">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        ${isLoggedIn() && user ? buildProfileHtml(user, history) : buildAuthFormHtml()}
      </div>
    </div>
  `;

  attachProfileModalListeners();
}

function attachProfileModalListeners() {
  const overlay = document.getElementById("user-modal-overlay");
  const closeBtn = document.getElementById("close-profile-modal");
  const userIcon = document.getElementById("user-profile-btn");
  const authForm = document.getElementById("auth-form");
  const toggleAuthModeBtn = document.getElementById("toggle-auth-mode");
  const saveBtn = document.getElementById("save-profile-btn");
  const deleteBtn = document.getElementById("delete-profile-btn");
  const logoutBtn = document.getElementById("logout-btn");

  if (userIcon) {
    userIcon.onclick = () => {
      overlay?.classList.remove("hidden");
    };
  }

  closeBtn?.addEventListener("click", () => {
    overlay?.classList.add("hidden");
  });

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.add("hidden");
    }
  });

  toggleAuthModeBtn?.addEventListener("click", async () => {
    isRegisterMode = !isRegisterMode;
    await renderProfileModal();
    const newOverlay = document.getElementById("user-modal-overlay");
    newOverlay?.classList.remove("hidden");
  });

  authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("auth-email")?.value?.trim() || "";
    const password = document.getElementById("auth-password")?.value || "";

    if (isRegisterMode) {
      const fullName =
        document.getElementById("auth-fullname")?.value?.trim() || "";
      await handleRegister(fullName, email, password);
    } else {
      await handleLogin(email, password);
    }

    const currentOverlay = document.getElementById("user-modal-overlay");
    currentOverlay?.classList.add("hidden");
  });

  saveBtn?.addEventListener("click", async () => {
    const fullName = document.getElementById("edit-fullname")?.value || "";
    const favoritePerfume =
      document.getElementById("edit-favorite-perfume")?.value || "";
    const perfumeRec =
      document.getElementById("edit-recommendation")?.value || "";

    await handleUpdateProfile(fullName, favoritePerfume, perfumeRec);
    const currentOverlay = document.getElementById("user-modal-overlay");
    currentOverlay?.classList.add("hidden");
  });

  deleteBtn?.addEventListener("click", () => {
    handleDeleteProfile();
    const currentOverlay = document.getElementById("user-modal-overlay");
    currentOverlay?.classList.add("hidden");
  });

  logoutBtn?.addEventListener("click", () => {
    handleLogout();
    const currentOverlay = document.getElementById("user-modal-overlay");
    currentOverlay?.classList.add("hidden");
  });
}

export function initUser() {
  updateUserIcon();
  renderProfileModal();

  window.addEventListener("session-expired", () => {
    updateUserIcon();
    renderProfileModal();
  });
}
