/**
 * @file ejercicio_web/js/pages/producto.js
 * @description Lógica de la página de detalle de producto y relacionados.
 */
import { productsApi } from "../api/client.js";
import { cartApi } from "../api/client.js";
import { trackProductView } from "../user.js";
import { renderReviews } from "../reviews.js";
import { initCart } from "../cart.js";
import { initWishlist } from "../wishlist.js";
import { initUser } from "../user.js";
import { initNav } from "../nav.js";
import { initThemeToggle } from "../theme.js";
import { getProductMetaParts } from "../productMeta.js";
import { initAnalytics } from "../analytics.js";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
  window.location.href = "index.html";
}

// Estado de la galería de imágenes del detalle. El lightbox es un único
// elemento estático en producto.html (no se recrea en cada render, a
// diferencia de las miniaturas) — sus controles se conectan UNA sola vez
// en initLightboxControls() y leen/escriben este objeto compartido, en
// vez de que cada renderProductDetail() vuelva a atarles listeners
// encima (esa duplicación fue justo la causa del bug de favoritos
// arreglado antes en esta misma página).
const galleryState = {
  images: [],
  currentIndex: 0,
};

function renderThumbnailActiveState() {
  document.querySelectorAll(".thumbnail-btn").forEach((thumb) => {
    const isActive = Number(thumb.dataset.index) === galleryState.currentIndex;
    thumb.classList.toggle("border-(--accent)", isActive);
    thumb.classList.toggle("border-transparent", !isActive);
  });
}

// fade=false para navegación por teclado/flechas del lightbox (se siente
// mejor instantáneo ahí); fade=true para clicks en miniaturas, que es
// donde de verdad se nota y se ve premium.
function setMainImage(index, { fade = true } = {}) {
  const image = galleryState.images[index];
  if (!image) return;
  galleryState.currentIndex = index;

  const mainImg = document.getElementById("main-product-image");
  if (mainImg) {
    if (fade) {
      mainImg.style.opacity = "0";
      window.setTimeout(() => {
        mainImg.src = image.url;
        mainImg.style.opacity = "1";
      }, 150);
    } else {
      mainImg.src = image.url;
    }
  }

  const lightboxImg = document.getElementById("lightbox-image");
  if (lightboxImg) lightboxImg.src = image.url;

  renderThumbnailActiveState();
}

function openLightbox(index) {
  const lightbox = document.getElementById("gallery-lightbox");
  if (!lightbox || galleryState.images.length === 0) return;
  setMainImage(index, { fade: false });
  lightbox.hidden = false;
}

function closeLightbox() {
  const lightbox = document.getElementById("gallery-lightbox");
  if (lightbox) lightbox.hidden = true;
}

function showNextImage() {
  if (galleryState.images.length === 0) return;
  setMainImage((galleryState.currentIndex + 1) % galleryState.images.length, {
    fade: false,
  });
}

function showPrevImage() {
  if (galleryState.images.length === 0) return;
  setMainImage(
    (galleryState.currentIndex - 1 + galleryState.images.length) %
      galleryState.images.length,
    { fade: false },
  );
}

// Flechas del lightbox: no tiene sentido navegar si hay una sola foto (o
// ninguna real, solo el placeholder).
function updateLightboxArrowsVisibility() {
  const multiple = galleryState.images.length > 1;
  document.getElementById("lightbox-prev")?.toggleAttribute("hidden", !multiple);
  document.getElementById("lightbox-next")?.toggleAttribute("hidden", !multiple);
}

