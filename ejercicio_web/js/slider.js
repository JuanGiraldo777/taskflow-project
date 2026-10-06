/**
 * @file ejercicio_web/js/slider.js
 * @description Módulo del slider automático de hero.
 */
/**
 * Inicializa el slider de imágenes del hero.
 * Cambia automáticamente de imagen cada cierto intervalo.
 * @param {number} [intervalMs=5000] - Tiempo en milisegundos entre transiciones.
 */
export function initSlider(intervalMs = 5000) {
  const track = document.querySelector(".slider-track");
  const slides = document.querySelectorAll(".slide");

  if (!track || slides.length === 0) return;

  // Las diapositivas 2 y 3 llevan loading="lazy" en el HTML para no
  // repartirse la conexión con la primera (la que se ve al entrar y es el
  // LCP de la página). Cuando la página terminó de cargar se piden ya, con
  // tiempo de sobra antes del primer cambio de diapositiva.
  const loadRemainingSlides = () =>
    track.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = "eager";
    });
  if (document.readyState === "complete") loadRemainingSlides();
  else window.addEventListener("load", loadRemainingSlides, { once: true });

  let currentIndex = 0;

  setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
  }, intervalMs);
}

