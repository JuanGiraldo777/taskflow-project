/**
 * @typedef {Object} SearchableProduct
 * @property {string} name - Nombre del producto en minúsculas.
 * @property {number} price - Precio del producto.
 * @property {HTMLElement} element - Nodo de la card de producto.
 */

import { updateCardVisibility } from "./filters.js";

const TRENDING_SEARCHES = [
  "Woody",
  "Floral",
  "Árabe",
  "Caballero",
  "Mujer",
  "Nicho",
  "Oud",
];

/**
 * Inicializa el filtro de búsqueda de productos destacados con dropdown.
 * Crea una lista interna de productos y muestra/oculta las cards según el texto buscado.
 * El dropdown muestra tendencias cuando está vacío y resultados al escribir.
 */
export function initSearch() {
  const productCardElements = document.querySelectorAll(".product-card");
  const searchInputElement = /** @type {HTMLInputElement | null} */ (
    document.getElementById("search")
  );
  const searchDropdownElement = document.getElementById("search-dropdown");
  const searchContainerElement = document.querySelector(".search-container");

  if (
    !productCardElements.length ||
    !searchInputElement ||
    !searchContainerElement ||
    !searchDropdownElement
  )
    return;

  /** @type {SearchableProduct[]} */
  const searchableProducts = Array.from(productCardElements).map((card) => {
    const priceSpans = card.querySelectorAll("div.flex span");
    const priceText = priceSpans[priceSpans.length - 1]?.textContent || "$0";
    const price = parseInt(priceText.replace(/[^0-9]/g, "")) || 0;
    return {
      name: (card.dataset.name || "").toLowerCase(),
      price: price,
      element: card,
    };
  });

  /**
   * Renderiza las tendencias en el dropdown
   */
  function renderTrending() {
    searchDropdownElement.innerHTML = `
      <div class="px-6 py-4">
        <h3 class="font-serif text-(--text) text-sm font-bold mb-4 tracking-wide">TENDENCIAS</h3>
        <div class="flex flex-wrap gap-2">
          ${TRENDING_SEARCHES.map(
            (trend) => `
            <button
              class="search-trend-chip px-4 py-2 border border-(--accent) border-opacity-40 text-(--text) font-sans text-sm rounded-full bg-transparent transition-all duration-200 hover:bg-(--accent) hover:text-black hover:border-opacity-100 cursor-pointer"
              data-trend="${trend}"
            >
              ${trend}
            </button>
          `,
          ).join("")}
        </div>
      </div>
    `;

    // Añadir listeners a los chips de tendencias
    searchDropdownElement
      .querySelectorAll(".search-trend-chip")
      .forEach((chip) => {
        chip.addEventListener("click", () => {
          const trend = chip.dataset.trend;
          searchInputElement.value = trend;
          handleSearch();
        });
      });
  }

  /**
   * Renderiza los resultados en el dropdown
   */
  function renderResults(results) {
    if (results.length === 0) {
      searchDropdownElement.innerHTML = `
        <div class="px-6 py-8 text-center">
          <p class="text-(--text) font-sans text-sm opacity-70">Sin resultados</p>
        </div>
      `;
      return;
    }

    searchDropdownElement.innerHTML = `
      <div class="max-h-[400px] overflow-y-auto">
        ${results
          .map(
            (product) => `
          <div class="px-6 py-3 border-b border-(--text) border-opacity-10 hover:bg-(--card-bg) transition-colors duration-150 cursor-pointer search-result-item">
            <div class="font-sans text-sm text-(--text) font-medium">${product.name}</div>
            <div class="text-(--accent) text-xs mt-1">$${product.price.toLocaleString()}</div>
          </div>
          `,
          )
          .join("")}
      </div>
    `;

    // Añadir listeners a los resultados
    searchDropdownElement
      .querySelectorAll(".search-result-item")
      .forEach((item, index) => {
        item.addEventListener("click", () => {
          searchInputElement.value = results[index].name;
          handleSearch();
        });
      });
  }

  /**
   * Maneja el evento de búsqueda.
   * Filtra los productos por nombre y actualiza el dropdown con resultados o tendencias.
   */
  function handleSearch() {
    const searchText = searchInputElement.value.toLowerCase().trim();

    if (searchText === "") {
      // Mostrar tendencias si está vacío
      renderTrending();
    } else {
      // Filtrar productos y mostrar resultados
      const results = searchableProducts
        .filter((product) => product.name.includes(searchText))
        .map((product) => ({
          name: product.element.dataset.name,
          price: product.price,
        }));

      renderResults(results);
    }

    // Filtrar visibilidad de cards en el grid
    let matches = 0;
    searchableProducts.forEach((product) => {
      const match = product.name.includes(searchText);
      if (match) {
        delete product.element.dataset.searchedOut;
      } else {
        product.element.dataset.searchedOut = "true";
      }
      updateCardVisibility(product.element);
      if (match) matches++;
    });

    // Mostrar el dropdown
    searchDropdownElement.classList.remove("hidden");
  }

  /**
   * Cierra el dropdown
   */
  function closeDropdown() {
    searchDropdownElement.classList.add("hidden");
    searchInputElement.value = "";

    // Mostrar todos los productos nuevamente
    searchableProducts.forEach((product) => {
      delete product.element.dataset.searchedOut;
      updateCardVisibility(product.element);
    });
  }

  /**
   * Abre el dropdown y muestra tendencias o resultados según el estado del input
   */
  function openDropdown() {
    if (searchInputElement.value.toLowerCase().trim() === "") {
      renderTrending();
    } else {
      handleSearch();
    }
    searchDropdownElement.classList.remove("hidden");
  }

  // Event listeners
  searchInputElement.addEventListener("focus", openDropdown);
  searchInputElement.addEventListener("input", handleSearch);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdown();
      searchInputElement.blur();
    }
  });

  document.addEventListener("click", (e) => {
    if (
      !searchContainerElement.contains(e.target) &&
      !searchDropdownElement.contains(e.target)
    ) {
      closeDropdown();
    }
  });

  // Renderizar tendencias inicialmente
  renderTrending();
}
