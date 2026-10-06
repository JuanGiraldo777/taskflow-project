/**
 * @file ejercicio_web/js/analytics.js
 * @description Google Analytics 4, cargado SOLO si el visitante aceptó las
 * cookies de análisis (js/consent.js) y SOLO en el dominio real.
 *
 * Antes de aceptar no se descarga nada de Google ni se crea ninguna cookie.
 * Si después rechaza (pie de página → "Configurar cookies"), se desactiva el
 * envío de datos y se borran las cookies _ga. Así lo exige la política de
 * cookies (cookies.html) y la Ley 1581 de datos personales.
 *
 * Eventos que se miden (recomendados de GA4 para tiendas):
 *   view_item · add_to_cart · add_to_wishlist · search · sign_up · login ·
 *   begin_checkout (clic en "Finalizar compra" → WhatsApp: la compra real) ·
 *   generate_lead (botón flotante de consulta por WhatsApp).
 * Para probar fuera del dominio: localStorage.setItem("ga_debug", "1").
 */
export const GA_ID = "G-Q3Q2CGPY5H";
const PRODUCTION_HOSTS = ["maisoneternelleco.com", "www.maisoneternelleco.com"];

let loaded = false;

function allowedHere() {
  if (PRODUCTION_HOSTS.includes(window.location.hostname)) return true;
  try {
    return localStorage.getItem("ga_debug") === "1";
  } catch {
    return false;
  }
}

export function loadAnalytics() {
  window[`ga-disable-${GA_ID}`] = false;
  if (loaded || !allowedHere()) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

/** Corta el envío de datos y borra las cookies de Analytics. */
export function disableAnalytics() {
  window[`ga-disable-${GA_ID}`] = true;
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.replace(/^www\./, "")}`];
  document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((name) => name === "_ga" || name.startsWith("_ga_") || name === "_gid")
    .forEach((name) => {
      domains.forEach((d) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ""}`;
      });
    });
}

/** Envía un evento. Sin consentimiento (o fuera del dominio) no hace nada. */
export function track(name, params = {}) {
  if (!loaded || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

/** Producto en el formato de "items" de GA4. */
export function gaItem(product, extra = {}) {
  return {
    item_id: String(product.id ?? product.product_id ?? ""),
    item_name: product.name,
    ...(product.brand && { item_brand: product.brand }),
    ...(product.category && { item_category: product.category }),
    ...(product.price != null && { price: Number(product.price) }),
    ...extra,
  };
}

// Botón flotante "Consultar por WhatsApp" (las 3 páginas lo tienen en el
// HTML). El de "Finalizar compra" no es un enlace: lo mide cart.js.
document.addEventListener("click", (e) => {
  if (e.target.closest?.(".whatsapp-float-btn")) {
    track("generate_lead", { method: "whatsapp" });
  }
});
