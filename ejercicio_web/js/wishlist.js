// Array para almacenar los productos en la lista de deseos
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

/**
 * Guarda la wishlist actual en localStorage
 */
function saveToLocalStorage() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

/**
 * Añade un producto a la wishlist
 * @param {number} productId - ID del producto
 * @param {string} productName - Nombre del producto
 * @param {number} productPrice - Precio del producto
 */
function addToWishlist(productId, productName, productPrice) {
  // Evita duplicados
  const exists = wishlist.find((item) => item.id === productId);
  if (!exists) {
    wishlist.push({
      id: productId,
      name: productName,
      price: productPrice,
    });
    saveToLocalStorage();
    updateWishlistCount();
    renderWishlistPanel();
  }
}

/**
 * Elimina un producto de la wishlist por ID
 * @param {number} productId - ID del producto a eliminar
 */
function removeFromWishlist(productId) {
  wishlist = wishlist.filter((item) => item.id !== productId);
  saveToLocalStorage();
  updateWishlistCount();
  renderWishlistPanel();
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
      <div class="p-4 text-center text-(--text) text-sm">
        Tu lista de deseos está vacía
      </div>
    `;
    return;
  }

  // Crea la lista de productos
  const itemsHtml = wishlist
    .map(
      (item) => `
    <div class="flex items-center justify-between gap-2 p-2 border-b border-(--accent) border-opacity-20 last:border-b-0">
      <div class="flex-1 min-w-0">
        <p class="text-(--text) text-xs font-serif truncate">${item.name}</p>
        <p class="text-(--accent) text-xs">$${item.price.toLocaleString()}</p>
      </div>
      <button
        class="remove-wishlist-item flex-shrink-0 text-(--accent) hover:text-red-500 transition-colors duration-150 font-bold text-lg"
        data-product-id="${item.id}"
        aria-label="Eliminar de lista de deseos"
      >
        ×
      </button>
    </div>
  `,
    )
    .join("");

  // Botón para vaciar todo
  const clearButtonHtml = `
    <button
      id="clearWishlistBtn"
      class="w-full mt-3 px-3 py-2 bg-(--accent) text-black text-xs font-serif rounded hover:opacity-80 transition-opacity duration-150 cursor-pointer border-none"
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
    });
  });

  // Listener para el botón de vaciar todo
  const clearBtn = document.getElementById("clearWishlistBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearWishlist();
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
  // Inicializa el contador al cargar la página
  updateWishlistCount();
  renderWishlistPanel();

  // Obtiene el contenedor del grid de productos
  const productsGrid = document.getElementById("products-grid");

  // Event delegation: escucha clics en botones .add-to-favorites
  // dentro del grid (que se generan dinámicamente con renderProducts)
  if (productsGrid) {
    productsGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-to-favorites");
      if (btn) {
        e.preventDefault();
        const productId = parseInt(btn.getAttribute("data-id"));
        const productName = btn.getAttribute("data-name");
        const productPrice = parseInt(btn.getAttribute("data-price"));

        addToWishlist(productId, productName, productPrice);
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
