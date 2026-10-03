/**
 * @file ejercicio_web/js/products.js
 * @description Módulo de catálogo: consulta API y renderizado de tarjetas de producto.
 */
import { productsApi } from "./api/client.js";
import { trackProductView } from "./user.js";
import { getProductMetaParts } from "./productMeta.js";
import { cardImageFor } from "./cardImages.js";
import { escapeHtml } from "./escape.js";
import { notFoundHtml } from "./notFound.js";
import { optimizedImage, IMAGE_WIDTHS } from "./imageUrl.js";

export const currentFilters = {
  search: "",
  brands: [],
  gender: "",
  category: "",
  type: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "",
  page: 1,
  limit: 10,
};

function showLoadingState(gridId = "products-grid") {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-span-4 flex justify-center items-center py-20">
      <div class="text-(--text) font-serif text-lg opacity-60">Cargando productos...</div>
    </div>
  `;
}

function showErrorState(message, gridId = "products-grid") {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-span-4 flex justify-center items-center py-20">
      <div class="text-(--text) font-serif text-lg opacity-60">${escapeHtml(message)}</div>
    </div>
  `;
}

// Búsqueda o filtro sin resultados: el frasco con "?" (js/notFound.js) en
// vez de una línea de texto suelta. Ocupa todo el ancho del grid.
function showNoResults(gridId = "products-grid") {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = notFoundHtml({
    detail: currentFilters.search
      ? `No encontramos perfumes para "${currentFilters.search}". Prueba con otra palabra, una marca o mira el catálogo completo.`
      : "No hay perfumes con esta combinación de filtros. Prueba quitando alguno o mira el catálogo completo.",
  });
}

// Arma una tarjeta de producto — usado tanto por renderProductsInto
// (reemplaza el grid) como por appendProductsInto ("Cargar más", suma al
// final sin borrar lo que ya estaba).
// eager: las primeras tarjetas de un grid se piden enseguida (pueden estar
// a la vista al cargar); el resto espera a que el usuario se acerque.
function buildProductCard(product, { eager = false } = {}) {
  const hasDiscount = product.discounted_price !== null;
  const meta = getProductMetaParts(product);
  // Recorte sin fondo SOLO para la tarjeta (el detalle usa la foto original).
  // Primero el recorte (su mapa usa la URL original), después la versión
  // optimizada de Cloudinary para las que no tienen recorte.
  const cardImage =
    cardImageFor(product.image) ||
    optimizedImage(product.image, IMAGE_WIDTHS.card) ||
    "assets/imgs/placeholder.svg";

  const card = document.createElement("article");
  card.className =
    "product-card relative bg-(--card-bg) p-8 rounded-xl overflow-hidden text-(--text)";
  card.dataset.name = (product.name || "").toLowerCase();
  card.dataset.brand = (product.brand || "").toLowerCase();
  card.dataset.price = String(product.price || 0);

  card.innerHTML = `
    ${
      hasDiscount
        ? '<span class="product-card-badge absolute top-5 left-5 bg-(--accent) text-black text-xs px-[10px] py-[6px] rounded">OFERTA</span>'
        : ""
    }
    <a href="producto.html?id=${encodeURIComponent(product.id)}" class="product-card-media block product-link">
      <img
        src="${escapeHtml(cardImage)}"
        alt="${escapeHtml(product.name)}"
        loading="${eager ? "eager" : "lazy"}"
        decoding="async"
        class="product-card-img w-[90%] h-[280px] object-contain transition-transform duration-300"
      />
    </a>
    <div class="product-card-body mt-1">
      <span class="product-card-meta text-xs text-[#999]">${escapeHtml(meta.brand || "SIN MARCA")}${meta.rest ? ` · ${escapeHtml(meta.rest)}` : ""}</span>
      <h3 class="product-card-name font-serif text-lg my-2">${escapeHtml(product.name)}</h3>
      <div class="product-card-price flex gap-2 items-center">
        ${
          hasDiscount
            ? `<span class="line-through text-[#999]">$${Number(product.original_price || 0).toLocaleString()}</span>
               <span class="text-xs">Desde</span>`
            : ""
        }
        <span class="text-(--accent) font-bold">$${Number(product.price || 0).toLocaleString()}</span>
      </div>
    </div>
    <button
      class="add-to-cart font-serif absolute bottom-5 left-5 right-5 bg-(--bg) border border-(--text) text-(--text) py-[14px] cursor-pointer"
      data-id="${escapeHtml(product.id)}"
      data-name="${escapeHtml(product.name)}"
      data-price="${escapeHtml(product.price)}"
      data-type="${escapeHtml(product.type || "original")}"
      aria-label="${product.type === "preparado" ? "Ver presentaciones" : "Añadir producto al Carrito"}"
    >
      ${product.type === "preparado" ? "VER PRESENTACIONES" : "AÑADIR AL CARRITO"}
    </button>
    <button
      class="add-to-favorites absolute top-5 right-5 bg-transparent border-none cursor-pointer"
      data-id="${escapeHtml(product.id)}"
      data-name="${escapeHtml(product.name)}"
      data-price="${escapeHtml(product.price)}"
      aria-label="Añadir producto a Favoritos"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M11.48 3.499a5.373 5.373 0 0 0-7.61 0 5.373 5.373 0 0 0 0 7.61L12 19.24l8.13-8.13a5.373 5.373 0 0 0 0-7.61 5.373 5.373 0 0 0-7.61 0l-.02.02Z"/>
      </svg>
    </button>
  `;

  const link = card.querySelector(".product-link");
  link?.addEventListener("click", () => {
    trackProductView(product.id);
  });

  return card;
}

