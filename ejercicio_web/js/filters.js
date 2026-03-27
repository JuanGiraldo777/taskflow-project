/**
 * @file ejercicio_web/js/filters.js
 * @description Módulo de filtros avanzados y ordenación de catálogo.
 */
import { fetchProducts } from "./products.js";

export function initAdvancedFilters() {
  const filterBtn = document.getElementById("filter-btn");
  const filterPanel = document.getElementById("filter-panel");
  const overlay = document.getElementById("overlay");

  // Elementos de los filtros
  const minPriceInput = document.getElementById("min-price");
  const maxPriceInput = document.getElementById("max-price");
  const filterBrandsCheckboxes = document.querySelectorAll(
    ".filter-brand-checkbox",
  );
  const sortSelect = document.getElementById("sort-select");
  const clearFiltersBtn = document.getElementById("clear-filters");

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
  filterBrandsCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", applyFilters);
  });
  sortSelect?.addEventListener("change", applyFilters);

  // Limpiar filtros
  clearFiltersBtn?.addEventListener("click", () => {
    minPriceInput.value = "";
    maxPriceInput.value = "";
    filterBrandsCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
    sortSelect.value = "";
    applyFilters();
  });

  function applyFilters() {
    const minPrice = minPriceInput?.value || "";
    const maxPrice = maxPriceInput?.value || "";

    const selectedBrands = Array.from(filterBrandsCheckboxes)
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
}
