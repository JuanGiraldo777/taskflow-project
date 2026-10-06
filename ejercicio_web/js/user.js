/**
 * @file ejercicio_web/js/user.js
 * @description Módulo de sesión y perfil de usuario autenticado.
 */
import { authApi, userApi } from "./api/client.js";
import { escapeHtml } from "./escape.js";
import { HONEYPOT_HTML, armForm, antiSpamFields, withSubmitLock } from "./formGuard.js";
import { track } from "./analytics.js";

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
    // true/false según el servidor; undefined = sesión abierta antes de que
    // existiera la política (se consulta una vez, ver ensurePrivacyConsent).
    privacyAccepted: user.privacyAccepted ?? user.privacy_accepted,
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
    track("login", { method: "email" });
    isRegisterMode = false;
    updateUserIcon();
    await renderProfileModal();
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    ensurePrivacyConsent();
  } catch (err) {
    alert(err.message);
  }
}

async function handleRegister(fullName, email, password, extra = {}) {
  try {
    await authApi.register({ fullName, email, password, ...extra });
    track("sign_up", { method: "email" });
    await handleLogin(email, password);
  } catch (err) {
    alert(err.message);
  }
}

// ── Autorización de datos de cuentas anteriores a la política ────────────────
// La Ley 1581 exige autorización previa. Las cuentas nuevas la dan con la
// casilla del registro; a las que ya existían se les pide aquí una vez.
// Si no aceptan, se cierra la sesión (no podemos seguir tratando sus datos).
async function ensurePrivacyConsent() {
  const user = getCurrentUser();
  if (!isLoggedIn() || !user || user.privacyAccepted === true) return;

  if (user.privacyAccepted === undefined) {
    try {
      const fresh = await userApi.getById(user.id);
      if (fresh.privacy_accepted) {
        saveSession(null, { ...user, privacyAccepted: true });
        return;
      }
    } catch {
      return; // sin conexión: se vuelve a intentar en la próxima visita
    }
  }
  showPrivacyConsentModal(user);
}

