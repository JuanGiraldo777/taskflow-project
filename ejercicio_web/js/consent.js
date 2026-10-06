/**
 * @file ejercicio_web/js/consent.js
 * @description Aviso de cookies: el visitante elige si permite la analítica.
 *
 * - "Aceptar" y "Rechazar" tienen el mismo tamaño y estilo: rechazar no
 *   puede ser más difícil que aceptar.
 * - La elección se guarda en localStorage ("cookie_consent") con la fecha y
 *   se vuelve a preguntar a los 12 meses.
 * - El enlace "Configurar cookies" del pie de página vuelve a abrir el aviso.
 * - Las cookies técnicas (sesión, tema, esta misma elección) no necesitan
 *   permiso: sin ellas la tienda no funciona. Ver cookies.html.
 */
import { loadAnalytics, disableAnalytics } from "./analytics.js";

const STORAGE_KEY = "cookie_consent";
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const BANNER_ID = "cookie-consent";

/** "granted" | "denied" | null (sin elegir, o la elección venció). */
export function getConsent() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || !saved.at || !["granted", "denied"].includes(saved.value)) return null;
    if (Date.now() - Date.parse(saved.at) > MAX_AGE_MS) return null;
    return saved.value;
  } catch {
    return null;
  }
}

function saveConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, at: new Date().toISOString(), v: 1 }));
  } catch {
    // Almacenamiento bloqueado (navegación privada estricta): vale solo para esta visita.
  }
}

function hideBanner() {
  document.getElementById(BANNER_ID)?.remove();
  document.body.classList.remove("has-consent-banner");
  document.documentElement.style.removeProperty("--consent-banner-h");
}

function choose(value) {
  saveConsent(value);
  hideBanner();
  if (value === "granted") loadAnalytics();
  else disableAnalytics();
}

function showBanner() {
  if (document.getElementById(BANNER_ID)) return;
  const banner = document.createElement("section");
  banner.id = BANNER_ID;
  banner.className = "consent-banner";
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Aviso de cookies");
  banner.innerHTML = `
    <p class="consent-text">
      Usamos cookies de análisis (Google Analytics) para saber qué perfumes
      interesan más y mejorar la tienda. Solo se activan si aceptas.
      <a href="/cookies.html">Política de cookies</a>
    </p>
    <div class="consent-actions">
      <button type="button" class="consent-btn" data-consent="denied">Rechazar</button>
      <button type="button" class="consent-btn" data-consent="granted">Aceptar</button>
    </div>
  `;
  banner.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-consent]");
    if (btn) choose(btn.dataset.consent);
  });
  document.body.appendChild(banner);
  document.body.classList.add("has-consent-banner");
  // El botón flotante de WhatsApp sube lo que mida el aviso (ver style.css).
  const syncHeight = () =>
    document.documentElement.style.setProperty("--consent-banner-h", `${banner.offsetHeight}px`);
  syncHeight();
  window.addEventListener("resize", syncHeight, { passive: true });
}

export function initConsent() {
  const consent = getConsent();
  if (consent === "granted") loadAnalytics();
  else if (consent === null) showBanner();

  // Pie de página → "Configurar cookies": vuelve a mostrar el aviso.
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-cookie-settings]")) {
      e.preventDefault();
      showBanner();
      document.querySelector(`#${BANNER_ID} .consent-btn`)?.focus();
    }
  });
}

initConsent();
