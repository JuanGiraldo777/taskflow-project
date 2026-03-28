/**
 * @file ejercicio_web/js/pages/producto.js
 * @description Lógica de la página de detalle de producto y relacionados.
 */
import { productsApi } from "../api/client.js";
import { cartApi } from "../api/client.js";
import { wishlistApi } from "../api/client.js";
import { trackProductView } from "../user.js";
import { renderProducts } from "../products.js";
import { renderReviews } from "../reviews.js";
import { initCart } from "../cart.js";
import { initWishlist } from "../wishlist.js";
import { initUser } from "../user.js";
import { initNav } from "../nav.js";
import { initThemeToggle } from "../theme.js";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
  window.location.href = "index.html";
}

function closeCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  drawer?.classList.remove("translate-x-0");
  drawer?.classList.add("translate-x-full");
}

function openCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  drawer?.classList.remove("translate-x-full");
  drawer?.classList.add("translate-x-0");
}

async function renderProductDetail() {
  const section = document.getElementById("product-detail");
  if (!section) return;

  try {
    const product = await productsApi.getById(productId);

    const breadcrumb = document.getElementById("breadcrumb-product");
    if (breadcrumb) breadcrumb.textContent = product.name;

    document.title = `Maison - ${product.name}`;

    const hasDiscount = product.discounted_price !== null;

    const images = product.images || [];
    const mainImage =
      images.find((img) => img.is_main)?.url ||
      images[0]?.url ||
      "assets/imgs/placeholder.png";

    section.innerHTML = `
      <div class="grid grid-cols-2 gap-16 max-lg:grid-cols-1 max-lg:gap-8">
        <div class="flex flex-col gap-4">
          <div class="bg-(--card-bg) rounded-xl overflow-hidden flex items-center justify-center p-8 min-h-112.5">
            <img
              id="main-product-image"
              src="${mainImage}"
              alt="${product.name}"
              class="max-h-100 object-contain transition-all duration-300"
            />
          </div>
          ${
            images.length > 1
              ? `
            <div class="flex gap-3 overflow-x-auto pb-2">
              ${images
                .map(
                  (img, i) => `
                <button
                  class="thumbnail-btn shrink-0 w-20 h-20 bg-(--card-bg) rounded-lg overflow-hidden border-2 ${i === 0 ? "border-(--accent)" : "border-transparent"} hover:border-(--accent) transition-colors"
                  data-src="${img.url}"
                >
                  <img src="${img.url}" alt="Vista ${i + 1}" class="w-full h-full object-contain p-1" />
                </button>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>

        <div class="flex flex-col gap-6 py-4">
          <div class="flex items-center gap-3">
            <span class="text-sm text-(--accent) font-sans tracking-widest uppercase">
              ${product.brand}
            </span>
            <span class="text-(--text) opacity-30">·</span>
            <span class="text-sm text-(--text) opacity-60 font-sans">
              ${product.category}
            </span>
          </div>

          <h1 class="font-serif text-4xl max-sm:text-2xl text-(--text) leading-tight">
            ${product.name}
          </h1>

          <div class="flex items-end gap-3">
            ${
              hasDiscount
                ? `
              <span class="line-through text-(--text) opacity-50 text-lg">
                $${Number(product.original_price || 0).toLocaleString()}
              </span>
              <span class="text-xs text-(--text) opacity-60">Desde</span>
            `
                : ""
            }
            <span class="text-(--accent) font-serif text-3xl font-bold">
              $${Number(product.price || 0).toLocaleString()}
            </span>
            ${
              hasDiscount
                ? `
              <span class="bg-(--accent) text-black text-xs px-2 py-1 rounded font-bold">
                OFERTA
              </span>
            `
                : ""
            }
          </div>

          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full ${Number(product.stock) > 0 ? "bg-green-500" : "bg-red-500"}"></span>
            <span class="text-sm text-(--text) opacity-70 font-sans">
              ${
                Number(product.stock) > 0
                  ? `${product.stock} unidades disponibles`
                  : "Sin stock"
              }
            </span>
          </div>

          ${
            product.description
              ? `
            <div class="border-t border-(--text) border-opacity-20 pt-6">
              <h3 class="font-serif text-lg text-(--text) mb-3">Descripcion</h3>
              <p class="text-(--text) opacity-80 font-sans leading-relaxed">
                ${product.description}
              </p>
            </div>
          `
              : ""
          }

          <div class="flex flex-col gap-3 mt-4">
            <button
              id="detail-add-to-cart"
              class="w-full py-4 bg-(--bg) border border-(--text) text-(--text) font-serif text-lg hover:border-(--accent) hover:text-(--accent) transition-all duration-200 active:scale-95"
              data-id="${product.id}"
              data-name="${product.name}"
              data-price="${product.price}"
              ${Number(product.stock) === 0 ? "disabled" : ""}
            >
              ${Number(product.stock) === 0 ? "SIN STOCK" : "ANADIR AL CARRITO"}
            </button>
            <button
              id="detail-add-to-wishlist"
              class="add-to-favorites w-full py-3 border border-(--text) border-opacity-40 text-(--text) font-sans text-sm hover:border-(--accent) hover:text-(--accent) transition-all duration-200 active:scale-95"
              data-id="${product.id}"
              data-name="${product.name}"
              data-price="${product.price}"
            >
              ♡ Anadir a favoritos
            </button>
          </div>
        </div>
      </div>
    `;

    // Comprobar si el producto ya está en wishlist al cargar
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const wishlist = await wishlistApi.getWishlist();
        const isInWishlist = wishlist.some(
          (item) => item.product_id === product.id,
        );
        if (isInWishlist) {
          const wishlistBtn = document.getElementById("detail-add-to-wishlist");
          if (wishlistBtn) wishlistBtn.textContent = "♥ En favoritos";
        }
      } catch (err) {
        console.error(err);
      }
    }

    section.querySelectorAll(".thumbnail-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mainImageElement = document.getElementById("main-product-image");
        if (mainImageElement) {
          mainImageElement.src = btn.dataset.src;
        }

        section.querySelectorAll(".thumbnail-btn").forEach((thumb) => {
          thumb.classList.remove("border-(--accent)");
          thumb.classList.add("border-transparent");
        });

        btn.classList.remove("border-transparent");
        btn.classList.add("border-(--accent)");
      });
    });

    document
      .getElementById("detail-add-to-cart")
      ?.addEventListener("click", async () => {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Inicia sesión para añadir productos al carrito");
          return;
        }
        try {
          await cartApi.addItem(product.id, 1);
          // Disparar evento para que cart.js sincronice su estado
          window.dispatchEvent(new CustomEvent("sync-cart"));
          // Abrir drawer
          document
            .getElementById("cart-drawer")
            ?.classList.remove("translate-x-full");
          document
            .getElementById("cart-drawer")
            ?.classList.add("translate-x-0");
        } catch (err) {
          alert(err.message);
        }
      });

    document
      .getElementById("detail-add-to-wishlist")
      ?.addEventListener("click", async () => {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Inicia sesión para añadir a favoritos");
          return;
        }
        // Guardar referencia ANTES del await
        const btn = document.getElementById("detail-add-to-wishlist");
        try {
          const wishlist = await wishlistApi.getWishlist();
          const existing = wishlist.find(
            (item) => item.product_id === product.id,
          );

          if (existing) {
            // Ya está — quitar
            await wishlistApi.removeItem(existing.id);
            if (btn) btn.textContent = "♡ Añadir a favoritos";
          } else {
            // No está — añadir
            await wishlistApi.addItem(product.id);
            if (btn) btn.textContent = "♥ En favoritos";
          }

          window.dispatchEvent(new CustomEvent("sync-wishlist"));
        } catch (err) {
          alert(err.message);
        }
      });

    await trackProductView(product.id);
    await loadRelated(product.id);
  } catch (err) {
    section.innerHTML = `
      <div class="flex flex-col items-center justify-center py-32">
        <p class="text-(--text) font-serif text-xl opacity-60 mb-4">
          Producto no encontrado
        </p>
        <a href="index.html" class="text-(--accent) font-sans text-sm hover:underline">
          Volver al catalogo
        </a>
      </div>
    `;
  }
}

