/**
 * @file ejercicio_web/js/pages/admin.js
 * @description Alta de productos (originales y preparados) desde el panel admin.
 */
import { isLoggedIn, getCurrentUser, initUser } from "../user.js";
import { initThemeToggle } from "../theme.js";
import {
  productsApi,
  categoriesApi,
  brandsApi,
  gendersApi,
  presentationsApi,
} from "../api/client.js";
import { initAnalytics } from "../analytics.js";

// Protección de UX, no de seguridad real — el backend ya rechaza estas
// rutas con verifyAdmin. Esto solo evita mostrar el formulario a quien
// no debería verlo.
if (!isLoggedIn() || getCurrentUser()?.role !== "admin") {
  window.location.href = "index.html";
}

// Se rellena en loadReferenceData(). Los preparados no tienen subcategoría
// real — todos usan esta única categoría "Preparados", así que el select
// de categoría se fija y se bloquea en vez de dejar elegir Árabe/Nicho/Diseñador.
let preparadosCategoryId = null;

// null = el formulario está en modo "crear"; con un id, está editando ese
// producto — buildPayload/el submit no cambian, solo a qué endpoint pegan.
let editingProductId = null;

// El color de éxito/error se fija con estilo inline en vez de clases de
// Tailwind: bg-green-900/30, text-green-400, bg-red-900/30 y text-red-400
// nunca estuvieron compiladas en output.css (solo sobrevivieron
// --color-green-500/--color-red-500 como variables del tema — Tailwind v4
// también poda las variables de color que ningún selector usa, no solo
// las clases) — este cuadro de feedback nunca mostró color real, solo el
// texto. Encontrado mientras se tocaba esta función para el CRUD nuevo.
const FEEDBACK_COLORS = {
  success: { color: "var(--color-green-500)", background: "color-mix(in srgb, var(--color-green-500) 15%, transparent)" },
  error: { color: "var(--color-red-500)", background: "color-mix(in srgb, var(--color-red-500) 15%, transparent)" },
};

function showFeedback(message, type = "success", boxId = "admin-feedback") {
  const box = document.getElementById(boxId);
  if (!box) return;

  box.textContent = message;
  box.classList.remove("hidden");
  Object.assign(box.style, FEEDBACK_COLORS[type] || FEEDBACK_COLORS.success);
}

function populateSelect(select, items, { placeholder } = {}) {
  if (!select) return;

  select.innerHTML = "";

  if (placeholder) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholder;
    opt.disabled = true;
    opt.selected = true;
    select.appendChild(opt);
  }

  items.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.name;
    select.appendChild(opt);
  });
}

// Las presentaciones vienen de la API, no están hardcodeadas — si mañana
// se agrega una presentación nueva en la BD, aparece aquí sola.
function renderVariantFields(presentations) {
  const container = document.getElementById("variants-fields");
  if (!container) return;

  container.innerHTML = presentations
    .map(
      (p) => `
    <div class="flex items-center gap-3 bg-(--card-bg) px-4 py-3 rounded">
      <input
        type="checkbox"
        class="variant-checkbox"
        data-presentation-id="${p.id}"
        id="variant-${p.id}"
      />
      <label for="variant-${p.id}" class="flex-1 cursor-pointer">
        ${p.label} — $${Number(p.price).toLocaleString()}
      </label>
      <input
        type="number"
        min="0"
        step="1"
        value="0"
        disabled
        class="variant-stock w-24 px-2 py-1 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm disabled:opacity-40"
        data-presentation-id="${p.id}"
        placeholder="Stock"
      />
    </div>
  `,
    )
    .join("");

  container.querySelectorAll(".variant-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const stockInput = container.querySelector(
        `.variant-stock[data-presentation-id="${checkbox.dataset.presentationId}"]`,
      );
      if (stockInput) stockInput.disabled = !checkbox.checked;
    });
  });
}

