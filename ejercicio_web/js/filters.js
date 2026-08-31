/**
 * @file ejercicio_web/js/filters.js
 * @description Módulo de filtros avanzados, ordenación de catálogo y los
 * botones de categoría de la sección Destacados.
 */
import { fetchProducts } from "./products.js";
import { brandsApi } from "./api/client.js";

async function populateBrandFilters() {
  const list = document.getElementById("brand-filter-list");
  if (!list) return;

  try {
    const brands = await brandsApi.getAll();
    list.innerHTML = brands
      .map(
        (brand) => `
      <label class="flex items-center gap-2 cursor-pointer text-sm max-sm:text-base max-sm:py-2 text-(--text)">
        <input
          type="checkbox"
          class="filter-brand-checkbox w-4 h-4 max-sm:w-5 max-sm:h-5 bg-(--bg) border border-(--text) rounded accent-(--accent) cursor-pointer"
          value="${brand.slug}"
        />
        ${brand.name.toUpperCase()}
      </label>
    `,
      )
      .join("");
  } catch (err) {
    console.error("Error al cargar marcas para filtros:", err);
  }
}

export function initAdvancedFilters() {
  const filterBtn = document.getElementById("filter-btn");
  const filterPanel = document.getElementById("filter-panel");
  const overlay = document.getElementById("overlay");

  const minPriceInput = document.getElementById("min-price");
  const maxPriceInput = document.getElementById("max-price");
  const sortSelect = document.getElementById("sort-select");
  const clearFiltersBtn = document.getElementById("clear-filters");
  const categoryButtons = document.querySelectorAll(".category-filter-btn");

  populateBrandFilters();

  // Abrir/Cerrar panel de filtros
  filterBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const sideMenu = document.getElementById("sideMenu");

    filterPanel.classList.toggle("hidden");

    // Mantener overlay visible si algo está abierto (filtros O menú lateral)
    const isFilterOpen = !filterPanel.classList.contains("hidden");
    const isMenuOpen = sideMenu?.classList.contains("active");

    if (isFilterOpen || isMenuOpen) {
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
    }
  });

  // Cerrar panel al hacer click en el overlay o fuera del panel
  overlay?.addEventListener("click", () => {
    const sideMenu = document.getElementById("sideMenu");

    filterPanel.classList.add("hidden");

    // Solo ocultar overlay si el menú lateral NO está abierto
    // Esto permite que nav.js maneje el overlay cuando el menú está activo
    if (!sideMenu || !sideMenu.classList.contains("active")) {
      overlay.classList.add("hidden");
    }
  });

  filterPanel?.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Aplicar filtros en tiempo real
  minPriceInput?.addEventListener("input", applyFilters);
  maxPriceInput?.addEventListener("input", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);

  // Las marcas se agregan dinámicamente (populateBrandFilters) — se delega
  // el evento desde el contenedor en vez de engancharlas una por una, para
  // que funcione con checkboxes que todavía no existen al momento de este init.
  document
    .getElementById("brand-filter-list")
    ?.addEventListener("change", (e) => {
      if (e.target.classList.contains("filter-brand-checkbox")) {
        applyFilters();
      }
    });

  // Limpiar filtros
  clearFiltersBtn?.addEventListener("click", () => {
    minPriceInput.value = "";
    maxPriceInput.value = "";
    document
      .querySelectorAll(".filter-brand-checkbox")
      .forEach((checkbox) => {
        checkbox.checked = false;
      });
    sortSelect.value = "";
    setActiveCategoryButton(categoryButtons[0]);

    fetchProducts({
      search: "",
      minPrice: "",
      maxPrice: "",
      brands: [],
      sortBy: "trending",
      gender: "",
      page: 1,
    });
  });

  function applyFilters() {
    const minPrice = minPriceInput?.value || "";
    const maxPrice = maxPriceInput?.value || "";

    const selectedBrands = Array.from(
      document.querySelectorAll(".filter-brand-checkbox"),
    )
      .filter((cb) => cb.checked)
      .map((cb) => cb.value.toLowerCase());

    const sortBy = sortSelect?.value || "";

    fetchProducts({
      minPrice,
      maxPrice,
      brands: selectedBrands,
      sortBy,
      page: 1,
    });
  }

  function setActiveCategoryButton(activeBtn) {
    categoryButtons.forEach((btn) => {
      btn.classList.remove("active", "font-bold");
    });
    activeBtn?.classList.add("active", "font-bold");
  }

  // "Perfumes en tendencia" / "Nuevos" / "Top ventas mujer" / "Top ventas
  // hombres": cada uno es una vista propia (resetea el resto de filtros,
  // como pestañas, no se combinan entre sí). No hay conteo de ventas real
  // todavía (no existe un módulo de pedidos) — "tendencia"/"top ventas" usan
  // como referencia las vistas de producto reales (viewed_products), que
  // van a ir mejorando solas a medida que el sitio reciba tráfico real.
  // "Nuevos" sí es un dato 100% real: fecha de creación del producto.
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveCategoryButton(btn);

      minPriceInput.value = "";
      maxPriceInput.value = "";
      sortSelect.value = "";
      document
        .querySelectorAll(".filter-brand-checkbox")
        .forEach((checkbox) => {
          checkbox.checked = false;
        });

      fetchProducts({
        search: "",
        minPrice: "",
        maxPrice: "",
        brands: [],
        sortBy: btn.dataset.sort || "",
        gender: btn.dataset.gender || "",
        page: 1,
      });
    });
  });
}
