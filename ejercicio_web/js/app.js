/**
 * @file ejercicio_web/js/app.js
 * @description Bootstrap principal de la aplicación frontend.
 */
import { fetchProducts, fetchSection } from "./products.js";
import { initUser } from "./user.js";
import { initWishlist } from "./wishlist.js";
import { initNav } from "./nav.js";
import { initSlider } from "./slider.js";
import { initSearch } from "./search.js";
import { initCart } from "./cart.js";
import { initThemeToggle } from "./theme.js";
import { initAdvancedFilters } from "./filters.js";
import { renderReviews } from "./reviews.js";
import { initCarousels } from "./carousel.js";

initUser();
initAdvancedFilters();
initNav();
initSlider();
initSearch();
initCart();
initThemeToggle();
initWishlist();
initCarousels();
renderReviews();

// "trending" para que coincida con el botón "Perfumes en tendencia", que
// arranca marcado como activo en el HTML.
fetchProducts({ sortBy: "trending" });
fetchSection("originales-grid", { type: "original", sortBy: "name-asc", limit: 12 });
fetchSection("preparados-grid", { type: "preparado", sortBy: "name-asc", limit: 12 });

window.addEventListener("user-logged-in", () => {
  // cart y wishlist se sincronizan con sus propios listeners.
});
