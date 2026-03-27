/**
 * @file ejercicio_web/js/nav.js
 * @description Módulo de navegación y control del menú lateral.
 */
/**
 * Inicializa la barra de navegación y el menú lateral.
 * Se encarga de abrir/cerrar el menú de forma completamente autónoma,
 * sin dependencias de otros módulos (filters.js, cart.js, wishlist.js, etc).
 */
export function initNav() {
  const threebars = document.getElementById("threebars");
  const sideMenu = document.getElementById("sideMenu");
  const overlay = document.getElementById("overlay");

  if (!threebars || !sideMenu || !overlay) return;

  /**
   * Abre el menú lateral cuando se hace click en el botón threebars.
   * Solo abre, no toggle, para evitar comportamientos inesperados.
   */
  threebars.addEventListener("click", (e) => {
    e.stopPropagation();
    sideMenu.classList.add("active");
    overlay.classList.add("active");
  });

  /**
   * Listener global en document para detectar clicks fuera del menú.
   * Cierra el menú si el click fue:
   * - Fuera del sideMenu Y
   * - Fuera del botón threebars
   *
   * Este patrón es autónomo y NO depende del estado de otros elementos
   * ni interfiere con otros módulos (filters.js, etc).
   */
  document.addEventListener("click", (e) => {
    // Solo actúa si el menú está abierto
    if (!sideMenu.classList.contains("active")) return;

    // Comprobar si el click fue fuera del menú Y fuera del botón
    const clickFueraDelMenu = !sideMenu.contains(e.target);
    const clickFueraDelBoton = !threebars.contains(e.target);

    // Si ambas condiciones son true, cerrar el menú
    if (clickFueraDelMenu && clickFueraDelBoton) {
      sideMenu.classList.remove("active");
      overlay.classList.remove("active");
    }
  });
}
