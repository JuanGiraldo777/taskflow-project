/**
 * @file ejercicio_web/js/search.js
 * @description Barra de búsqueda del header. El dropdown de tendencias es
 * solo sugerencias — buscar de verdad (Enter, click en la lupa, o elegir
 * una tendencia) navega a catalogo.html con el término, en vez de filtrar
 * la sección Destacados en el sitio. La búsqueda real corre ahí, contra
 * todo el catálogo, tenga o no resultados.
 */
const TRENDING_SEARCHES = [
  "Creed",
  "9Pm",
  "Ariana Grande",
  "Versace",
  "Dior",
  "Chanel",
  "Paco Rabanne",
];

export function initSearch() {
  const searchInputElement = /** @type {HTMLInputElement | null} */ (
    document.getElementById("search")
  );
  const searchDropdownElement = document.getElementById("search-dropdown");
  const searchContainerElement = document.querySelector(".search-container");
  const searchIconElement = searchContainerElement?.querySelector("svg");

  if (!searchInputElement || !searchContainerElement || !searchDropdownElement)
    return;

  function goToResults(term) {
    const trimmed = (term || "").trim();
    if (!trimmed) return;
    window.location.href = `catalogo.html?q=${encodeURIComponent(trimmed)}`;
  }

  function bindChipClicks() {
    searchDropdownElement
      .querySelectorAll(".search-trend-chip")
      .forEach((chip) => {
        chip.addEventListener("click", () => goToResults(chip.dataset.trend));
      });
  }

  // Las tendencias son siempre las mismas 7, fijas — no se filtran según
  // lo que se va escribiendo. Mientras haya texto, se agrega arriba el
  // aviso de que Enter busca ese texto tal cual.
  function renderTrending(searchText = "") {
    searchDropdownElement.innerHTML = `
      <div class="px-6 py-4">
        ${
          searchText
            ? `<p class="text-(--text) font-sans text-xs opacity-60 mb-3">Presiona Enter para buscar "${searchText}"</p>`
            : ""
        }
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
    bindChipClicks();
  }

  function handleInput() {
    renderTrending(searchInputElement.value.trim());
    searchDropdownElement.classList.remove("hidden");
  }

  function closeDropdown() {
    searchDropdownElement.classList.add("hidden");
  }

  // Event listeners
  searchInputElement.addEventListener("focus", handleInput);
  searchInputElement.addEventListener("input", handleInput);

  searchInputElement.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToResults(searchInputElement.value);
    }
  });

  searchIconElement?.addEventListener("click", () => {
    goToResults(searchInputElement.value);
  });

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