// La galería de imágenes es una lista repetible: se arranca con una fila
// vacía y "+ Agregar otra imagen" va sumando más. Ninguna es obligatoria
// (hay productos sin foto todavía, el frontend ya tiene placeholder) — la
// primera fila con URL se manda como imagen principal, el resto como
// galería (mismo criterio que usa importCatalog.js con las fotos reales).
function createImageRow() {
  const row = document.createElement("div");
  row.className = "flex gap-2 image-field-row";
  row.innerHTML = `
    <input
      type="url"
      class="image-url-input flex-1 px-3 py-2 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded text-sm focus:outline-none focus:border-(--accent)"
      placeholder="https://res.cloudinary.com/..."
    />
    <button
      type="button"
      class="remove-image-btn px-3 text-(--text) opacity-60 hover:opacity-100 hover:text-(--accent) bg-transparent border-none cursor-pointer text-lg"
      aria-label="Quitar esta imagen"
    >
      ×
    </button>
  `;
  row
    .querySelector(".remove-image-btn")
    ?.addEventListener("click", () => row.remove());
  return row;
}

function renderImageFields() {
  const container = document.getElementById("image-fields");
  if (!container) return;
  container.innerHTML = "";
  container.appendChild(createImageRow());
}

function collectImageUrls() {
  return Array.from(document.querySelectorAll(".image-url-input"))
    .map((input) => input.value.trim())
    .filter(Boolean);
}

// Igual que renderImageFields, pero arranca con una fila por cada imagen
// que el producto ya tiene (para editar), en vez de una sola vacía.
function populateImageFieldsFromProduct(images) {
  const container = document.getElementById("image-fields");
  if (!container) return;
  container.innerHTML = "";

  if (!images || images.length === 0) {
    container.appendChild(createImageRow());
    return;
  }

  images.forEach((img) => {
    const row = createImageRow();
    const input = row.querySelector(".image-url-input");
    if (input) input.value = img.url;
    container.appendChild(row);
  });
}

// ── Alternar entre la lista y el formulario ────────────────────────────
function showListView() {
  document.getElementById("admin-product-list-section")?.classList.remove("hidden");
  document.getElementById("admin-product-form-section")?.classList.add("hidden");
  loadProductList(document.getElementById("admin-product-search")?.value || "");
}

function showFormView() {
  document.getElementById("admin-product-list-section")?.classList.add("hidden");
  document.getElementById("admin-product-form-section")?.classList.remove("hidden");
}

function startCreate() {
  editingProductId = null;
  resetForm();
  const heading = document.getElementById("admin-form-heading");
  if (heading) heading.textContent = "Nuevo producto";
  const submitBtn = document.getElementById("admin-submit-btn");
  if (submitBtn) submitBtn.textContent = "Crear producto";
  showFormView();
}

async function startEdit(id) {
  try {
    const product = await productsApi.getById(id);
    editingProductId = id;
    fillFormForEdit(product);
    const heading = document.getElementById("admin-form-heading");
    if (heading) heading.textContent = `Editar: ${product.name}`;
    const submitBtn = document.getElementById("admin-submit-btn");
    if (submitBtn) submitBtn.textContent = "Guardar cambios";
    showFormView();
  } catch (err) {
    showFeedback(
      `No se pudo cargar el producto: ${err.message}`,
      "error",
      "admin-list-feedback",
    );
  }
}

