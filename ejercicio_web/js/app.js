import { fetchProducts } from "./products.js";
import { initUser } from "./user.js";
import { initWishlist } from "./wishlist.js";
import { initNav } from "./nav.js";
import { initSlider } from "./slider.js";
import { initSearch } from "./search.js";
import { initCart } from "./cart.js";
import { initThemeToggle } from "./theme.js";
import { initAdvancedFilters } from "./filters.js";
import { renderReviews } from "./reviews.js";

initUser();
initAdvancedFilters();
initNav();
initSlider();
initSearch();
initCart();
initThemeToggle();
initWishlist();
renderReviews();

fetchProducts();

window.addEventListener("user-logged-in", () => {
  // cart y wishlist se sincronizan con sus propios listeners.
});
