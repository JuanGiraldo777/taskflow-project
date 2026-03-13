import { initNav } from "./nav.js";
import { initSlider } from "./slider.js";
import { initSearch } from "./search.js";
import { initCart } from "./cart.js";
import { initThemeToggle } from "./theme.js";

// Inicializa la navegación principal (menú lateral, iconos, etc.)
initNav();

// Inicializa el slider/hero principal de la página
initSlider();

// Inicializa la funcionalidad de búsqueda de perfumes
initSearch();

// Inicializa el carrito de la compra y su lógica asociada
initCart();

// Inicializa el cambio de tema (modo claro/oscuro)
initThemeToggle();

