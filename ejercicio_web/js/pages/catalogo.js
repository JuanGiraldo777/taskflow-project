/**
 * @file ejercicio_web/js/pages/buscar.js
 * @description Página de resultados de búsqueda — reusa exactamente el
 * mismo bootstrap que index.html (mismos módulos, mismo grid #products-grid)
 * para no duplicar la lógica de filtros/carrito/wishlist. Se llega acá de
 * dos formas, que pueden combinarse: escribiendo en la barra de búsqueda
 * (?q=) o aplicando el panel de filtros con "Ver Resultados"
 * (?minPrice=&maxPrice=&brands=&sortBy=) — ambas terminan en la misma
 * página, mostrando solo lo que coincide con todo lo que venga en la URL.
 */
import { fetchProducts } from "../products.js";
import { initUser } from "../user.js";
import { initWishlist } from "../wishlist.js";
import { initNav } from "../nav.js";
import { initSearch } from "../search.js";
import { initCart } from "../cart.js";
import { initThemeToggle } from "../theme.js";
import { initAdvancedFilters } from "../filters.js";

const SORT_LABELS = {
  "price-asc": "Precio: menor a mayor",
  "price-desc": "Precio: mayor a menor",
  "name-asc": "Nombre: A → Z",
  "name-desc": "Nombre: Z → A",
};

const params = new URLSearchParams(window.location.search);
const query = params.get("q") || "";
const minPrice = params.get("minPrice") || "";
const maxPrice = params.get("maxPrice") || "";
const sortBy = params.get("sortBy") || "";
const brandSlugs = (params.get("brands") || "")
  .split(",")
  .map((slug) => slug.trim())
  .filter(Boolean);

const hasAnyCriteria =
  query || minPrice || maxPrice || sortBy || brandSlugs.length > 0;

initUser();
initAdvancedFilters();
initNav();
initSearch();
initCart();
initThemeToggle();
initWishlist();

// Prellenar el buscador y el panel de filtros para que reflejen lo que
// ya está aplicado vía URL — así "Limpiar Filtros" tiene de dónde partir
// y no parece que el panel esté vacío mientras los resultados no lo están.
const searchInput = document.getElementById("search");
if (searchInput) searchInput.value = query;

const minPriceInput = document.getElementById("min-price");
if (minPriceInput) minPriceInput.value = minPrice;

const maxPriceInput = document.getElementById("max-price");
if (maxPriceInput) maxPriceInput.value = maxPrice;

const sortSelect = document.getElementById("sort-select");
if (sortSelect) sortSelect.value = sortBy;

// Las marcas del panel se cargan async (populateBrandFilters en
// filters.js) — hay que esperar a que existan en el DOM antes de poder
// marcar los checkboxes que vinieron por ?brands=.
if (brandSlugs.length > 0) {
  document.addEventListener(
    "brand-filters-populated",
    () => {
      document.querySelectorAll(".filter-brand-checkbox").forEach((cb) => {
        if (brandSlugs.includes(cb.value)) cb.checked = true;
      });
    },
    { once: true },
  );
}

function buildSummary(brandNames) {
  const parts = [];
  if (query) parts.push(`"${query}"`);
  if (brandNames.length > 0) parts.push(`Marca: ${brandNames.join(", ")}`);
  if (minPrice || maxPrice) {
    const min = minPrice ? `$${Number(minPrice).toLocaleString()}` : "$0";
    const max = maxPrice
      ? `$${Number(maxPrice).toLocaleString()}`
      : "sin máximo";
    parts.push(`Precio: ${min} - ${max}`);
  }
  if (sortBy && SORT_LABELS[sortBy]) parts.push(SORT_LABELS[sortBy]);

  return parts.length > 0
    ? `Mostrando resultados para ${parts.join(" · ")}`
    : "";
}

const summary = document.getElementById("search-results-summary");

function renderSummary(brandNames = []) {
  if (!summary) return;
  summary.textContent = hasAnyCriteria
    ? buildSummary(brandNames)
    : "Usa el buscador o el panel de filtros para ver resultados.";
}

renderSummary();

// Si hay marcas en la URL, esperar sus nombres reales (vienen en el
// detail del evento) para no mostrar el slug crudo en el resumen.
if (brandSlugs.length > 0) {
  document.addEventListener(
    "brand-filters-populated",
    (e) => {
      const matchedNames = (e.detail || [])
        .filter((brand) => brandSlugs.includes(brand.slug))
        .map((brand) => brand.name);
      renderSummary(matchedNames);
    },
    { once: true },
  );
}

if (hasAnyCriteria) {
  fetchProducts({
    search: query,
    minPrice,
    maxPrice,
    sortBy,
    brands: brandSlugs,
    page: 1,
  });
} else {
  const grid = document.getElementById("products-grid");
  if (grid) {
    grid.innerHTML = `
      <div class="col-span-4 flex justify-center items-center py-20">
        <div class="text-(--text) font-serif text-lg opacity-60">Usa el buscador o el panel de filtros para ver resultados.</div>
      </div>
    `;
  }
}