async function bindRelatedActions() {
  const relatedSection = document.getElementById("related-grid");
  if (!relatedSection) return;

  relatedSection.addEventListener("click", async (event) => {
    const cartButton = event.target.closest(".add-to-cart");
    if (cartButton) {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Inicia sesion para anadir productos al carrito");
        return;
      }

      const id = Number(cartButton.dataset.id);
      if (!id || Number.isNaN(id)) return;

      try {
        await cartApi.addItem(id, 1);
        openCartDrawer();
      } catch (err) {
        alert(err.message);
      }
      return;
    }

    const wishlistButton = event.target.closest(".add-to-favorites");
    if (wishlistButton) {
      event.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Inicia sesion para anadir a favoritos");
        return;
      }

      const id = Number(wishlistButton.dataset.id);
      if (!id || Number.isNaN(id)) return;

      try {
        await wishlistApi.addItem(id);
        window.dispatchEvent(new CustomEvent("products-rendered"));
      } catch (err) {
        alert(err.message);
      }
    }
  });
}

async function loadRelated(id) {
  const grid = document.getElementById("related-grid");
  const section = document.getElementById("related-products");
  if (!grid || !section) return;

  try {
    const response = await fetch(
      `http://localhost:3000/api/v1/products/${id}/related`
    );

    if (!response.ok) throw new Error("No se pudieron cargar relacionados");

    const related = await response.json();

    if (!related || related.length === 0) {
      section.classList.add("hidden");
      return;
    }

    // Renderizar directamente en related-grid sin rename
    grid.innerHTML = '';

    related.forEach((product) => {
      const hasDiscount = product.discounted_price !== null;

      const card = document.createElement("article");
      card.className = "product-card relative bg-(--card-bg) p-8 rounded-xl overflow-hidden text-(--text)";
      card.dataset.name  = product.name.toLowerCase();
      card.dataset.brand = product.brand.toLowerCase();
      card.dataset.price = product.price;

      card.innerHTML = `
        ${hasDiscount
          ? '<span class="absolute top-5 left-5 bg-(--accent) text-black text-xs px-[10px] py-[6px] rounded">OFERTA</span>'
          : ''}
        <a href="producto.html?id=${product.id}" class="block product-link">
          <img
            src="${product.image || 'assets/imgs/placeholder.png'}"
            alt="${product.name}"
            class="w-[90%] h-[280px] object-contain transition-transform duration-300"
          />
        </a>
        <div class="mt-1">
          <span class="text-xs text-[#999]">${product.brand}</span>
          <h3 class="font-serif text-lg my-2">${product.name}</h3>
          <div class="flex gap-2 items-center">
            ${hasDiscount
              ? `<span class="line-through text-[#999]">$${product.original_price.toLocaleString()}</span>
                 <span class="text-xs">Desde</span>`
              : ''}
            <span class="text-(--accent) font-bold">$${product.price.toLocaleString()}</span>
          </div>
        </div>
        <button
          class="add-to-cart font-serif absolute bottom-5 left-5 right-5 bg-(--bg) border border-(--text) text-(--text) py-[14px] cursor-pointer"
          data-id="${product.id}"
          data-name="${product.name}"
          data-price="${product.price}"
        >
          AÑADIR AL CARRITO
        </button>
        <button
          class="add-to-favorites absolute top-5 right-5 bg-transparent border-none cursor-pointer"
          data-id="${product.id}"
          data-name="${product.name}"
          data-price="${product.price}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M11.48 3.499a5.373 5.373 0 0 0-7.61 0 5.373 5.373 0 0 0 0 7.61L12 19.24l8.13-8.13a5.373 5.373 0 0 0 0-7.61 5.373 5.373 0 0 0-7.61 0l-.02.02Z"/>
          </svg>
        </button>
      `;

      grid.appendChild(card);
    });

    // Conectar botones de carrito
    grid.querySelectorAll(".add-to-cart").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Inicia sesión para añadir productos al carrito");
          return;
        }
        try {
          await cartApi.addItem(parseInt(btn.dataset.id), 1);
          window.dispatchEvent(new CustomEvent("sync-cart"));
          document.getElementById("cart-drawer")?.classList.remove("translate-x-full");
          document.getElementById("cart-drawer")?.classList.add("translate-x-0");
        } catch (err) {
          alert(err.message);
        }
      });
    });

    // Conectar botones de wishlist con toggle
    grid.querySelectorAll(".add-to-favorites").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const token = localStorage.getItem("token");
        if (!token) {
          alert("Inicia sesión para añadir a favoritos");
          return;
        }

        const productId = parseInt(btn.dataset.id);
        const svg = btn.querySelector("svg");

        try {
          const wishlist = await wishlistApi.getWishlist();
          const existing = wishlist.find(item => item.product_id === productId);

          if (existing) {
            await wishlistApi.removeItem(existing.id);
            if (svg) { svg.style.fill = "none"; svg.style.stroke = "currentColor"; }
          } else {
            await wishlistApi.addItem(productId);
            if (svg) { svg.style.fill = "var(--accent)"; svg.style.stroke = "var(--accent)"; }
          }

          window.dispatchEvent(new CustomEvent("sync-wishlist"));
        } catch (err) {
          console.error(err);
        }
      });
    });

  } catch (err) {
    section.classList.add("hidden");
    console.error("Error al cargar relacionados:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!productId) return;

  initNav();
  initThemeToggle();
  initCart();
  initWishlist();
  initUser();

  await bindRelatedActions();
  await renderProductDetail();
  renderReviews();

  document.getElementById("cart-overlay")?.addEventListener("click", () => {
    closeCartDrawer();
  });
});
