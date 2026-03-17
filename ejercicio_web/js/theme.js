/**
 * Actualiza el logo del header según el tema activo
 */
function updateLogoForTheme(isDarkMode) {
  const mainLogo = document.getElementById("main-logo");
  if (!mainLogo) return;

  if (isDarkMode) {
    mainLogo.src = "assets/imgs/LOGO_PRINCIPAL_NEGRO.png";
  } else {
    mainLogo.src = "assets/imgs/LOGO_PRINCIPAL_BLANCO.png";
  }
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
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");

    // Actualizar logo según el nuevo tema
    updateLogoForTheme(isDarkMode);
  });

  // Aplicar el tema guardado al cargar la página
  const savedTheme = localStorage.getItem("theme");
  const isDarkMode = savedTheme !== "light";

  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }

  // Establecer el logo correcto según el tema activo
  // Esto se hace ANTES de que se renderice la página para evitar parpadeos
  updateLogoForTheme(isDarkMode);
}
