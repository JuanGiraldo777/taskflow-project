export function initAdvancedFilters() {
  const filterBtn = document.getElementById("filter-btn");
  const filterPanel = document.getElementById("filter-panel");
  const overlay = document.getElementById("overlay");

  // Elementos de los filtros
  const minPriceInput = document.getElementById("min-price");
  const maxPriceInput = document.getElementById("max-price");
  const filterBrandsCheckboxes = document.querySelectorAll(".filter-brand-checkbox");
  const sortSelect = document.getElementById("sort-select");
  const clearFiltersBtn = document.getElementById("clear-filters");

  // Abrir/Cerrar panel de filtros
  filterBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    filterPanel.classList.toggle("hidden");
    overlay.classList.toggle("hidden");
  });

  // Cerrar panel al hacer click en el overlay o fuera del panel
  overlay?.addEventListener("click", () => {
    filterPanel.classList.add("hidden");
    overlay.classList.add("hidden");
  });

  filterPanel?.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Aplicar filtros en tiempo real
  minPriceInput?.addEventListener("change", applyFilters);
  maxPriceInput?.addEventListener("change", applyFilters);
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
        card.style.display = "block";
        visibleCards.push(card);
      } else {
        card.style.display = "none";
      }
    });

    // Aplicar ordenamiento
    if (sortValue && visibleCards.length > 0) {
      visibleCards.sort((a, b) => {
        const priceA = parseFloat(a.dataset.price);
        const priceB = parseFloat(b.dataset.price);

        if (sortValue === "price-asc") {
          return priceA - priceB;
        } else if (sortValue === "price-desc") {
          return priceB - priceA;
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
