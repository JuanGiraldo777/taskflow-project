/**
 * Inicializa la barra de navegación y el menú lateral.
 * Se encarga de abrir/cerrar el menú y mostrar/ocultar el overlay.
 */
export function initNav() {
  const threebars = document.getElementById("threebars");
  const sideMenu = document.getElementById("sideMenu");
  const overlay = document.getElementById("overlay");

  if (!threebars || !sideMenu || !overlay) return;

  threebars.addEventListener("click", () => {
    sideMenu.classList.add("active");
    overlay.classList.add("active");
  });

  overlay.addEventListener("click", () => {
    sideMenu.classList.remove("active");
    overlay.classList.remove("active");
  });
}

