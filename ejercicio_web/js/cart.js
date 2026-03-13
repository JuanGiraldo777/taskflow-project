// Lógica del carrito de compras

const CART_STORAGE_KEY = "cart";

/**
 * @typedef {Object} CartItem
 * @property {string} id - Identificador único del producto.
 * @property {string} name - Nombre del producto.
 * @property {number} price - Precio unitario del producto.
 * @property {number} quantity - Cantidad de unidades en el carrito.
 */

/** @type {CartItem[]} */
let cartItems = loadCartFromStorage();

/** @type {HTMLElement | null} */
let cartPanelElement;
/** @type {HTMLElement | null} */
let cartIconElement;
/** @type {HTMLElement | null} */
let cartCounterElement;

/**
 * Carga el carrito previamente guardado en localStorage.
 * Siempre devuelve un array válido aunque el almacenamiento esté corrupto.
 * @returns {CartItem[]}
 */
function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Guarda el estado actual del carrito en localStorage.
 */
function saveCartToStorage() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
}

/**
 * Devuelve un producto del carrito por su id.
 * @param {string} id
 * @returns {CartItem | undefined}
 */
function getCartItemById(id) {
  return cartItems.find((item) => item.id === id);
}

/**
 * Crea el nodo DOM que representa una línea de producto en el panel del carrito.
 * @param {CartItem} item
 * @returns {HTMLDivElement}
 */
function createCartItemElement(item) {
  const itemElement = document.createElement("div");
  itemElement.innerHTML = `
      <h3>${item.name}</h3>
      <p>$${item.price}</p>
      <div> 
        <button class="decrease" data-id="${item.id}">-</button>
        <span>${item.quantity}</span>
        <button class="increase" data-id="${item.id}">+</button>
      </div>
      <button class="remove" data-id="${item.id}">Eliminar</button>
      <hr>  
    `;
  return itemElement;
}

/**
 * Renderiza visualmente el contenido del carrito en el panel flotante.
 * Actualiza el contador de productos, genera los elementos del DOM
 * y agrega el botón para vaciar el carrito.
 */
function renderCartPanel() {
  if (!cartPanelElement || !cartCounterElement) return;

  cartPanelElement.innerHTML = "";

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  cartCounterElement.textContent = String(totalItems);

  if (cartItems.length === 0) {
    cartPanelElement.innerHTML = "<h3>Carrito vacío</h3>";
    return;
  }

  cartItems.forEach((cartItem) => {
    cartPanelElement.appendChild(createCartItemElement(cartItem));
  });

  const clearButton = document.createElement("button");
  clearButton.textContent = "Vaciar carrito";
  clearButton.onclick = clearCart;
  clearButton.className =
    "w-full py-2 bg-(--accent) text-black font-bold cursor-pointer";
  cartPanelElement.appendChild(clearButton);
}

/**
 * Vacía por completo el carrito y actualiza la vista.
 */
function clearCart() {
  cartItems = [];
  saveCartToStorage();
  renderCartPanel();
}

/**
 * Añade un producto al carrito o incrementa su cantidad si ya existe.
 * @param {string} id
 * @param {string} name
 * @param {number} price
 */
function addItemToCart(id, name, price) {
  const existingItem = getCartItemById(id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.push({ id, name, price, quantity: 1 });
  }

  saveCartToStorage();
  renderCartPanel();
}

/**
 * Gestiona los clics en los botones "Añadir al carrito" de las cards de producto.
 * @param {MouseEvent} event
 */
function handleAddToCartClick(event) {
  const button = /** @type {HTMLElement} */ (event.currentTarget);
  const id = button.dataset.id;
  const name = button.dataset.name;
  const price = Number(button.dataset.price);

  if (!id || !name || Number.isNaN(price)) return;

  addItemToCart(id, name, price);
}

/**
 * Gestiona los clics dentro del panel del carrito:
 * aumentar/disminuir cantidad o eliminar productos.
 * @param {MouseEvent} event
 */
function handleCartPanelClick(event) {
  const target = /** @type {HTMLElement} */ (event.target);
  const id = target.dataset.id;
  if (!id) return;

  if (target.classList.contains("increase")) {
    const item = getCartItemById(id);
    if (item) item.quantity += 1;
  } else if (target.classList.contains("decrease")) {
    const item = getCartItemById(id);
    if (item && item.quantity > 1) {
      item.quantity -= 1;
    }
  } else if (target.classList.contains("remove")) {
    cartItems = cartItems.filter((item) => item.id !== id);
  } else {
    return;
  }

  saveCartToStorage();
  renderCartPanel();
}

/**
 * Inicializa toda la lógica del carrito.
 * Asocia los botones "añadir al carrito", gestiona los eventos del panel
 * y sincroniza el estado con localStorage.
 */
export function initCart() {
  cartPanelElement = document.querySelector(".icon-cart-container");
  cartIconElement = document.querySelector(".cart-icon");
  cartCounterElement = document.querySelector(".cart-count");
  const addToCartButtons = document.querySelectorAll(".add-to-cart");

  if (!cartPanelElement || !cartIconElement || !cartCounterElement) return;

  addToCartButtons.forEach((button) => {
    button.addEventListener("click", handleAddToCartClick);
  });

  cartPanelElement.addEventListener("click", handleCartPanelClick);

  cartIconElement.addEventListener("click", () => {
    cartPanelElement.classList.toggle("hidden");
  });

  renderCartPanel();
}

