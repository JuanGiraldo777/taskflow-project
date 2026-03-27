/**
 * @file ejercicio_web/js/search.js
 * @description Módulo de búsqueda con sugerencias y filtrado remoto.
 */
import { fetchProducts } from "./products.js";

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
  const searchInputElement = /** @type {HTMLInputElement | null} */ (
    document.getElementById("search")
  );
  const searchDropdownElement = document.getElementById("search-dropdown");
  const searchContainerElement = document.querySelector(".search-container");

  if (!searchInputElement || !searchContainerElement || !searchDropdownElement)
    return;

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
  function renderResultsPreview(searchText) {
    const matchingTrends = TRENDING_SEARCHES.filter((trend) =>
      trend.toLowerCase().includes(searchText.toLowerCase()),
    );

    searchDropdownElement.innerHTML = `
      <div class="px-6 py-4">
        <h3 class="font-serif text-(--text) text-sm font-bold mb-3 tracking-wide">RESULTADOS</h3>
        <p class="text-(--text) font-sans text-sm opacity-70 mb-4">Buscando: "${searchText}"</p>
        <div class="flex flex-wrap gap-2">
          ${
            matchingTrends.length > 0
              ? matchingTrends
                  .map(
                    (trend) => `
            <button
              class="search-trend-chip px-4 py-2 border border-(--accent) border-opacity-40 text-(--text) font-sans text-sm rounded-full bg-transparent transition-all duration-200 hover:bg-(--accent) hover:text-black hover:border-opacity-100 cursor-pointer"
              data-trend="${trend}"
            >
              ${trend}
            </button>
          `,
                  )
                  .join("")
              : `<span class="text-(--text) font-sans text-sm opacity-60">Mostrando resultados del catálogo</span>`
          }
        </div>
      </div>
    `;

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

  function handleSearch() {
    const searchText = searchInputElement.value.toLowerCase().trim();

    if (searchText === "") {
      renderTrending();
      fetchProducts({ search: "", page: 1 });
    } else {
      renderResultsPreview(searchText);
      fetchProducts({ search: searchText, page: 1 });
    }

    searchDropdownElement.classList.remove("hidden");
  }

  function closeDropdown() {
    searchDropdownElement.classList.add("hidden");
    searchInputElement.value = "";
    fetchProducts({ search: "", page: 1 });
  }

  function openDropdown() {
    if (searchInputElement.value.toLowerCase().trim() === "") {
      renderTrending();
    } else {
      renderResultsPreview(searchInputElement.value.toLowerCase().trim());
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

  renderTrending();
}
