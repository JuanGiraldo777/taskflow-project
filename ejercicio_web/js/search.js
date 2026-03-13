/**
 * @typedef {Object} SearchableProduct
 * @property {string} name - Nombre del producto en minúsculas.
 * @property {HTMLElement} element - Nodo de la card de producto.
 */

/**
 * Inicializa el filtro de búsqueda de productos destacados.
 * Crea una lista interna de productos y muestra/oculta las cards según el texto buscado.
 */
export function initSearch() {
  const productCardElements = document.querySelectorAll(".product-card");
  const searchInputElement = /** @type {HTMLInputElement | null} */ (
    document.getElementById("search")
  );
  const searchContainerElement = document.querySelector(".search-container");

  if (
    !productCardElements.length ||
    !searchInputElement ||
    !searchContainerElement
  )
    return;

  /** @type {SearchableProduct[]} */
  const searchableProducts = Array.from(productCardElements).map((card) => ({
    name: (card.dataset.name || "").toLowerCase(),
    element: card,
  }));

  const matchesLabelElement = document.createElement("div");
  matchesLabelElement.classList.add("matches-count");
  matchesLabelElement.style.margin = "5px 0 5px 0";
  matchesLabelElement.style.fontWeight = "bold";
  matchesLabelElement.style.color = "#E6D8A8";

  searchContainerElement.appendChild(matchesLabelElement);

  /**
   * Maneja el evento de búsqueda.
   * Filtra los productos por nombre y actualiza el contador de coincidencias.
   */
  function handleSearch() {
    const searchText = searchInputElement.value.toLowerCase().trim();
    let matches = 0;

    searchableProducts.forEach((product) => {
      const match = product.name.includes(searchText);
      product.element.style.display = match ? "block" : "none";
      if (match) matches++;
    });

    if (searchText === "") {
      matchesLabelElement.textContent = "";
    } else {
      matchesLabelElement.textContent = `${matches} coincidencia${
        matches !== 1 ? "s" : ""
      } encontrad${matches !== 1 ? "as" : "a"} en destacados`;
    }
  }

  searchInputElement.addEventListener("input", handleSearch);
}