function fillFormForEdit(product) {
  const typeRadio = document.querySelector(
    `input[name="type"][value="${product.type}"]`,
  );
  if (typeRadio) typeRadio.checked = true;
  toggleTypeFields(product.type);

  const categorySelect = document.getElementById("field-category");
  if (categorySelect) categorySelect.value = String(product.category_id);
  const brandSelect = document.getElementById("field-brand");
  if (brandSelect) brandSelect.value = String(product.brand_id);
  const genderSelect = document.getElementById("field-gender");
  if (genderSelect) genderSelect.value = String(product.gender_id);

  const nameInput = document.getElementById("field-name");
  if (nameInput) nameInput.value = product.name || "";
  const descInput = document.getElementById("field-description");
  if (descInput) descInput.value = product.description || "";

  populateImageFieldsFromProduct(product.images);

  if (product.type === "original") {
    const priceInput = document.getElementById("field-original-price");
    if (priceInput) priceInput.value = product.original_price ?? "";
    const discountInput = document.getElementById("field-discounted-price");
    if (discountInput) discountInput.value = product.discounted_price ?? "";
    const stockInput = document.getElementById("field-stock");
    if (stockInput) stockInput.value = product.stock ?? 0;
  } else {
    document
      .querySelectorAll("#variants-fields .variant-checkbox")
      .forEach((cb) => {
        cb.checked = false;
      });
    document
      .querySelectorAll("#variants-fields .variant-stock")
      .forEach((input) => {
        input.disabled = true;
        input.value = 0;
      });
    (product.variants || []).forEach((variant) => {
      const checkbox = document.querySelector(
        `#variants-fields .variant-checkbox[data-presentation-id="${variant.presentation_id}"]`,
      );
      const stockInput = document.querySelector(
        `#variants-fields .variant-stock[data-presentation-id="${variant.presentation_id}"]`,
      );
      if (checkbox) checkbox.checked = true;
      if (stockInput) {
        stockInput.disabled = false;
        stockInput.value = variant.stock;
      }
    });
  }
}

// ── Lista de productos ──────────────────────────────────────────────────
function renderProductRow(product) {
  const tr = document.createElement("tr");
  tr.className = "border-b border-gray-700";

  const priceText =
    product.type === "preparado"
      ? `Desde $${Number(product.price || 0).toLocaleString()}`
      : `$${Number(product.price || 0).toLocaleString()}`;
  const stockText = product.type === "preparado" ? "—" : product.stock;

  tr.innerHTML = `
    <td class="py-3 px-3">
      <div class="font-serif">${product.name}</div>
      <div class="text-xs opacity-60">${product.category || ""} · ${product.gender || ""}</div>
    </td>
    <td class="py-3 px-3">${product.brand || ""}</td>
    <td class="py-3 px-3">${product.type === "preparado" ? "Preparado" : "Original"}</td>
    <td class="py-3 px-3">${priceText}</td>
    <td class="py-3 px-3">${stockText}</td>
    <td class="py-3 px-3 text-right" style="white-space: nowrap">
      <button
        class="admin-edit-btn text-(--accent) bg-transparent border-none cursor-pointer font-sans text-sm hover:opacity-90"
        data-id="${product.id}"
      >
        Editar
      </button>
      <span class="opacity-30" style="margin: 0 8px">/</span>
      <button
        class="admin-delete-btn bg-transparent border-none cursor-pointer font-sans text-sm hover:opacity-90"
        style="color: var(--color-red-500)"
        data-id="${product.id}"
        data-name="${product.name}"
      >
        Eliminar
      </button>
    </td>
  `;
  return tr;
}

async function loadProductList(search = "") {
  const tbody = document.getElementById("admin-product-table-body");
  const countLabel = document.getElementById("admin-product-count");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center opacity-60">Cargando...</td></tr>`;

  try {
    const result = await productsApi.getAll({ search, limit: 500 });
    const products = result.data || [];

    if (countLabel) {
      countLabel.textContent = `${result.pagination?.total ?? products.length} producto${products.length === 1 ? "" : "s"}`;
    }

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center opacity-60">No hay productos que coincidan.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    products.forEach((product) => tbody.appendChild(renderProductRow(product)));
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center opacity-60">Error al cargar: ${err.message}</td></tr>`;
  }
}

