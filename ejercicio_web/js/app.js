import { renderProducts } from "./products.js";
import { initUser } from "./user.js";
import { initWishlist } from "./wishlist.js";
import { initNav } from "./nav.js";
import { initSlider } from "./slider.js";
import { initSearch } from "./search.js";
import { initCart } from "./cart.js";
import { initThemeToggle } from "./theme.js";
import { initAdvancedFilters } from "./filters.js";
import { renderReviews } from "./reviews.js";

// 1. Renderiza los productos dinámicamente (PRIMERO - genera las cards con botones)
renderProducts();

// 2. Inicializa el sistema de perfil de usuario (avatar, preferencias, cupones)
initUser();

// 3. Inicializa los filtros avanzados (después de que las cards estén renderizadas)
initAdvancedFilters();

// 4. Inicializa la navegación principal (menú lateral, iconos, etc.)
initNav();

// 5. Inicializa el slider/hero principal de la página
initSlider();

// 6. Inicializa la funcionalidad de búsqueda de perfumes
initSearch();

// 7. Inicializa el carrito de la compra y su lógica asociada
initCart();

// 8. Inicializa el cambio de tema (modo claro/oscuro)
initThemeToggle();

// 9. Inicializa la lista de deseos (después de que las cards estén renderizadas)
initWishlist();

// 10. Renderiza las reseñas (ÚLTIMO - se inicializa al final)
renderReviews();
