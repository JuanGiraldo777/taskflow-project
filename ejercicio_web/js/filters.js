export function updateCardVisibility(card) {
  card.style.display =
    card.dataset.filteredOut || card.dataset.searchedOut ? "none" : "block";
}

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
    const minPrice = parseFloat(minPriceInput?.value) || 0;
    const maxPrice = parseFloat(maxPriceInput?.value) || Infinity;
    const selectedBrands = Array.from(filterBrandsCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value.toLowerCase());
    const sortValue = sortSelect?.value || "";

    const productCards = document.querySelectorAll(".product-card");
    let visibleCards = [];

    productCards.forEach((card) => {
      const price = parseFloat(card.dataset.price) || 0;
      const brand = card.dataset.brand || "";

      // Filtro por rango de precio
      const priceInRange = price >= minPrice && price <= maxPrice;

      // Filtro por marca (si no hay marcas seleccionadas, mostrar todas)
      const brandMatches =
        selectedBrands.length === 0 || selectedBrands.includes(brand);

      // Mostrar u ocultar card
      if (priceInRange && brandMatches) {
        delete card.dataset.filteredOut;
        updateCardVisibility(card);
        visibleCards.push(card);
      } else {
        card.dataset.filteredOut = "true";
        updateCardVisibility(card);
      }
    });

    // Aplicar ordenamiento
    if (sortValue && visibleCards.length > 0) {
      visibleCards.sort((a, b) => {
        const priceA = parseFloat(a.dataset.price);
        const priceB = parseFloat(b.dataset.price);
        const nameA = a.dataset.name?.toLowerCase() || "";
        const nameB = b.dataset.name?.toLowerCase() || "";

        if (sortValue === "price-asc") {
          return priceA - priceB;
        } else if (sortValue === "price-desc") {
          return priceB - priceA;
        } else if (sortValue === "name-asc") {
          return nameA.localeCompare(nameB);
        } else if (sortValue === "name-desc") {
          return nameB.localeCompare(nameA);
        }
        return 0;
      });

      // Reorganizar los elementos en el DOM según el ordenamiento
      const gridContainer = document.getElementById("products-grid");
      visibleCards.forEach((card) => {
        gridContainer.appendChild(card);
      });
    }
  }
}
