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

function showFeedback(message, type = "success") {
  const box = document.getElementById("admin-feedback");
  if (!box) return;

  box.textContent = message;
  box.classList.remove(
    "hidden",
    "bg-green-900/30",
    "text-green-400",
    "bg-red-900/30",
    "text-red-400",
  );
  box.classList.add(
    ...(type === "success"
      ? ["bg-green-900/30", "text-green-400"]
      : ["bg-red-900/30", "text-red-400"]),
  );
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
    imageUrl: document.getElementById("field-image")?.value?.trim() || "",
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

document.addEventListener("DOMContentLoaded", async () => {
  initThemeToggle();
  initUser();

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
        const product = await productsApi.create(payload);
        showFeedback(`Producto "${product.name}" creado correctamente.`);
        resetForm();
      } catch (err) {
        showFeedback(err.message, "error");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
});
