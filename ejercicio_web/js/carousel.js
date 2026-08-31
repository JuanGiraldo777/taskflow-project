/**
 * @file ejercicio_web/js/carousel.js
 * @description Carrusel horizontal con flechas + auto-scroll para las
 * secciones de producto del home (Originales, Preparados). El scroll
 * táctil nativo sigue funcionando igual — flechas y autoplay son un
 * atajo, no un reemplazo. El autoplay se pausa mientras el usuario
 * interactúa (mouse, teclado o touch) y respeta prefers-reduced-motion.
 */
const AUTOPLAY_INTERVAL_MS = 3500;

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

  // Si no hay overflow (pocos productos), no tiene sentido mostrar
  // flechas ni prender el autoplay.
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

// Avanza un paso; si ya está (casi) al final, vuelve al inicio para que
// el recorrido se sienta continuo en vez de quedarse pegado en el borde.
function advanceOrLoop(track) {
  const maxScroll = track.scrollWidth - track.clientWidth;
  if (track.scrollLeft >= maxScroll - 4) {
    track.scrollTo({ left: 0, behavior: "smooth" });
  } else {
    scrollTrack(track, 1);
  }
}

// Un timer de autoplay por carrusel, guardado en el propio elemento del
// wrapper — no hace falta un Map aparte para algo tan puntual.
function stopAutoplay(wrapper) {
  if (wrapper._autoplayTimer) {
    clearInterval(wrapper._autoplayTimer);
    wrapper._autoplayTimer = null;
  }
}

function startAutoplay(wrapper, track) {
  stopAutoplay(wrapper);

  if (prefersReducedMotion()) return;
  if (document.hidden) return;
  if (track.scrollWidth - track.clientWidth <= 4) return; // nada que recorrer

  wrapper._autoplayTimer = setInterval(() => advanceOrLoop(track), AUTOPLAY_INTERVAL_MS);
}

export function initCarousels() {
  const wrappers = document.querySelectorAll(".carousel-wrapper");

  wrappers.forEach((wrapper) => {
    const track = wrapper.querySelector(".carousel-track");
    const leftBtn = wrapper.querySelector(".carousel-arrow-left");
    const rightBtn = wrapper.querySelector(".carousel-arrow-right");
    if (!track) return;

    const restart = () => startAutoplay(wrapper, track);

    leftBtn?.addEventListener("click", () => {
      scrollTrack(track, -1);
      restart();
    });
    rightBtn?.addEventListener("click", () => {
      scrollTrack(track, 1);
      restart();
    });

    track.addEventListener("scroll", () => updateArrowState(track));

    // Pausar mientras el usuario interactúa — sin esto sería imposible
    // leer una tarjeta o alcanzar a hacer click antes de que se mueva.
    wrapper.addEventListener("mouseenter", () => stopAutoplay(wrapper));
    wrapper.addEventListener("mouseleave", restart);
    wrapper.addEventListener("focusin", () => stopAutoplay(wrapper));
    wrapper.addEventListener("focusout", (e) => {
      if (!wrapper.contains(e.relatedTarget)) restart();
    });
    track.addEventListener("touchstart", () => stopAutoplay(wrapper), {
      passive: true,
    });
    track.addEventListener("touchend", restart, { passive: true });

    updateArrowState(track);
    startAutoplay(wrapper, track);
  });

  // Pausar todos los carruseles si la pestaña no está visible — ahorra
  // trabajo en segundo plano y evita que al volver "salten" varias
  // posiciones de golpe.
  document.addEventListener("visibilitychange", () => {
    wrappers.forEach((wrapper) => {
      const track = wrapper.querySelector(".carousel-track");
      if (!track) return;
      if (document.hidden) {
        stopAutoplay(wrapper);
      } else {
        startAutoplay(wrapper, track);
      }
    });
  });

  // Los grids se llenan de forma asíncrona (fetchSection) — antes de eso
  // scrollWidth todavía es 0, así que hay que reevaluar flechas y reiniciar
  // el autoplay cada vez que cambia el contenido.
  window.addEventListener("products-rendered", () => {
    wrappers.forEach((wrapper) => {
      const track = wrapper.querySelector(".carousel-track");
      if (!track) return;
      updateArrowState(track);
      startAutoplay(wrapper, track);
    });
  });
}
