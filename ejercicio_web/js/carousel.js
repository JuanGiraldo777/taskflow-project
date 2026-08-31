/**
 * @file ejercicio_web/js/carousel.js
 * @description Carrusel horizontal con flechas para las secciones de
 * producto del home (Originales, Preparados). El scroll táctil nativo
 * sigue funcionando igual — las flechas son un atajo, no un reemplazo.
 */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function updateArrowState(track) {
  const wrapper = track.closest(".carousel-wrapper");
  if (!wrapper) return;

  const leftBtn = wrapper.querySelector(".carousel-arrow-left");
  const rightBtn = wrapper.querySelector(".carousel-arrow-right");
  if (!leftBtn || !rightBtn) return;

  const maxScroll = track.scrollWidth - track.clientWidth;

  // Si no hay overflow (pocos productos), no tiene sentido mostrar flechas.
  if (maxScroll <= 4) {
    leftBtn.style.display = "none";
    rightBtn.style.display = "none";
    return;
  }
  leftBtn.style.display = "";
  rightBtn.style.display = "";

  leftBtn.disabled = track.scrollLeft <= 4;
  rightBtn.disabled = track.scrollLeft >= maxScroll - 4;
}

function scrollTrack(track, direction) {
  const card = track.querySelector(".product-card");
  const cardWidth = card ? card.getBoundingClientRect().width : 260;
  const trackGap = parseFloat(getComputedStyle(track).columnGap || "24") || 24;
  const amount = (cardWidth + trackGap) * 2 * direction;

  track.scrollBy({
    left: amount,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

export function initCarousels() {
  document.querySelectorAll(".carousel-wrapper").forEach((wrapper) => {
    const track = wrapper.querySelector(".carousel-track");
    const leftBtn = wrapper.querySelector(".carousel-arrow-left");
    const rightBtn = wrapper.querySelector(".carousel-arrow-right");
    if (!track) return;

    leftBtn?.addEventListener("click", () => scrollTrack(track, -1));
    rightBtn?.addEventListener("click", () => scrollTrack(track, 1));

    track.addEventListener("scroll", () => updateArrowState(track));
    updateArrowState(track);
  });

  // Los grids se llenan de forma asíncrona (fetchSection) — hay que
  // reevaluar el estado de las flechas cada vez que cambia el contenido.
  window.addEventListener("products-rendered", () => {
    document
      .querySelectorAll(".carousel-track")
      .forEach((track) => updateArrowState(track));
  });
}
