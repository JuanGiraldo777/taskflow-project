import { renderProducts } from "./products.js";
import { initWishlist } from "./wishlist.js";
import { initNav } from "./nav.js";
import { initSlider } from "./slider.js";
import { initSearch } from "./search.js";
import { initCart } from "./cart.js";
import { initThemeToggle } from "./theme.js";

// 1. Renderiza los productos dinámicamente (PRIMERO - genera las cards con botones)
renderProducts();

// 2. Inicializa la navegación principal (menú lateral, iconos, etc.)
initNav();

// 3. Inicializa el slider/hero principal de la página
initSlider();

// 4. Inicializa la funcionalidad de búsqueda de perfumes
initSearch();

// 5. Inicializa el carrito de la compra y su lógica asociada
initCart();

// 6. Inicializa el cambio de tema (modo claro/oscuro)
initThemeToggle();

// 7. Inicializa la lista de deseos (ÚLTIMO - después de que las cards estén renderizadas)
initWishlist();
