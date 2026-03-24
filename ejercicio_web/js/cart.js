import { cartApi } from "./api/client.js";

let cartState = { items: [], total: 0 };

let cartDrawer;
let cartItemsContainer;
let cartTotalElement;
let cartCounterElement;

/**
 * Crea el nodo DOM que representa un producto en el drawer del carrito.
 * @param {CartItem} item
 * @returns {HTMLDivElement}
 */
function createCartItemElement(item) {
  const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
  const itemElement = document.createElement("div");
  itemElement.className =
    "cart-item border-b border-gray-700 py-4 px-4 hover:bg-gray-800/50 transition-colors";
  itemElement.innerHTML = `
    <div class="flex justify-between items-start mb-3">
      <h3 class="font-serif text-[15px] text-(--text) flex-1">${item.name}</h3>
      <button class="remove-item text-gray-400 hover:text-(--accent) transition-colors" data-id="${item.id}" aria-label="Eliminar producto" title="Eliminar">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m-2 0H9M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14M10 11v6M14 11v6"/>
        </svg>
      </button>
    </div>
    <div class="flex justify-between items-center mb-3">
      <span class="text-(--text) text-[13px]">$${Number(item.price || 0).toFixed(2)}</span>
      <span class="text-gray-400 text-[12px]">x${item.quantity}</span>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
        <button class="decrease-qty w-7 h-7 flex items-center justify-center text-(--accent) hover:bg-gray-700 rounded transition-colors" data-id="${item.id}">−</button>
        <span class="quantity w-6 text-center text-(--text) text-sm">${item.quantity}</span>
        <button class="increase-qty w-7 h-7 flex items-center justify-center text-(--accent) hover:bg-gray-700 rounded transition-colors" data-id="${item.id}">+</button>
      </div>
      <div class="text-right">
        <span class="text-gray-400 text-[11px] block">Subtotal</span>
        <span class="font-serif text-(--accent) text-[14px] font-semibold">$${subtotal.toFixed(2)}</span>
      </div>
    </div>
  `;
  return itemElement;
}

/**
 * Renderiza dinámicamente el contenido del drawer del carrito.
 * Actualiza el contador, los items y el total.
 */
