/**
 * @file ejercicio_web/js/products.js
 * @description Módulo de catálogo: consulta API y renderizado de tarjetas de producto.
 */
import { productsApi } from "./api/client.js";
import { trackProductView } from "./user.js";

export const currentFilters = {
  search: "",
  brands: [],
  minPrice: "",
  maxPrice: "",
  sortBy: "",
  page: 1,
  limit: 10,
};

function showLoadingState() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-span-4 flex justify-center items-center py-20">
      <div class="text-(--text) font-serif text-lg opacity-60">Cargando productos...</div>
    </div>
  `;
}

function showErrorState(message) {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-span-4 flex justify-center items-center py-20">
      <div class="text-(--text) font-serif text-lg opacity-60">${message}</div>
    </div>
  `;
}

export function renderProducts(products) {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!products || products.length === 0) {
    showErrorState("No se encontraron productos con esos filtros.");
    return;
  }

  products.forEach((product) => {
    const hasDiscount = product.discounted_price !== null;

    const card = document.createElement("article");
    card.className =
      "product-card relative bg-(--card-bg) p-8 rounded-xl overflow-hidden text-(--text)";
    card.dataset.name = (product.name || "").toLowerCase();
    card.dataset.brand = (product.brand || "").toLowerCase();
    card.dataset.price = String(product.price || 0);

    card.innerHTML = `
      ${
        hasDiscount
          ? '<span class="absolute top-5 left-5 bg-(--accent) text-black text-xs px-[10px] py-[6px] rounded">OFERTA</span>'
          : ""
      }
      <a href="producto.html?id=${product.id}" class="block product-link">
        <img
          src="${product.image || "assets/imgs/placeholder.png"}"
          alt="${product.name}"
          class="w-[90%] h-[280px] object-contain transition-transform duration-300"
        />
      </a>
      <div class="mt-1">
        <span class="text-xs text-[#999]">${product.brand || "SIN MARCA"}</span>
        <h3 class="font-serif text-lg my-2">${product.name}</h3>
        <div class="flex gap-2 items-center">
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
        data-id="${product.id}"
        data-name="${product.name}"
        data-price="${product.price}"
        aria-label="Añadir producto al Carrito"
      >
        AÑADIR AL CARRITO
      </button>
      <button
        class="add-to-favorites absolute top-5 right-5 bg-transparent border-none cursor-pointer"
        data-id="${product.id}"
        data-name="${product.name}"
        data-price="${product.price}"
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

    grid.appendChild(card);
  });

  window.dispatchEvent(new CustomEvent("products-rendered"));
}

export async function fetchProducts(filters = {}) {
  Object.assign(currentFilters, filters);
  showLoadingState();

  try {
    const result = await productsApi.getAll(currentFilters);
    renderProducts(result.data || []);
  } catch (err) {
    showErrorState("Error al cargar los productos. Intenta de nuevo.");
    console.error(err);
  }
}
