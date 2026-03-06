/* =====================
       BARRA DE NAVEGACIÓN
       ===================== */
const threebars = document.getElementById("threebars");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

threebars.addEventListener("click", () => {
  sideMenu.classList.add("active");
  overlay.classList.add("active");
});

overlay.addEventListener("click", () => {
  sideMenu.classList.remove("active");
  overlay.classList.remove("active");
});

/* =====================
        SLIDE IMAGES
      ===================== */
let index = 0;
const track = document.querySelector(".slider-track");
const slides = document.querySelectorAll(".slide");

setInterval(() => {
  index = (index + 1) % slides.length;
  track.style.transform = `translateX(-${index * 100}%)`;
}, 5000);

/* =====================
   FILTRO DE BÚSQUEDA DE PRODUCTOS
   ===================== */

document.addEventListener("DOMContentLoaded", () => {

  // ======================================
  // Obtener todos los productos del DOM
  // ======================================
  const productCards = document.querySelectorAll(".product-card");
  const products = Array.from(productCards).map((card) => {
    // extraemos el nombre desde el atributo data-name y lo pasamos a minúsculas
    return {
      name: card.dataset.name.toLowerCase(),
      element: card, // guardamos referencia al elemento DOM
    };
  });

  // ======================================
  // Seleccionar el input de búsqueda
  // ======================================
  const searchInput = document.getElementById("search"); 
  const searchContainer = document.querySelector(".search-container");

  // =============================
  // Crear contenedor para mostrar coincidencias
  // =============================
  // Se crea un div donde pondremos "x coincidencias encontradas"
  const matchesContainer = document.createElement("div");
  matchesContainer.classList.add("matches-count");

  // Estilo sencillo
  matchesContainer.style.margin = "5px 0 5px 0";
  matchesContainer.style.fontWeight = "bold";
  matchesContainer.style.color = "#E6D8A8";

  // Inserta el recuadro debajo del input
  searchContainer.appendChild(matchesContainer);

  // ======================================
  // Escuchar evento 'input' del buscador
  // ======================================
  searchInput.addEventListener("input", handleSearch);

  // ======================================
  // Función principal de búsqueda
  // ======================================
  function handleSearch() {
    // obtener el texto ingresado por el usuario
    const searchText = searchInput.value.toLowerCase().trim();
    // contador de coincidencias
    let matches = 0;

    // recorrer todos los productos
    products.forEach((product) => {
      // verificar si el nombre del producto incluye el texto buscado
      const match = product.name.includes(searchText);
      // mostrar u ocultar según la coincidencia
      product.element.style.display = match ? "block" : "none";
      // Contar coincidencias
      if(match) matches++;
    });

    // Actualizamos el recuadro de coincidencias
    if(searchText === "") {
       matchesContainer.textContent = ""; 
    } else {
      matchesContainer.textContent = `${matches} coincidencia${matches !== 1 ? "s" : ""} encontrad${matches !== 1 ? "as" : "a"} en destacados`;
    }
  }
});

/* =====================
       BOTONES DE COMPRA Y AÑADIR AL CARRITO
      ===================== */

// =====================
// Inicialización
// =====================

// Array donde se guarda el producto
let cart = JSON.parse(localStorage.getItem("cart")) || [];
if (!Array.isArray(cart)) {
  cart = [];
}
// Seleccion del contenedor del Carrito
const cartContainer = document.querySelector(".icon-cart-container");
// Seleccion del icono del carrito
const cartIcon = document.querySelector(".cart-icon");
// Seleccion del conteo en el carrito (span)
const cartCount = document.querySelector(".cart-count");
// Seleccion de los botones de añadir
const buyButtons = document.querySelectorAll(".add-to-cart");

// =====================
// Función para renderizar carrito
// =====================
function renderCart() {
  // Limpiar para que no duplique
  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    cartContainer.innerHTML = "<h3>Carrito vacío</h3>";
    return;
  }
  // Recorrer el array
  cart.forEach((product) => {
    // Crear elemento dinamico
    const item = document.createElement("div");
    item.innerHTML = `
  <h3>${product.name}</h3>
  <p>$${product.price}</p>
  <div> 
  <button class="decrease" data-id="${product.id}">-</button>
  <span>${product.quantity}</span>
  <button class="increase" data-id="${product.id}">+</button>
  </div>
  <button class="remove" data-id="${product.id}">Eliminar</button>
  <hr>  
  `;
    cartContainer.appendChild(item);
  });

  // Actualizar contador del carrito
  const totalItems = cart.reduce((sum, p) => sum + p.quantity, 0);
  cartCount.textContent = totalItems;

}

// =====================
// Añadir productos al carrito
// =====================

// Evento para recorrer cada boton
buyButtons.forEach((button) => {
  button.addEventListener("click", function () {
    // Capturacion de datos del boton(producto)
    const id = this.dataset.id;
    const name = this.dataset.name;
    const price = Number(this.dataset.price);

    // Verificar existencia del producto
    const existingProduct = cart.find((p) => p.id === id);
    if (existingProduct) {
      // Si existe se aumenta la cantidad
      existingProduct.quantity++;
    } else {
      // Si no pues agrega el producto al carrito
      cart.push({ id, name, price, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
  });
});

// =====================
// Manejo de botones dentro del carrito
// =====================
cartContainer.addEventListener("click", (e) => {
  const id = e.target.dataset.id;

  if (!id) return;

  if (e.target.classList.contains("increase")) {
    const product = cart.find((p) => p.id == id);
    if (product) product.quantity++;
  }

  if (e.target.classList.contains("decrease")) {
    const product = cart.find((p) => p.id == id);
    if (product && product.quantity > 1) {
      product.quantity--;
    }
  }

  if (e.target.classList.contains("remove"))
    cart = cart.filter((p) => p.id != id);

  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
});

// =====================
// Toggle carrito al hacer clic en el icono
// =====================
cartIcon.addEventListener("click", () => {
  cartContainer.classList.toggle("hidden");
});

console.log("Cart inicial:", cart);
// =====================
// Render inicial
// =====================
renderCart();

// DARK / LIGHT MODE
const toggleButton = document.getElementById("darkModeToggle");

toggleButton.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-mode") ? "light" : "dark"
  );
});

// Al cargar la página
if(localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
} else {
  document.body.classList.remove("light-mode");
}