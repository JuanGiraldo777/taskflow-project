/**
 * @file ejercicio_web/js/theme.js
 * @description Módulo de alternancia de tema y persistencia visual.
 *
 * Tema por defecto: CLARO (desde 2026-09-25). Solo cambia lo que ve quien
 * nunca eligió un tema — quien ya tocó el switch conserva su elección
 * guardada en localStorage ("dark" | "light").
 *
 * La clase light-mode se aplica ANTES del primer pintado con un <script>
 * inline justo después de <body> en cada página (este módulo carga tarde,
 * con type="module"): sin eso, todo visitante nuevo veía un parpadeo
 * oscuro → claro en cada carga. Si cambias la regla de "qué tema toca",
 * cámbiala también en ese script inline de index/catalogo/producto/admin.
 *
 * El logo del header (#main-logo) ya NO cambia con el tema: el header
 * usa el mismo degradado dorado en los dos modos, y el logo blanco que
 * usaba el modo claro quedaba ilegible sobre la parte crema del degradado.
 * Va el logo negro en ambos, igual que los íconos del header (ver
 * .top-bar en output.css).
 */

/**
 * Refleja el estado actual en el switch (thumb a la derecha = oscuro,
 * a la izquierda = claro) vía aria-checked — el CSS del componente
 * (.theme-switch) hace el resto con un selector de atributo.
 */
function updateSwitchVisual(toggleButton, isDarkMode) {
  toggleButton.setAttribute("aria-checked", String(isDarkMode));
}

/**
 * Inicializa el cambio de tema (modo oscuro/claro).
 * Aplica el tema guardado en localStorage y escucha clics en el botón de alternancia.
 */
export function initThemeToggle() {
  const toggleButton = document.getElementById("darkModeToggle");
  if (!toggleButton) return;

  // Al hacer clic en el botón de tema
  toggleButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light-mode");
    const isDarkMode = !isLightMode;

    // Guardar tema en localStorage
    try {
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    } catch {
      // Navegación privada / storage bloqueado: el cambio vale para esta visita.
    }

    updateSwitchVisual(toggleButton, isDarkMode);
  });

  // Aplicar el tema guardado al cargar la página. Solo "dark" explícito
  // da modo oscuro; sin preferencia guardada, claro.
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem("theme");
  } catch {
    savedTheme = null;
  }
  const isDarkMode = savedTheme === "dark";

  document.body.classList.toggle("light-mode", !isDarkMode);
  updateSwitchVisual(toggleButton, isDarkMode);
}
