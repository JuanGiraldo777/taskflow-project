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

  let currentIndex = 0;

  setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
  }, intervalMs);
}

