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
import { fetchProducts, currentFilters } from "../products.js";
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

// Antes esta página traía todo de una (limit: 500) para no cortar
// categorías a la mitad. Con el catálogo real completo (169 productos) eso
// hacía una página de ~80.000px de alto en mobile — demasiado scroll.
// Ahora trae de a CATALOG_PAGE_SIZE y el botón "Cargar más" pide el resto
// de a tandas, sin perder los filtros activos (currentFilters ya los
// guarda). Encontrado y cambiado en QA visual 2026-09-04.
const CATALOG_PAGE_SIZE = 24;

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
  limit: CATALOG_PAGE_SIZE,
});

// ── "Cargar más" ────────────────────────────────────────────────────────
const loadMoreBtn = document.getElementById("load-more-btn");
if (loadMoreBtn) {
  const updateLoadMoreButton = (pagination) => {
    if (!pagination || pagination.page >= pagination.totalPages) {
      loadMoreBtn.classList.add("hidden");
      return;
    }
    loadMoreBtn.classList.remove("hidden");
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = "Cargar más";
  };

  window.addEventListener("products-rendered", (e) => {
    // El primer dispatch (desde renderProductsInto) no trae detail —
    // se ignora, el segundo (desde fetchProducts, con la paginación real)
    // es el que decide si el botón se muestra.
    if (!e.detail) return;
    updateLoadMoreButton(e.detail.pagination);
  });

  loadMoreBtn.addEventListener("click", async () => {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Cargando...";
    await fetchProducts(
      { page: (currentFilters.page || 1) + 1 },
      { append: true },
    );
  });
}

// Selector de sexo, solo para vistas por categoría (Árabe/Nicho/
// Diseñador): ahí dama/caballero/unisex vienen todos mezclados y no hay
// otra forma de acotar sin salir de la categoría — a diferencia de "Ver
// Todos"/"Originales"/"Preparados", donde el usuario no pidió esto.
// Filtra en vivo (fetchProducts, sin recargar la página) y sincroniza la
// URL con history.replaceState para que sea compartible/recargable sin
// perder el resto de filtros activos.
const categoryGenderTabs = document.getElementById("category-gender-tabs");
if (categorySlug && categoryGenderTabs) {
  categoryGenderTabs.classList.remove("hidden");

  const tabButtons = categoryGenderTabs.querySelectorAll(
    ".category-gender-tab",
  );

  function setActiveGenderTab(genderValue) {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.gender === genderValue;
      btn.classList.toggle("active", isActive);
      btn.classList.toggle("font-bold", isActive);
    });
  }
  // Refleja el ?gender= inicial si ya venía en la URL (ej. alguien
  // recargó la página o compartió el link con un sexo elegido).
  setActiveGenderTab(genderSlug);

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const newGender = btn.dataset.gender;
      setActiveGenderTab(newGender);
      fetchProducts({ gender: newGender, page: 1 });

      const url = new URL(window.location.href);
      if (newGender) url.searchParams.set("gender", newGender);
      else url.searchParams.delete("gender");
      window.history.replaceState({}, "", url);
    });
  });
}
