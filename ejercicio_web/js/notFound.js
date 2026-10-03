/**
 * @file ejercicio_web/js/notFound.js
 * @description Estado "no encontrado" de la marca: frasco de perfume con un
 * signo de interrogación + "ESTO ME HUELE A QUE NO HAY NINGÚN RESULTADO".
 *
 * Se usa en tres lugares, para que el mensaje sea siempre el mismo:
 * - 404.html (cualquier URL que no existe; tiene su propia copia estática
 *   del mismo marcado porque debe verse aunque falle el JavaScript),
 * - producto.html cuando el perfume no existe o falta ?id=,
 * - el catálogo/buscador cuando una búsqueda o filtro no devuelve nada.
 *
 * El dibujo es SVG en línea (~2 KB, nítido en cualquier pantalla) y usa
 * currentColor: toma el dorado de --accent-text, legible en ambos temas.
 */
import { escapeHtml } from "./escape.js";

export const NOT_FOUND_TITLE = "ESTO ME HUELE A QUE NO HAY NINGÚN RESULTADO";

export const BOTTLE_SVG = `
  <svg class="not-found-bottle" viewBox="0 0 200 250" width="170" height="212"
       aria-hidden="true" focusable="false" fill="none">
    <!-- estela de aroma saliendo del atomizador -->
    <g class="not-found-scent" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".55">
      <path d="M128 30c10-6 18-2 22 6" />
      <path d="M134 16c12-8 24-4 30 6" />
      <circle cx="170" cy="40" r="3.5" fill="currentColor" stroke="none" />
      <circle cx="160" cy="54" r="2.5" fill="currentColor" stroke="none" />
    </g>
    <!-- tapa y cuello -->
    <rect x="78" y="22" width="44" height="34" rx="5" fill="currentColor" />
    <rect x="86" y="14" width="28" height="10" rx="3" fill="currentColor" opacity=".7" />
    <rect x="90" y="56" width="20" height="14" fill="currentColor" opacity=".8" />
    <!-- frasco -->
    <rect x="34" y="70" width="132" height="166" rx="26" fill="currentColor" fill-opacity=".08"
          stroke="currentColor" stroke-width="6" />
    <!-- líquido -->
    <path d="M40 176c20-10 40-10 60 0s40 10 60 0v34a20 20 0 0 1-20 20H60a20 20 0 0 1-20-20z"
          fill="currentColor" fill-opacity=".22" />
    <!-- brillo del vidrio -->
    <path d="M52 96v60" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".35" />
    <!-- signo de interrogación -->
    <text x="104" y="190" text-anchor="middle" fill="currentColor"
          font-family="'Playfair Display', Georgia, serif" font-size="104" font-weight="700">?</text>
  </svg>
`;

/**
 * Marcado del estado "no encontrado".
 * @param {object} [opts]
 * @param {string} [opts.detail] Frase secundaria (texto plano, se escapa).
 * @param {string} [opts.basePath] Prefijo de los enlaces ("" o "/" en 404.html).
 * @param {boolean} [opts.headingLevel1] true → <h1> (página propia); false → <h2>.
 */
export function notFoundHtml({ detail = "", basePath = "", headingLevel1 = false } = {}) {
  const tag = headingLevel1 ? "h1" : "h2";
  return `
    <div class="not-found" role="status">
      ${BOTTLE_SVG}
      <${tag} class="not-found-title">${NOT_FOUND_TITLE}</${tag}>
      ${detail ? `<p class="not-found-detail">${escapeHtml(detail)}</p>` : ""}
      <div class="not-found-actions">
        <a href="${basePath}catalogo.html" class="not-found-btn not-found-btn-primary">Ver catálogo</a>
        <a href="${basePath}index.html" class="not-found-btn">Ir al inicio</a>
      </div>
    </div>
  `;
}
