/**
 * @file ejercicio_web/js/pages/catalogo.js
 * @description Página de catálogo/resultados — reusa exactamente el mismo
 * bootstrap que index.html (mismos módulos, mismo grid #products-grid)
 * para no duplicar la lógica de filtros/carrito/wishlist. Se llega acá de
 * varias formas, combinables entre sí: búsqueda por texto (?q=),
 * navegación por categoría/sexo/tipo desde el menú lateral (?category=/
 * ?gender=/?type=), el panel de filtros de precio/marca/orden, o sin
 * ningún parámetro ("Ver Todos" — se muestra el catálogo completo).
 */
import { fetchProducts } from "../products.js";
import { initUser } from "../user.js";
import { initWishlist } from "../wishlist.js";
import { initNav } from "../nav.js";
import { initSearch } from "../search.js";
import { initCart } from "../cart.js";
import { initThemeToggle } from "../theme.js";
import { initAdvancedFilters } from "../filters.js";
import { categoriesApi, gendersApi } from "../api/client.js";

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
const categorySlug = params.get("category") || "";
const genderSlug = params.get("gender") || "";
const rawType = params.get("type") || "";
// Solo se acepta un valor real — cualquier otra cosa en la URL se ignora
// en vez de mandarle basura al backend.
const productType =
  rawType === "original" || rawType === "preparado" ? rawType : "";
const brandSlugs = (params.get("brands") || "")
  .split(",")
  .map((slug) => slug.trim())
  .filter(Boolean);

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

// El título (H1) dice qué sección es (categoría/sexo/catálogo completo);
// el resumen de abajo solo aclara los refinamientos EXTRA (búsqueda,
// marca, precio, orden) para no repetir la misma info dos veces.
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

const heading = document.getElementById("catalog-heading");
const summary = document.getElementById("search-results-summary");

function renderSummary(brandNames = []) {
  const text = buildSummary(brandNames);
  if (!summary) return;
  summary.textContent = text;
  // Sin nada que aclarar, no dejar el <p> vacío ocupando su margen.
  summary.classList.toggle("hidden", !text);
}

// El nombre real de categoría/sexo para el título sale de la API (no
// hardcodeado) — mismo criterio que las marcas dinámicas del panel de
// filtros. Mientras carga, se usa el slug tal cual como fallback.
async function resolveHeading() {
  if (query) return "RESULTADOS DE BÚSQUEDA";

  if (categorySlug) {
    try {
      const categories = await categoriesApi.getAll();
      const match = categories.find((c) => c.slug === categorySlug);
      return (match?.name || categorySlug).toUpperCase();
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      return categorySlug.toUpperCase();
    }
  }

  if (genderSlug) {
    try {
      const genders = await gendersApi.getAll();
      const match = genders.find((g) => g.slug === genderSlug);
      return (match?.name || genderSlug).toUpperCase();
    } catch (err) {
      console.error("Error al cargar sexos:", err);
      return genderSlug.toUpperCase();
    }
  }

  // "type" no viene de una tabla propia (es un ENUM en products), así que
  // no hace falta pedirlo a la API — a diferencia de categoría/sexo/marca.
  if (productType === "original") return "ORIGINALES";
  if (productType === "preparado") return "PREPARADOS";

  return "CATÁLOGO COMPLETO";
}

resolveHeading().then((text) => {
  if (heading) heading.textContent = text;
});

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

// Esta página es "ver TODO lo que coincide", no un listado paginado — el
// default de 10 (pensado para Destacados/Originales/Preparados en el home,
// que son vidrieras chicas a propósito) dejaba categorías enteras
// cortadas a la mitad (ej. Diseñador tiene 21 productos reales, Ver Todos
// 169, y solo se veían los primeros 10 de cada una). 500 da margen de
// sobra para el catálogo actual y el crecimiento cercano sin paginar.
fetchProducts({
  search: query,
  minPrice,
  maxPrice,
  sortBy,
  brands: brandSlugs,
  category: categorySlug,
  gender: genderSlug,
  type: productType,
  page: 1,
  limit: 500,
});