// Controles del lightbox: se conectan una sola vez (el elemento es
// estático), no en cada render de producto.
function initLightboxControls() {
  document
    .getElementById("lightbox-close")
    ?.addEventListener("click", closeLightbox);
  document
    .getElementById("lightbox-prev")
    ?.addEventListener("click", showPrevImage);
  document
    .getElementById("lightbox-next")
    ?.addEventListener("click", showNextImage);

  // Clic en el fondo oscuro (no en la imagen ni en los botones) cierra.
  document.getElementById("gallery-lightbox")?.addEventListener("click", (e) => {
    if (e.target.id === "gallery-lightbox") closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    const lightbox = document.getElementById("gallery-lightbox");
    if (!lightbox || lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showPrevImage();
    if (e.key === "ArrowRight") showNextImage();
  });
}

// Zoom con seguimiento del cursor sobre la imagen principal — se vuelve a
// conectar en cada render porque el frame/la imagen se recrean con
// section.innerHTML. En touch (sin mouse real) no aplica: el toque abre
// directo el lightbox, que es donde de verdad se puede inspeccionar
// el detalle a pantalla completa.
function setupImageZoom() {
  const frame = document.getElementById("gallery-main-frame");
  const img = document.getElementById("main-product-image");
  if (!frame || !img) return;

  const supportsHoverZoom = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  if (!supportsHoverZoom) return;

  const ZOOM_SCALE = 2.2;

  frame.addEventListener("mousemove", (e) => {
    const rect = frame.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = `scale(${ZOOM_SCALE})`;
  });

  frame.addEventListener("mouseleave", () => {
    img.style.transform = "scale(1)";
  });
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
    const isPreparado = product.type === "preparado";
    const productMeta = getProductMetaParts(product);
    const variants = product.variants || [];
    // Las variantes ya vienen ordenadas por precio ascendente desde el backend —
    // se pre-selecciona la más barata (primera disponible con stock si hay alguna).
    const initialVariant = isPreparado
      ? variants.find((v) => Number(v.stock) > 0) || variants[0] || null
      : null;
    const displayPrice = initialVariant ? initialVariant.price : product.price;

    const hasRealImages = (product.images || []).length > 0;
    // Sin fotos reales, la galería es solo el placeholder — sin zoom ni
    // lightbox, no hay nada que ampliar (ver setupImageZoom/click más abajo).
    galleryState.images = hasRealImages
      ? product.images
      : [{ url: "assets/imgs/placeholder.svg", is_main: true }];
    galleryState.currentIndex = 0;
    const images = galleryState.images;
    const mainImage = images[0].url;

    section.innerHTML = `
      <div class="grid grid-cols-2 gap-16 max-lg:grid-cols-1 max-lg:gap-8">
        <div class="flex flex-col gap-4">
          <div
            id="gallery-main-frame"
            class="bg-(--card-bg) rounded-xl overflow-hidden flex items-center justify-center p-8 min-h-112.5"
          >
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
                  data-index="${i}"
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
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-sm text-(--accent) font-sans tracking-widest uppercase">
              ${productMeta.brand}
            </span>
            <span class="text-(--text) opacity-30">·</span>
            <span class="text-sm text-(--text) opacity-60 font-sans">
              ${productMeta.rest}
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
            <span id="detail-price" class="text-(--accent) font-serif text-3xl font-bold">
              $${Number(displayPrice || 0).toLocaleString()}
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

          ${
            isPreparado
              ? `
            <div class="flex flex-col gap-3">
              <span class="text-sm text-(--text) font-sans font-semibold">Presentación</span>
              <div class="flex flex-wrap gap-2" id="variant-selector">
                ${variants
                  .map((v) => {
                    const outOfStock = Number(v.stock) === 0;
                    const isSelected = v.variant_id === initialVariant?.variant_id;
                    return `
                  <button
                    type="button"
                    class="variant-btn px-4 py-2 border rounded font-sans text-sm transition-all duration-200 ${
                      isSelected
                        ? "border-(--accent) text-(--accent)"
                        : "border-(--text) border-opacity-40 text-(--text)"
                    } ${outOfStock ? "opacity-40 cursor-not-allowed" : "hover:border-(--accent) hover:text-(--accent)"}"
                    data-variant-id="${v.variant_id}"
                    data-price="${v.price}"
                    data-stock="${v.stock}"
                    ${outOfStock ? "disabled" : ""}
                  >
                    ${v.label}${outOfStock ? " (agotado)" : ""}
                  </button>
                `;
                  })
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

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
              data-price="${displayPrice}"
              data-variant-id="${initialVariant?.variant_id || ""}"
              ${
                isPreparado
                  ? !initialVariant || Number(initialVariant.stock) === 0
                    ? "disabled"
                    : ""
                  : Number(product.stock) === 0
                    ? "disabled"
                    : ""
              }
            >
              ${
                isPreparado
                  ? !initialVariant || Number(initialVariant.stock) === 0
                    ? "SIN STOCK"
                    : "ANADIR AL CARRITO"
                  : Number(product.stock) === 0
                    ? "SIN STOCK"
                    : "ANADIR AL CARRITO"
              }
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

    // El estado inicial del botón (¿ya está en favoritos?) y su click ya
    // los maneja la delegación global de wishlist.js (initWishlist, llamado
    // más abajo en DOMContentLoaded) — se re-sincroniza solo al escuchar
    // este evento, igual que hace con las tarjetas de cualquier grid.
    window.dispatchEvent(new CustomEvent("products-rendered"));

    section.querySelectorAll(".thumbnail-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        if (!Number.isNaN(index)) setMainImage(index);
      });
    });

    updateLightboxArrowsVisibility();
    setupImageZoom();

    const mainFrame = document.getElementById("gallery-main-frame");
    if (mainFrame) {
      mainFrame.style.cursor = hasRealImages ? "zoom-in" : "default";
      if (hasRealImages) {
        mainFrame.addEventListener("click", () => {
          openLightbox(galleryState.currentIndex);
        });
      }
    }

    // Selector de presentación (solo preparados): al elegir una, se
    // actualiza el precio mostrado y qué variantId se manda al carrito.
    section.querySelectorAll(".variant-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;

        section.querySelectorAll(".variant-btn").forEach((b) => {
          b.classList.remove("border-(--accent)", "text-(--accent)");
          b.classList.add(
            "border-(--text)",
            "border-opacity-40",
            "text-(--text)",
          );
        });
        btn.classList.remove(
          "border-(--text)",
          "border-opacity-40",
          "text-(--text)",
        );
        btn.classList.add("border-(--accent)", "text-(--accent)");

        const priceEl = document.getElementById("detail-price");
        if (priceEl) {
          priceEl.textContent = `$${Number(btn.dataset.price).toLocaleString()}`;
        }

        const addBtn = document.getElementById("detail-add-to-cart");
        if (addBtn) {
          addBtn.dataset.variantId = btn.dataset.variantId;
          addBtn.dataset.price = btn.dataset.price;
          addBtn.disabled = false;
          addBtn.textContent = "ANADIR AL CARRITO";
        }
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
          const addBtn = document.getElementById("detail-add-to-cart");
          const variantId = addBtn?.dataset.variantId
            ? Number(addBtn.dataset.variantId)
            : null;
          await cartApi.addItem(product.id, 1, variantId);
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

    // "detail-add-to-wishlist" NO se conecta acá — ya tiene la clase
    // add-to-favorites, así que la delegación global de wishlist.js
    // (document-level, ver initWishlist) ya lo maneja. Tenerlo conectado acá
    // TAMBIÉN hacía que cada click disparara las dos veces: se duplicaba al
    // añadir, y al quitar solo se borraba una de las dos filas duplicadas
    // (por eso el botón se quedaba en "En favoritos" aunque ya le hubieras
    // dado para sacarlo).

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

async function loadRelated(id) {
  const grid = document.getElementById("related-grid");
  const section = document.getElementById("related-products");
  if (!grid || !section) return;

  try {

    const related = await productsApi.getRelated(id);

    if (!related || related.length === 0) {
      section.classList.add("hidden");
      return;
    }

    // Renderizar directamente en related-grid sin rename
    grid.innerHTML = '';

    related.forEach((product) => {
      const hasDiscount = product.discounted_price !== null;
      const meta = getProductMetaParts(product);

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
            src="${product.image || 'assets/imgs/placeholder.svg'}"
            alt="${product.name}"
            class="w-[90%] h-[280px] object-contain transition-transform duration-300"
          />
        </a>
        <div class="mt-1">
          <span class="text-xs text-[#999]">${meta.brand}${meta.rest ? ` · ${meta.rest}` : ""}</span>
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
          data-type="${product.type || "original"}"
        >
          ${product.type === "preparado" ? "VER PRESENTACIONES" : "AÑADIR AL CARRITO"}
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

    // El click de "añadir al carrito"/"a favoritos" en estas tarjetas ya lo
    // maneja la delegación global de cart.js/wishlist.js (initCart/initWishlist,
    // llamados más abajo en DOMContentLoaded) — no hace falta conectarlos aquí.
    window.dispatchEvent(new CustomEvent("products-rendered"));
  } catch (err) {
    section.classList.add("hidden");
    console.error("Error al cargar relacionados:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!productId) return;

  initAnalytics();
  initNav();
  initThemeToggle();
  initCart();
  initWishlist();
  initUser();
  initLightboxControls();

  await renderProductDetail();
  renderReviews();

  document.getElementById("cart-overlay")?.addEventListener("click", () => {
    closeCartDrawer();
  });
});
