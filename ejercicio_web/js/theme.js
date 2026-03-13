/**
 * Inicializa el cambio de tema (modo oscuro/claro).
 * Aplica el tema guardado en localStorage y escucha clics en el botón de alternancia.
 */
export function initThemeToggle() {
  const toggleButton = document.getElementById("darkModeToggle");
  if (!toggleButton) return;

  toggleButton.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("light-mode") ? "light" : "dark"
    );
  });

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }
}

