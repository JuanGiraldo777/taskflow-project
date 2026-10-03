/**
 * @file ejercicio_web/js/seo.js
 * @description Título y descripción de la página según lo que se está viendo
 * (un perfume, una categoría, una búsqueda).
 *
 * Google ejecuta el JavaScript y lee estos valores. Para WhatsApp/Instagram/
 * Facebook, que NO ejecutan JavaScript, la ficha de producto recibe además
 * los mismos datos desde el servidor (worker/index.js en Cloudflare).
 */
const SITE_NAME = "Maison Eternelle";
const MAX_DESCRIPTION = 155;

/** Recorta en el último espacio antes del límite y agrega "…". */
export function truncate(text, max = MAX_DESCRIPTION) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:—-]+$/, "")}…`;
}

function setMeta(selector, attr, name, content) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * @param {object} meta
 * @param {string} meta.title  Sin el nombre de la tienda: se agrega solo.
 * @param {string} [meta.description]
 */
export function setPageMeta({ title, description }) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  document.title = fullTitle;
  setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
  if (description) {
    const desc = truncate(description);
    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:description"]', "property", "og:description", desc);
  }
}

/** Descripción de un producto: su propio texto, o una frase armada con sus datos. */
export function productDescription(product) {
  if (product.description) return product.description;
  const kind =
    product.type === "preparado"
      ? "Preparado disponible en 1 oz, 3 oz y combos"
      : "Perfume original";
  const brand = product.brand ? ` de ${product.brand}` : "";
  return `${product.name}${brand}. ${kind} en Maison Eternelle, con envío a toda Colombia y pedidos por WhatsApp.`;
}
