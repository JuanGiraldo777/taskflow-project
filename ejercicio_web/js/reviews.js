const REVIEWS_STORAGE_KEY = "maison-reviews";

function getReviewsFromStorage() {
  const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveReviewsToStorage(reviews) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

function generateStars(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

function validateReview(name, rating, comment) {
  if (!name.trim()) {
    alert("Por favor, ingresa tu nombre");
    return false;
  }
  if (!rating || rating < 1 || rating > 5) {
    alert("Por favor, selecciona una puntuación de 1 a 5");
    return false;
  }
  if (!comment.trim()) {
    alert("Por favor, escribe un comentario");
    return false;
  }
  return true;
}

export function addReview(name, rating, comment) {
  if (!validateReview(name, rating, comment)) {
    return;
  }

  const reviews = getReviewsFromStorage();
  const newReview = {
    id: Date.now(),
    name: name.trim(),
    rating: parseInt(rating),
    comment: comment.trim(),
    date: new Date().toISOString(),
  };

  reviews.unshift(newReview);
  saveReviewsToStorage(reviews);
  renderReviews();
}

function renderReviewForm() {
  const reviewsSection = document.getElementById("reviews-section");
  if (!reviewsSection) return;

  const formContainer = reviewsSection.querySelector(".reviews-form-container");
  if (!formContainer) return;

  formContainer.innerHTML = `
    <div class="bg-(--card-bg) p-8 rounded-xl border border-(--accent) border-opacity-30">
      <h3 class="font-serif text-2xl text-(--text) mb-6 tracking-wide">
        ESCRIBE TU RESEÑA
      </h3>

      <form id="review-form" class="space-y-4">
        <!-- Nombre -->
        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">
            Tu Nombre
          </label>
          <input
            type="text"
            id="review-name"
            placeholder="Ingresa tu nombre"
            class="w-full px-4 py-3 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded-lg focus:outline-none focus:border-(--accent) focus:border-opacity-100 transition-colors duration-200 placeholder-opacity-50"
          />
        </div>

        <!-- Puntuación -->
        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">
            Puntuación
          </label>
          <div class="flex gap-3">
            ${[1, 2, 3, 4, 5]
              .map(
                (star) => `
              <input
                type="radio"
                id="star-${star}"
                name="rating"
                value="${star}"
                class="hidden"
              />
              <label
                for="star-${star}"
                class="cursor-pointer text-4xl transition-all duration-200 hover:text-(--accent) text-opacity-60 hover:text-opacity-100"
              >
                ★
              </label>
            `
              )
              .join("")}
          </div>
          <div id="rating-display" class="text-sm text-(--text) mt-2 opacity-70"></div>
        </div>

        <!-- Comentario -->
        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">
            Tu Comentario
          </label>
          <textarea
            id="review-comment"
            placeholder="Cuéntanos tu experiencia con este perfume..."
            rows="5"
            class="w-full px-4 py-3 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded-lg focus:outline-none focus:border-(--accent) focus:border-opacity-100 transition-colors duration-200 placeholder-opacity-50 resize-none"
          ></textarea>
        </div>

        <!-- Botón Enviar -->
        <button
          type="submit"
          class="w-full mt-6 px-6 py-3 bg-(--accent) text-black font-serif font-bold text-lg rounded-lg transition-all duration-200 hover:opacity-90 active:scale-95 cursor-pointer"
        >
          ENVIAR RESEÑA
        </button>
      </form>
    </div>
  `;

  // Event Listeners para estrellas
  const stars = document.querySelectorAll("input[name='rating']");
  const ratingDisplay = document.getElementById("rating-display");

  stars.forEach((star) => {
    star.addEventListener("change", () => {
      ratingDisplay.textContent = generateStars(parseInt(star.value));
    });

    star.addEventListener("mouseover", () => {
      ratingDisplay.textContent = generateStars(parseInt(star.value));
    });
  });

  document.addEventListener("mouseleave", () => {
    const checked = document.querySelector("input[name='rating']:checked");
    if (checked) {
      ratingDisplay.textContent = generateStars(parseInt(checked.value));
    } else {
      ratingDisplay.textContent = "";
    }
  });

  // Form submission
  const form = document.getElementById("review-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("review-name").value;
    const rating = document.querySelector("input[name='rating']:checked")?.value;
    const comment = document.getElementById("review-comment").value;

    addReview(name, rating, comment);

    // Limpiar formulario
    form.reset();
    ratingDisplay.textContent = "";
  });
}

function renderReviewsList() {
  const reviewsSection = document.getElementById("reviews-section");
  if (!reviewsSection) return;

  const reviews = getReviewsFromStorage();
  const listContainer = reviewsSection.querySelector(".reviews-list-container");
  if (!listContainer) return;

  const averageRating = calculateAverageRating(reviews);

  let html = `
    <div class="mb-8">
      <h3 class="font-serif text-2xl text-(--text) mb-4 tracking-wide">
        RESEÑAS DE CLIENTES
      </h3>
      <div class="flex items-center gap-4 text-(--text)">
        <div class="text-4xl font-serif">
          ${averageRating > 0 ? averageRating : "Sin reseñas"}
        </div>
        ${
          averageRating > 0
            ? `<div>
                <div class="text-2xl text-(--accent)">
                  ${generateStars(Math.round(averageRating))}
                </div>
                <div class="text-sm opacity-70">
                  Basado en ${reviews.length} reseña${reviews.length !== 1 ? "s" : ""}
                </div>
              </div>`
            : ""
        }
      </div>
    </div>
  `;

  if (reviews.length === 0) {
    html += `
      <div class="text-center py-12">
        <p class="text-(--text) opacity-60 font-sans">
          No hay reseñas aún. ¡Sé el primero en dejar una!
        </p>
      </div>
    `;
  } else {
    html += `
      <div class="space-y-4">
        ${reviews
          .map((review) => {
            const date = new Date(review.date);
            const formattedDate = date.toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return `
              <div class="bg-(--card-bg) p-6 rounded-lg border border-(--text) border-opacity-20 hover:border-opacity-40 transition-all duration-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h4 class="font-serif text-lg text-(--text)">
                      ${review.name}
                    </h4>
                    <div class="text text-(--accent) text-lg mt-1">
                      ${generateStars(review.rating)}
                    </div>
                  </div>
                  <span class="text-xs text-(--text) opacity-60">
                    ${formattedDate}
                  </span>
                </div>
                <p class="text-(--text) font-sans opacity-90 leading-relaxed">
                  ${review.comment}
                </p>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  listContainer.innerHTML = html;
}

export function renderReviews() {
  const reviewsSection = document.getElementById("reviews-section");
  if (!reviewsSection) return;

  renderReviewForm();
  renderReviewsList();
}