function renderCartDrawer() {
  if (!cartItemsContainer || !cartTotalElement || !cartCounterElement) return;

  cartItemsContainer.innerHTML = "";

  const totalItems = cartState.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  cartCounterElement.textContent = String(totalItems);

  if (cartState.items.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-center px-4">
        <svg class="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
        <p class="text-(--text) font-sans">Tu carrito está vacío</p>
        <p class="text-gray-500 text-sm mt-1">Añade productos para empezar</p>
      </div>
    `;
    cartTotalElement.innerHTML = `
      <div class="text-center py-4 border-t border-gray-700">
        <p class="text-(--text) text-sm">Total: <span class="text-(--accent) font-semibold">$0.00</span></p>
      </div>
    `;
    return;
  }

  cartState.items.forEach((item) => {
    cartItemsContainer.appendChild(createCartItemElement(item));
  });

  const total = Number(cartState.total || 0);
  cartTotalElement.innerHTML = `
    <div class="border-t border-gray-700 p-4 space-y-4">
      <div class="flex justify-between items-center">
        <span class="text-(--text) font-sans">Total:</span>
        <span class="font-serif text-(--accent) text-xl font-semibold">$${total.toFixed(2)}</span>
      </div>
      <button class="checkout-btn w-full py-3 bg-(--accent) text-black font-bold rounded-lg hover:shadow-lg hover:shadow-(--accent)/50 transition-all duration-200 active:scale-95 font-sans tracking-wide">
        Finalizar Compra
      </button>
      <button class="clear-cart-btn w-full py-2 border border-gray-600 text-(--text) font-sans hover:border-(--accent) hover:text-(--accent) transition-colors rounded-lg text-sm">
        Vaciar Carrito
      </button>
    </div>
  `;
}

/**
 * Abre el drawer del carrito.
 */
function openCartDrawer() {
  if (cartDrawer) {
    cartDrawer.classList.remove("translate-x-full");
    cartDrawer.classList.add("translate-x-0");
  }
}

/**
 * Cierra el drawer del carrito.
 */
function closeCartDrawer() {
  if (cartDrawer) {
    cartDrawer.classList.remove("translate-x-0");
    cartDrawer.classList.add("translate-x-full");
  }
}

/**
 * Añade un producto al carrito o incrementa su cantidad.
 * @param {string} id
 * @param {string} name
 * @param {number} price
 */
async function syncCart() {
  const token = localStorage.getItem("token");
  if (!token) {
    cartState = { items: [], total: 0 };
    renderCartDrawer();
    return;
  }

  try {
    cartState = await cartApi.getCart();
    renderCartDrawer();
  } catch (err) {
    console.error("Error al cargar el carrito:", err);
  }
}

async function addItemToCart(productId) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Inicia sesión para añadir productos al carrito");
    return;
  }

  try {
    cartState = await cartApi.addItem(productId, 1);
    renderCartDrawer();
    openCartDrawer();
  } catch (err) {
    alert(err.message);
  }
}

async function updateQuantity(itemId, quantity) {
  if (quantity < 1) return;

  try {
    cartState = await cartApi.updateQuantity(itemId, quantity);
    renderCartDrawer();
  } catch (err) {
    alert(err.message);
  }
}

async function removeItem(itemId) {
  try {
    cartState = await cartApi.removeItem(itemId);
    renderCartDrawer();
  } catch (err) {
    console.error(err);
  }
}

/**
 * Gestiona clicks en botones "Añadir al carrito" de las product cards.
 * @param {HTMLElement} button
 */
function handleAddToCartClick(button) {
  const id = Number(button.dataset.id);

  if (!id || Number.isNaN(id)) return;

  addItemToCart(id);
}

/**
 * Gestiona clicks dentro del drawer: aumentar/disminuir cantidad, eliminar.
 * @param {MouseEvent} event
 */
async function handleCartDrawerClick(event) {
  const target = /** @type {HTMLElement} */ (event.target);
  const button = target.closest("button");

  if (!button) return;

  const id = Number(button.dataset.id);
  if (!id || Number.isNaN(id)) return;

  if (button.classList.contains("increase-qty")) {
    const item = cartState.items.find((cartItem) => cartItem.id === id);
    if (item) {
      await updateQuantity(item.id, Number(item.quantity) + 1);
    }
  } else if (button.classList.contains("decrease-qty")) {
    const item = cartState.items.find((cartItem) => cartItem.id === id);
    if (item && Number(item.quantity) > 1) {
      await updateQuantity(item.id, Number(item.quantity) - 1);
    }
  } else if (button.classList.contains("remove-item")) {
    await removeItem(id);
  } else {
    return;
  }
}

/**
 * Vacía completamente el carrito.
 */
async function clearCart() {
  try {
    await cartApi.clearCart();
    cartState = { items: [], total: 0 };
    renderCartDrawer();
  } catch (err) {
    console.error(err);
  }
}

/**
 * Inicializa toda la lógica del carrito.
 */
export function initCart() {
  cartDrawer = document.getElementById("cart-drawer");
  cartItemsContainer = document.getElementById("cart-items");
  cartTotalElement = document.getElementById("cart-footer");
  cartCounterElement = document.querySelector(".cart-count");
  const cartIcon = document.querySelector(".cart-icon");
  const closeCartBtn = document.getElementById("close-cart-btn");
  const cartOverlay = document.getElementById("cart-overlay");
  const productsGrid = document.getElementById("products-grid");

  if (
    !cartDrawer ||
    !cartItemsContainer ||
    !cartTotalElement ||
    !cartCounterElement
  )
    return;

  if (productsGrid) {
    productsGrid.addEventListener("click", (e) => {
      const button = e.target.closest(".add-to-cart");
      if (button) {
        handleAddToCartClick(button);
      }
    });
  }

  // Click en icono carrito: abre el drawer
  cartIcon?.addEventListener("click", openCartDrawer);

  // Click en botón cerrar
  closeCartBtn?.addEventListener("click", closeCartDrawer);

  // Click en overlay detrás del drawer
  cartOverlay?.addEventListener("click", closeCartDrawer);

  // Click dentro del drawer: delegado a handleCartDrawerClick
  cartItemsContainer.addEventListener("click", handleCartDrawerClick);

  // Click en buttons de footer
  cartTotalElement.addEventListener("click", (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.classList.contains("clear-cart-btn")) {
      clearCart();
    } else if (target.classList.contains("checkout-btn")) {
      // Aquí iría la lógica de checkout
      alert("Procesando pago... (funcionalidad a implementar)");
    }
  });

  renderCartDrawer();
  syncCart();

  window.addEventListener("user-logged-in", () => syncCart());
  window.addEventListener("session-expired", () => syncCart());
}
