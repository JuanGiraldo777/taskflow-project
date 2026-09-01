/**
 * @file ejercicio_web/js/pages/buscar.js
 * @description Página de resultados de búsqueda — reusa exactamente el
 * mismo bootstrap que index.html (mismos módulos, mismo grid #products-grid)
 * para no duplicar la lógica de filtros/carrito/wishlist; lo único distinto
 * es que la búsqueda inicial sale del parámetro ?q= en vez de "trending".
 */
import { fetchProducts } from "../products.js";
import { initUser } from "../user.js";
import { initWishlist } from "../wishlist.js";
import { initNav } from "../nav.js";
import { initSearch } from "../search.js";
import { initCart } from "../cart.js";
import { initThemeToggle } from "../theme.js";
import { initAdvancedFilters } from "../filters.js";

const params = new URLSearchParams(window.location.search);
const query = params.get("q") || "";

initUser();
initAdvancedFilters();
initNav();
initSearch();
initCart();
initThemeToggle();
initWishlist();

const searchInput = document.getElementById("search");
if (searchInput) searchInput.value = query;

const summary = document.getElementById("search-results-summary");
if (summary) {
  summary.textContent = query
    ? `Mostrando resultados para: "${query}"`
    : "Escribe algo en el buscador para empezar.";
}

if (query) {
  fetchProducts({ search: query, page: 1 });
} else {
  const grid = document.getElementById("products-grid");
  if (grid) {
    grid.innerHTML = `
      <div class="col-span-4 flex justify-center items-center py-20">
        <div class="text-(--text) font-serif text-lg opacity-60">No hay ningún término de búsqueda.</div>
      </div>
    `;
  }
}