async function deleteProduct(id, name) {
  if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`))
    return;

  try {
    await productsApi.remove(id);
    showFeedback(`"${name}" eliminado.`, "success", "admin-list-feedback");
    loadProductList(document.getElementById("admin-product-search")?.value || "");
  } catch (err) {
    showFeedback(err.message, "error", "admin-list-feedback");
  }
}

function toggleTypeFields(type) {
  document
    .getElementById("fields-original")
    ?.classList.toggle("hidden", type !== "original");
  document
    .getElementById("fields-preparado")
    ?.classList.toggle("hidden", type !== "preparado");

  const categorySelect = document.getElementById("field-category");
  if (!categorySelect) return;

  if (type === "preparado") {
    if (preparadosCategoryId !== null) {
      categorySelect.value = String(preparadosCategoryId);
    }
    categorySelect.disabled = true;
  } else {
    categorySelect.disabled = false;
  }
}

function getSelectedType() {
  return (
    document.querySelector('input[name="type"]:checked')?.value || "original"
  );
}

function collectVariants() {
  const container = document.getElementById("variants-fields");
  if (!container) return [];

  return Array.from(container.querySelectorAll(".variant-checkbox"))
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => {
      const stockInput = container.querySelector(
        `.variant-stock[data-presentation-id="${checkbox.dataset.presentationId}"]`,
      );
      return {
        presentationId: Number(checkbox.dataset.presentationId),
        stock: Number(stockInput?.value || 0),
      };
    });
}

function buildPayload() {
  const type = getSelectedType();

  const payload = {
    type,
    categoryId: Number(document.getElementById("field-category")?.value),
    brandId: Number(document.getElementById("field-brand")?.value),
    genderId: Number(document.getElementById("field-gender")?.value),
    name: document.getElementById("field-name")?.value?.trim() || "",
    description:
      document.getElementById("field-description")?.value?.trim() || "",
    imageUrls: collectImageUrls(),
  };

  if (type === "original") {
    const originalPrice = Number(
      document.getElementById("field-original-price")?.value,
    );
    const discountedPriceRaw = document.getElementById(
      "field-discounted-price",
    )?.value;

    payload.originalPrice = originalPrice;
    payload.discountedPrice = discountedPriceRaw
      ? Number(discountedPriceRaw)
      : null;
    payload.stock = Number(
      document.getElementById("field-stock")?.value || 0,
    );
  } else {
    payload.variants = collectVariants();
  }

  return payload;
}

// Validación de UX antes de golpear la API — la validación real (incluida
// la matriz sexo/subcategoría) vive en el backend y su mensaje se muestra
// tal cual si igual llega a fallar ahí.
function validatePayload(payload) {
  if (!payload.categoryId || !payload.brandId || !payload.genderId) {
    return "Elige subcategoría, marca y sexo.";
  }
  if (!payload.name) {
    return "El nombre es obligatorio.";
  }
  if (payload.type === "original") {
    if (!payload.originalPrice || payload.originalPrice <= 0) {
      return "El precio debe ser mayor que 0.";
    }
    if (
      payload.discountedPrice !== null &&
      payload.discountedPrice >= payload.originalPrice
    ) {
      return "El precio con descuento debe ser menor que el precio normal.";
    }
  } else if (!payload.variants.length) {
    return "Marca al menos una presentación para el preparado.";
  }
  return null;
}

function resetForm() {
  document.getElementById("admin-product-form")?.reset();
  toggleTypeFields("original");
  renderImageFields();
  document
    .querySelectorAll("#variants-fields .variant-stock")
    .forEach((input) => {
      input.disabled = true;
      input.value = 0;
    });
}

async function loadReferenceData() {
  const [categories, brands, genders, presentations] = await Promise.all([
    categoriesApi.getAll(),
    brandsApi.getAll(),
    gendersApi.getAll(),
    presentationsApi.getAll(),
  ]);

  populateSelect(document.getElementById("field-category"), categories, {
    placeholder: "Elige una subcategoría",
  });
  populateSelect(document.getElementById("field-brand"), brands, {
    placeholder: "Elige una marca",
  });
  populateSelect(document.getElementById("field-gender"), genders, {
    placeholder: "Elige un sexo",
  });
  renderVariantFields(presentations);

  preparadosCategoryId =
    categories.find((c) => c.slug === "preparados")?.id ?? null;
  toggleTypeFields(getSelectedType());
}

// Solo recarga el select de marcas — usado tras crear una marca nueva, sin
// pisar categoría/sexo/presentaciones ni tener que rehacer todo el fetch.
async function reloadBrands(selectSlugId) {
  const brands = await brandsApi.getAll();
  populateSelect(document.getElementById("field-brand"), brands, {
    placeholder: "Elige una marca",
  });
  if (selectSlugId !== undefined) {
    const select = document.getElementById("field-brand");
    if (select) select.value = String(selectSlugId);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  initAnalytics();
  initThemeToggle();
  initUser();
  renderImageFields();
  loadProductList();

  try {
    await loadReferenceData();
  } catch (err) {
    showFeedback(
      `No se pudieron cargar los datos del formulario: ${err.message}`,
      "error",
    );
  }

  document.querySelectorAll('input[name="type"]').forEach((radio) => {
    radio.addEventListener("change", () => toggleTypeFields(radio.value));
  });

  document.getElementById("add-image-btn")?.addEventListener("click", () => {
    document.getElementById("image-fields")?.appendChild(createImageRow());
  });

  // ── Navegación lista ↔ formulario ────────────────────────────────────
  document
    .getElementById("admin-new-product-btn")
    ?.addEventListener("click", startCreate);
  document
    .getElementById("admin-back-to-list-btn")
    ?.addEventListener("click", showListView);

  // ── Búsqueda en la lista (debounced) ─────────────────────────────────
  let searchTimer;
  document
    .getElementById("admin-product-search")
    ?.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadProductList(e.target.value), 300);
    });

  // ── Editar / Eliminar (delegado, las filas se recrean en cada carga) ──
  document
    .getElementById("admin-product-table-body")
    ?.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".admin-edit-btn");
      if (editBtn) {
        startEdit(Number(editBtn.dataset.id));
        return;
      }
      const deleteBtn = e.target.closest(".admin-delete-btn");
      if (deleteBtn) {
        deleteProduct(Number(deleteBtn.dataset.id), deleteBtn.dataset.name);
      }
    });

  // ── "+ Nueva marca" ───────────────────────────────────────────────────
  document
    .getElementById("add-brand-toggle-btn")
    ?.addEventListener("click", () => {
      document.getElementById("add-brand-form")?.classList.remove("hidden");
      document.getElementById("new-brand-name")?.focus();
    });

  document
    .getElementById("confirm-add-brand-btn")
    ?.addEventListener("click", async () => {
      const input = document.getElementById("new-brand-name");
      const name = input?.value?.trim();
      if (!name) return;

      const btn = document.getElementById("confirm-add-brand-btn");
      if (btn) btn.disabled = true;

      try {
        const brand = await brandsApi.create(name);
        await reloadBrands(brand.id);
        if (input) input.value = "";
        document.getElementById("add-brand-form")?.classList.add("hidden");
        showFeedback(`Marca "${brand.name}" agregada.`);
      } catch (err) {
        showFeedback(err.message, "error");
      } finally {
        if (btn) btn.disabled = false;
      }
    });

  // ── Alta / edición de producto ───────────────────────────────────────
  document
    .getElementById("admin-product-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = buildPayload();
      const validationError = validatePayload(payload);
      if (validationError) {
        showFeedback(validationError, "error");
        return;
      }

      const submitBtn = document.getElementById("admin-submit-btn");
      if (submitBtn) submitBtn.disabled = true;

      try {
        if (editingProductId) {
          const product = await productsApi.update(editingProductId, payload);
          showListView();
          showFeedback(
            `Producto "${product.name}" actualizado correctamente.`,
            "success",
            "admin-list-feedback",
          );
        } else {
          const product = await productsApi.create(payload);
          showFeedback(`Producto "${product.name}" creado correctamente.`);
          resetForm();
        }
      } catch (err) {
        showFeedback(err.message, "error");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
});