/**
 * Renderiza tarjetas de producto dentro de cualquier grid, no solo el del
 * catálogo principal — usado también por las secciones de Originales y
 * Preparados en el home. Reemplaza lo que ya había en el grid.
 * @param {Array} products
 * @param {string} gridId
 */
export function renderProductsInto(products, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.innerHTML = "";

  if (!products || products.length === 0) {
    return;
  }

  products.forEach((product, i) =>
    grid.appendChild(buildProductCard(product, { eager: i < 4 })),
  );

  window.dispatchEvent(new CustomEvent("products-rendered"));
}

/**
 * Igual que renderProductsInto, pero suma tarjetas al final del grid en vez
 * de reemplazarlo — para el botón "Cargar más" del catálogo.
 * @param {Array} products
 * @param {string} gridId
 */
export function appendProductsInto(products, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid || !products || products.length === 0) return;

  products.forEach((product) => grid.appendChild(buildProductCard(product)));

  window.dispatchEvent(new CustomEvent("products-rendered"));
}

/**
 * @param {object} filters
 * @param {object} [options]
 * @param {boolean} [options.append] - true = suma esta página al final del
 *   grid ("Cargar más"), en vez de reemplazarlo. Lo usa solo el botón de
 *   catalogo.html — cualquier cambio de filtro sigue reemplazando.
 * @returns {Promise<{products: Array, pagination: object|null}>}
 */
export async function fetchProducts(filters = {}, { append = false } = {}) {
  Object.assign(currentFilters, filters);
  if (!append) showLoadingState();

  try {
    const result = await productsApi.getAll(currentFilters);
    const products = result.data || [];
    const pagination = result.pagination || null;

    if (products.length === 0) {
      if (!append) {
        showNoResults();
      }
      window.dispatchEvent(
        new CustomEvent("products-rendered", { detail: { pagination, append } }),
      );
      return { products, pagination };
    }

    if (append) {
      appendProductsInto(products, "products-grid");
    } else {
      renderProductsInto(products, "products-grid");
    }
    window.dispatchEvent(
      new CustomEvent("products-rendered", { detail: { pagination, append } }),
    );
    return { products, pagination };
  } catch (err) {
    if (!append) {
      showErrorState("Error al cargar los productos. Intenta de nuevo.");
    }
    console.error(err);
    return { products: [], pagination: null };
  }
}

/**
 * Trae y renderiza un grupo pequeño de productos en cualquier grid del
 * home (ej. las secciones de Originales / Preparados) — independiente
 * de los filtros del catálogo principal.
 * @param {string} gridId
 * @param {object} filters
 */
export async function fetchSection(gridId, filters = {}) {
  showLoadingState(gridId);

  try {
    const result = await productsApi.getAll({ limit: 4, ...filters });
    renderProductsInto(result.data || [], gridId);
    window.dispatchEvent(new CustomEvent("products-rendered"));
  } catch (err) {
    showErrorState("No se pudo cargar esta sección.", gridId);
    console.error(err);
  }
}
