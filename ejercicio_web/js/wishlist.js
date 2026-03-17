// Lista de deseos (wishlist) - Mejora visual y funcionalidad

let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

/**
 * Guarda la wishlist actual en localStorage
 */
function saveToLocalStorage() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

/**
 * Comprueba si un producto está en la wishlist
 * @param {number} productId
 * @returns {boolean}
 */
function isInWishlist(productId) {
  return wishlist.some((item) => item.id === productId);
}

/**
 * Añade un producto a la wishlist
 * @param {number} productId
 * @param {string} productName
 * @param {number} productPrice
 */
function addToWishlist(productId, productName, productPrice) {
  if (!isInWishlist(productId)) {
    wishlist.push({
      id: productId,
      name: productName,
      price: productPrice,
    });
    saveToLocalStorage();
  }
}

/**
 * Elimina un producto de la wishlist por ID
 * @param {number} productId
 */
function removeFromWishlist(productId) {
  wishlist = wishlist.filter((item) => item.id !== productId);
  saveToLocalStorage();
}

/**
 * Alterna (toggle) un producto en la wishlist
 * @param {number} productId
 * @param {string} productName
 * @param {number} productPrice
 */
function toggleWishlistItem(productId, productName, productPrice) {
  if (isInWishlist(productId)) {
    removeFromWishlist(productId);
  } else {
    addToWishlist(productId, productName, productPrice);
  }
}

/**
 * Vacía completamente la wishlist
 */
function clearWishlist() {
  wishlist = [];
  saveToLocalStorage();
  updateWishlistCount();
  renderWishlistPanel();
}

/**
 * Actualiza el contador de la wishlist en el header
 */
function updateWishlistCount() {
  const countElement = document.querySelector(".wishlist-count");
  if (countElement) {
    countElement.textContent = wishlist.length;
  }
}

/**
 * Actualiza el visual del icono de favoritos en una card.
 * Si el producto está en wishlist, colorea el SVG con (--accent).
 * Si no, lo deja con el color original.
 * @param {number} productId
 */
function updateFavoriteIcon(productId) {
  const button = document.querySelector(
    `.add-to-favorites[data-id="${productId}"]`,
  );
  if (!button) return;

  const svg = button.querySelector("svg");
  if (!svg) return;

  const inWishlist = isInWishlist(productId);

  if (inWishlist) {
    // Colorear con accent usando CSS variables
    svg.style.fill = "var(--accent)";
    svg.style.stroke = "var(--accent)";
    svg.style.color = "var(--accent)";
    button.classList.add("favorite-active");
  } else {
    // Descolorear al original
    svg.style.fill = "none";
    svg.style.stroke = "";
    svg.style.color = "";
    button.classList.remove("favorite-active");
  }
}

/**
 * Inicializa todos los iconos de favoritos basado en el estado actual de wishlist
 */
function initializeFavoriteIcons() {
  const favoriteButtons = document.querySelectorAll(".add-to-favorites");
  favoriteButtons.forEach((button) => {
    const productId = parseInt(button.getAttribute("data-id"));
    updateFavoriteIcon(productId);
  });
}

/**
 * Renderiza el panel flotante con los productos de la wishlist
 */
function renderWishlistPanel() {
  const container = document.querySelector(".icon-wishlist-container");
  if (!container) return;

  // Limpia el contenedor
  container.innerHTML = "";

  // Si la wishlist está vacía
  if (wishlist.length === 0) {
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

  // Crea la lista de productos con mejor visual
  const itemsHtml = wishlist
    .map(
      (item) => `
    <div class="wishlist-item border-b border-gray-700 py-3 px-4 hover:bg-gray-800/40 transition-colors">
      <div class="flex justify-between items-start gap-2 mb-2">
        <div class="flex-1 min-w-0">
          <p class="text-(--text) text-sm font-serif truncate">${item.name}</p>
          <p class="text-(--accent) text-sm font-semibold">$${item.price.toLocaleString()}</p>
        </div>
        <button
          class="remove-wishlist-item text-gray-400 hover:text-(--accent) hover:scale-125 transition-all duration-150"
          data-product-id="${item.id}"
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

  // Botón para vaciar todo
  const clearButtonHtml = `
    <button
      id="clearWishlistBtn"
      class="w-full mt-2 px-3 py-2 bg-(--accent) text-black text-xs font-bold rounded hover:opacity-90 transition-opacity duration-150 cursor-pointer border-none active:scale-95"
    >
      Vaciar Lista
    </button>
  `;

  container.innerHTML = itemsHtml + clearButtonHtml;

  // Añade event listeners a los botones de eliminar individuales
  container.querySelectorAll(".remove-wishlist-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const productId = parseInt(btn.getAttribute("data-product-id"));
      removeFromWishlist(productId);
      updateFavoriteIcon(productId);
      updateWishlistCount();
      renderWishlistPanel();
    });
  });

  // Listener para el botón de vaciar todo
  const clearBtn = document.getElementById("clearWishlistBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearWishlist();
      initializeFavoriteIcons();
    });
  }
}

/**
 * Alterna la visibilidad del panel flotante de wishlist
 */
function toggleWishlistPanel() {
  const container = document.querySelector(".icon-wishlist-container");
  if (container) {
    container.classList.toggle("hidden");
  }
}

/**
 * Inicializa la funcionalidad de wishlist
 */
export function initWishlist() {
  // Inicializa el contador y el panel al cargar la página
  updateWishlistCount();
  renderWishlistPanel();
  initializeFavoriteIcons();

  // Obtiene el contenedor del grid de productos
  const productsGrid = document.getElementById("products-grid");

  // Event delegation: escucha clics en botones .add-to-favorites
  if (productsGrid) {
    productsGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-to-favorites");
      if (btn) {
        e.preventDefault();
        e.stopPropagation();

        const productId = parseInt(btn.getAttribute("data-id"));
        const productName = btn.getAttribute("data-name");
        const productPrice = parseInt(btn.getAttribute("data-price"));

        // Toggle: añade o elimina según esté en wishlist
        toggleWishlistItem(productId, productName, productPrice);

        // Actualiza el visual del icono
        updateFavoriteIcon(productId);

        // Actualiza el contador y el panel
        updateWishlistCount();
        renderWishlistPanel();
      }
    });
  }

  // Listener para abrir/cerrar el panel de wishlist
  const wishlistIcon = document.querySelector(".wishlist-icon");
  if (wishlistIcon) {
    wishlistIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWishlistPanel();
    });
  }

  // Cierra el panel si se hace clic fuera de él
  document.addEventListener("click", (e) => {
    const wishlistContainer = document.querySelector(
      ".icon-wishlist-container",
    );
    const wishlistIcon = document.querySelector(".wishlist-icon");

    if (wishlistContainer && wishlistIcon) {
      if (
        !wishlistContainer.contains(e.target) &&
        !wishlistIcon.contains(e.target)
      ) {
        wishlistContainer.classList.add("hidden");
      }
    }
  });
}