function showPrivacyConsentModal(user) {
  if (document.getElementById("privacy-consent-modal")) return;
  const modal = document.createElement("div");
  modal.id = "privacy-consent-modal";
  modal.className = "fixed inset-0 bg-black/60 z-[450] flex items-center justify-center p-4";
  modal.innerHTML = `
    <div role="dialog" aria-modal="true" aria-labelledby="privacy-consent-title"
         class="bg-(--card-bg) text-(--text) rounded-xl w-full max-w-md p-6 border border-(--accent) space-y-4">
      <h2 id="privacy-consent-title" class="font-serif text-2xl">Tu autorización de datos</h2>
      <p class="font-sans text-sm leading-relaxed">
        Publicamos nuestra <a href="privacidad.html" target="_blank" rel="noopener" class="underline text-(--accent)">Política de Tratamiento de Datos</a>.
        Para seguir usando tu cuenta (carrito, favoritos y reseñas) necesitamos que la aceptes,
        como exige la Ley 1581 de 2012.
      </p>
      <div class="flex flex-col gap-2">
        <button type="button" data-privacy="accept"
                class="w-full min-h-11 px-4 bg-(--accent) text-black font-serif font-bold rounded hover:opacity-90">
          Acepto la política
        </button>
        <button type="button" data-privacy="decline"
                class="w-full min-h-11 px-4 border border-(--text) font-sans text-sm rounded hover:border-(--accent)">
          No acepto, cerrar sesión
        </button>
      </div>
    </div>
  `;
  modal.addEventListener("click", async (e) => {
    const choice = e.target.closest("[data-privacy]")?.dataset.privacy;
    if (choice === "accept") {
      try {
        await userApi.acceptPrivacy(user.id);
        saveSession(null, { ...getCurrentUser(), privacyAccepted: true });
        modal.remove();
      } catch (err) {
        alert(err.message);
      }
    } else if (choice === "decline") {
      modal.remove();
      handleLogout();
      alert(
        "Cerramos tu sesión. Si quieres que borremos tu cuenta, escríbenos a maisondeleternelco@gmail.com.",
      );
    }
  });
  document.body.appendChild(modal);
  modal.querySelector("[data-privacy='accept']")?.focus();
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
    // Con un solo nombre ("Ana"), una sola inicial (antes salía "AA").
    const initials = (
      (names[0]?.[0] || "") + (names.length > 1 ? names[names.length - 1][0] : "")
    )
      .toUpperCase()
      .slice(0, 2);

    // El nombre accesible debe contener lo que se ve (las iniciales), WCAG 2.5.3.
    userButton.setAttribute("aria-label", `Abrir mi perfil ${initials || "U"}`);
    userButton.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-(--accent) text-black flex items-center justify-center font-bold text-sm">
        ${escapeHtml(initials || "U")}
      </div>
    `;
    return;
  }

  userButton.setAttribute("aria-label", "Abrir perfil de usuario");
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

      <form id="auth-form" class="space-y-4" style="position: relative">
        ${isRegisterMode ? HONEYPOT_HTML : ""}
        ${
          isRegisterMode
            ? `
          <div>
            <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Nombre Completo</label>
            <input
              type="text"
              id="auth-fullname"
              placeholder="Tu nombre completo"
              maxlength="100"
              autocomplete="name"
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
            ${isRegisterMode ? 'minlength="8" maxlength="72" autocomplete="new-password"' : 'autocomplete="current-password"'}
            required
          />
        </div>

        ${
          isRegisterMode
            ? `
        <label class="privacy-consent">
          <input type="checkbox" id="auth-privacy" required />
          <span>
            Acepto la <a href="privacidad.html" target="_blank" rel="noopener">Política de Tratamiento de Datos</a>
            y autorizo el uso de mis datos para gestionar mi cuenta y mis pedidos.
          </span>
        </label>
        <p class="form-legal-note">
          Responsable: Maison Éternelle (Ivan Florez, Ibagué). Puedes consultar, corregir o
          borrar tus datos cuando quieras.
        </p>
        `
            : ""
        }
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
          ${escapeHtml(
            (
              (user.fullName?.split(" ")[0]?.[0] || "") +
              (user.fullName?.trim().split(" ").length > 1
                ? user.fullName.trim().split(" ").at(-1)[0]
                : "")
            )
              .toUpperCase()
              .slice(0, 2),
          )}
        </div>
        <p class="font-serif text-lg text-(--text)">${escapeHtml(user.fullName)}</p>
        <p class="text-sm text-gray-400">${escapeHtml(user.email)}</p>
      </div>

      ${
        user.role === "admin"
          ? `
        <button id="go-to-admin-btn" class="w-full px-4 py-3 bg-(--accent) text-black font-serif font-bold rounded hover:opacity-90 active:scale-95 transition-all">
          Panel de Admin
        </button>
      `
          : ""
      }

      <div class="space-y-4">
        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Nombre Completo</label>
          <input
            type="text"
            id="edit-fullname"
            value="${escapeHtml(user.fullName)}"
            placeholder="Tu nombre completo"
            maxlength="100"
            class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent)"
          />
        </div>

        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Email</label>
          <input
            type="email"
            id="edit-email"
            value="${escapeHtml(user.email)}"
            readonly
            class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-30 rounded text-sm opacity-70"
          />
        </div>

        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Perfume Favorito</label>
          <input
            type="text"
            id="edit-favorite-perfume"
            value="${escapeHtml(user.favoritePerfume)}"
            maxlength="100"
            placeholder="Tu perfume favorito de Maison de L'Eternel"
            class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent)"
          />
        </div>

        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">Recomendación Personal</label>
          <textarea
            id="edit-recommendation"
            placeholder="Recomienda un perfume a otros clientes..."
            maxlength="100"
            rows="3"
            class="w-full px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent) resize-none"
          >${escapeHtml(user.perfumeRec)}</textarea>
        </div>
      </div>

      ${
        user.discountCode
          ? `
        <div class="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-lg border-2 border-(--accent) border-opacity-50">
          <div class="text-center">
            <p class="text-sm text-(--text) mb-2">Tienes un cupón de descuento en tu próxima compra</p>
            <p class="font-mono font-bold text-(--accent) text-lg">${escapeHtml(user.discountCode)}</p>
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
                <span class="text-(--text)">${escapeHtml(product.name)}</span>
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
  const goToAdminBtn = document.getElementById("go-to-admin-btn");

  goToAdminBtn?.addEventListener("click", () => {
    window.location.href = "admin.html";
  });

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

  armForm(authForm);
  authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("auth-email")?.value?.trim() || "";
    const password = document.getElementById("auth-password")?.value || "";
    const submitBtn = document.getElementById("auth-submit-btn");

    await withSubmitLock(submitBtn, async () => {
      if (isRegisterMode) {
        const fullName =
          document.getElementById("auth-fullname")?.value?.trim() || "";
        await handleRegister(fullName, email, password, {
          ...antiSpamFields(authForm),
          acceptPrivacy: document.getElementById("auth-privacy")?.checked === true,
        });
      } else {
        await handleLogin(email, password);
      }
    });

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
  ensurePrivacyConsent();

  window.addEventListener("session-expired", () => {
    updateUserIcon();
    renderProfileModal();
  });
}
