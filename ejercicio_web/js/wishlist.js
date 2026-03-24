import { wishlistApi } from "./api/client.js";

let wishlistState = [];

function isInWishlist(productId) {
  return wishlistState.some((item) => item.product_id === productId);
}

async function syncWishlist() {
  const token = localStorage.getItem("token");
  if (!token) {
    wishlistState = [];
    updateWishlistCount();
    renderWishlistPanel();
    return;
  }

  try {
    wishlistState = await wishlistApi.getWishlist();
    updateWishlistCount();
    renderWishlistPanel();
    initializeFavoriteIcons();
  } catch (err) {
    console.error("Error al cargar wishlist:", err);
  }
}

async function addToWishlist(productId) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Inicia sesión para añadir a favoritos");
    return;
  }

  try {
    wishlistState = await wishlistApi.addItem(productId);
    updateWishlistCount();
    renderWishlistPanel();
    initializeFavoriteIcons();
  } catch (err) {
    console.error(err);
  }
}

async function removeFromWishlist(itemId) {
  try {
    wishlistState = await wishlistApi.removeItem(itemId);
    updateWishlistCount();
    renderWishlistPanel();
    initializeFavoriteIcons();
  } catch (err) {
    console.error(err);
  }
}

async function clearWishlist() {
  try {
    await wishlistApi.clearWishlist();
    wishlistState = [];
    updateWishlistCount();
    renderWishlistPanel();
    initializeFavoriteIcons();
  } catch (err) {
    console.error(err);
  }
}

function updateWishlistCount() {
  const countElement = document.querySelector(".wishlist-count");
  if (countElement) {
    countElement.textContent = String(wishlistState.length);
  }
}

function updateFavoriteIcon(productId) {
  const button = document.querySelector(
    `.add-to-favorites[data-id="${productId}"]`,
  );
  if (!button) return;

  const svg = button.querySelector("svg");
  if (!svg) return;

  const inWishlist = isInWishlist(productId);

  if (inWishlist) {
    svg.style.fill = "var(--accent)";
    svg.style.stroke = "var(--accent)";
    svg.style.color = "var(--accent)";
    button.classList.add("favorite-active");
  } else {
    svg.style.fill = "none";
    svg.style.stroke = "";
    svg.style.color = "";
    button.classList.remove("favorite-active");
  }
}

function initializeFavoriteIcons() {
  const favoriteButtons = document.querySelectorAll(".add-to-favorites");
  favoriteButtons.forEach((button) => {
    const productId = Number(button.getAttribute("data-id"));
    if (!Number.isNaN(productId)) {
      updateFavoriteIcon(productId);
    }
  });
}

function renderWishlistPanel() {
  const container = document.querySelector(".icon-wishlist-container");
  if (!container) return;

  container.innerHTML = "";

  if (wishlistState.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center">
        <div class="mb-3">
          <svg class="w-12 h-12 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
          </svg>
        </div>
        <p class="text-(--text) text-sm font-sans">Tu lista de favoritos está vacía</p>
        <p class="text-gray-500 text-xs mt-1">Añade productos para empezar</p>
      </div>
    `;
    return;
  }

  const itemsHtml = wishlistState
    .map(
      (item) => `
    <div class="wishlist-item border-b border-gray-700 py-3 px-4 hover:bg-gray-800/40 transition-colors">
      <div class="flex justify-between items-start gap-2 mb-2">
        <div class="flex-1 min-w-0">
          <p class="text-(--text) text-sm font-serif truncate">${item.name}</p>
          <p class="text-(--accent) text-sm font-semibold">$${Number(item.price || 0).toLocaleString()}</p>
        </div>
        <button
          class="remove-wishlist-item text-gray-400 hover:text-(--accent) hover:scale-125 transition-all duration-150"
          data-item-id="${item.id}"
          aria-label="Eliminar de lista de deseos"
          title="Eliminar"
        >
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  `,
    )
    .join("");

  const clearButtonHtml = `
    <button
      id="clearWishlistBtn"
      class="w-full mt-2 px-3 py-2 bg-(--accent) text-black text-xs font-bold rounded hover:opacity-90 transition-opacity duration-150 cursor-pointer border-none active:scale-95"
    >
      Vaciar Lista
    </button>
  `;

  container.innerHTML = itemsHtml + clearButtonHtml;

  container.querySelectorAll(".remove-wishlist-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemId = Number(btn.getAttribute("data-item-id"));
      if (Number.isNaN(itemId)) return;
      removeFromWishlist(itemId);
    });
  });

  const clearBtn = document.getElementById("clearWishlistBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearWishlist();
    });
  }
}

function toggleWishlistPanel() {
  const container = document.querySelector(".icon-wishlist-container");
  if (container) {
    container.classList.toggle("hidden");
  }
}

export function initWishlist() {
  updateWishlistCount();
  renderWishlistPanel();
  initializeFavoriteIcons();

  const productsGrid = document.getElementById("products-grid");
  if (productsGrid) {
    productsGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-to-favorites");
      if (btn) {
        e.preventDefault();
        e.stopPropagation();

        const productId = Number(btn.getAttribute("data-id"));
        if (Number.isNaN(productId)) return;

        const existingItem = wishlistState.find(
          (item) => item.product_id === productId,
        );

        if (existingItem) {
          removeFromWishlist(existingItem.id);
        } else {
          addToWishlist(productId);
        }
      }
    });
  }

  const wishlistIcon = document.querySelector(".wishlist-icon");
  if (wishlistIcon) {
    wishlistIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWishlistPanel();
    });
  }

  document.addEventListener("click", (e) => {
    const wishlistContainer = document.querySelector(
      ".icon-wishlist-container",
    );
    const wishlistIconElement = document.querySelector(".wishlist-icon");

    if (wishlistContainer && wishlistIconElement) {
      if (
        !wishlistContainer.contains(e.target) &&
        !wishlistIconElement.contains(e.target)
      ) {
        wishlistContainer.classList.add("hidden");
      }
    }
  });

  window.addEventListener("products-rendered", initializeFavoriteIcons);
  syncWishlist();
  window.addEventListener("user-logged-in", () => syncWishlist());
  window.addEventListener("session-expired", () => syncWishlist());
}
