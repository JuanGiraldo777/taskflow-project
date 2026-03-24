import { reviewsApi } from "./api/client.js";
import { getUserName, getUserRecommendation } from "./user.js";

const PRODUCT_ID =
  new URLSearchParams(window.location.search).get("id") || 1;

let reviewsState = [];

function generateStars(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + Number(review.rating), 0);
  return (sum / reviews.length).toFixed(1);
}

function validateReviewForm(name, rating, comment) {
  const errors = {};

  if (!name.trim()) {
    errors.name = "Por favor, ingresa tu nombre";
  }

  if (!rating || rating < 1 || rating > 5) {
    errors.rating = "Por favor, selecciona una puntuación de 1 a 5";
  }

  if (!comment.trim()) {
    errors.comment = "Por favor, escribe un comentario";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function showValidationErrors(errors) {
  const previousErrors = document.querySelectorAll(".field-error");
  previousErrors.forEach((el) => el.remove());

  const previousErrorFields = document.querySelectorAll(
    "input[id='review-name'], textarea[id='review-comment'], .rating-group",
  );
  previousErrorFields.forEach((el) => {
    el.style.borderColor = "";
    el.classList.remove("border-red-500");
  });

  let firstErrorElement = null;

  if (errors.name) {
    const nameInput = document.getElementById("review-name");
    if (nameInput) {
      nameInput.style.borderColor = "var(--accent)";
      nameInput.style.borderWidth = "2px";
      if (!firstErrorElement) firstErrorElement = nameInput;

      const errorDiv = document.createElement("div");
      errorDiv.className = "field-error";
      errorDiv.style.color = "var(--accent)";
      errorDiv.style.fontSize = "0.75rem";
      errorDiv.style.marginTop = "0.25rem";
      errorDiv.textContent = errors.name;
      nameInput.parentElement.appendChild(errorDiv);
    }
  }

  if (errors.rating) {
    const ratingGroup = document.querySelector(".rating-group");
    if (ratingGroup) {
      ratingGroup.style.borderColor = "var(--accent)";
      ratingGroup.style.borderWidth = "2px";
      ratingGroup.style.borderRadius = "0.5rem";
      ratingGroup.style.padding = "0.5rem";
      ratingGroup.style.borderStyle = "solid";
      if (!firstErrorElement) {
        firstErrorElement = document.querySelector("input[name='rating']");
      }

      const errorDiv = document.createElement("div");
      errorDiv.className = "field-error";
      errorDiv.style.color = "var(--accent)";
      errorDiv.style.fontSize = "0.75rem";
      errorDiv.style.marginTop = "0.25rem";
      errorDiv.textContent = errors.rating;
      ratingGroup.parentElement.appendChild(errorDiv);
    }
  }

  if (errors.comment) {
    const commentInput = document.getElementById("review-comment");
    if (commentInput) {
      commentInput.style.borderColor = "var(--accent)";
      commentInput.style.borderWidth = "2px";
      if (!firstErrorElement) firstErrorElement = commentInput;

      const errorDiv = document.createElement("div");
      errorDiv.className = "field-error";
      errorDiv.style.color = "var(--accent)";
      errorDiv.style.fontSize = "0.75rem";
      errorDiv.style.marginTop = "0.25rem";
      errorDiv.textContent = errors.comment;
      commentInput.parentElement.appendChild(errorDiv);
    }
  }

  if (firstErrorElement) {
    firstErrorElement.focus();
  }
}

function clearValidationErrors() {
  const errorMessages = document.querySelectorAll(".field-error");
  errorMessages.forEach((el) => el.remove());

  const nameInput = document.getElementById("review-name");
  if (nameInput) {
    nameInput.style.borderColor = "";
    nameInput.style.borderWidth = "";
  }

  const ratingGroup = document.querySelector(".rating-group");
  if (ratingGroup) {
    ratingGroup.style.borderColor = "";
    ratingGroup.style.borderWidth = "";
    ratingGroup.style.borderRadius = "";
    ratingGroup.style.padding = "";
    ratingGroup.style.borderStyle = "";
  }

  const commentInput = document.getElementById("review-comment");
  if (commentInput) {
    commentInput.style.borderColor = "";
    commentInput.style.borderWidth = "";
  }
}

async function loadReviews() {
  try {
    reviewsState = await reviewsApi.getByProduct(PRODUCT_ID);
    renderReviewsList(reviewsState);
  } catch (err) {
    console.error("Error al cargar reseñas:", err);
  }
}

async function addReview(name, rating, comment) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Inicia sesión para dejar una reseña");
    return;
  }

  const validation = validateReviewForm(name, rating, comment);
  if (!validation.isValid) {
    showValidationErrors(validation.errors);
    return;
  }

  clearValidationErrors();

  try {
    const result = await reviewsApi.create(PRODUCT_ID, {
      rating: parseInt(rating, 10),
      comment: comment.trim(),
    });

    if (result.discountCode) {
      alert(
        `¡Gracias por tu reseña! Tu código de descuento: ${result.discountCode}`,
      );

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.discountCode = result.discountCode;
      localStorage.setItem("user", JSON.stringify(user));
    }

    await loadReviews();

    const form = document.getElementById("review-form");
    if (form) {
      form.reset();
      const ratingDisplay = document.getElementById("rating-display");
      if (ratingDisplay) {
        ratingDisplay.textContent = "";
      }
    }
  } catch (err) {
    alert(err.message);
  }
}

function renderReviewForm() {
  const reviewsSection = document.getElementById("reviews-section");
  if (!reviewsSection) return;

  const formContainer = reviewsSection.querySelector(".reviews-form-container");
  if (!formContainer) return;

  const userName = getUserName() || "";

  formContainer.innerHTML = `
    <div class="bg-(--card-bg) p-8 rounded-xl border border-(--accent) border-opacity-30">
      <h3 class="font-serif text-2xl text-(--text) mb-6 tracking-wide">
        ESCRIBE TU RESEÑA
      </h3>

      <form id="review-form" class="space-y-4">
        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">
            Tu Nombre
          </label>
          <input
            type="text"
            id="review-name"
            placeholder="Ingresa tu nombre"
            value="${userName}"
            class="w-full px-4 py-3 bg-(--bg) text-(--text) border border-(--text) border-opacity-50 rounded-lg focus:outline-none focus:border-(--accent) focus:border-opacity-100 transition-colors duration-200 placeholder-opacity-50"
          />
        </div>

        <div>
          <label class="block text-sm text-(--text) font-sans font-semibold mb-2">
            Puntuación
          </label>
          <div class="rating-group flex gap-3">
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
            `,
              )
              .join("")}
          </div>
          <div id="rating-display" class="text-sm text-(--text) mt-2 opacity-70"></div>
        </div>

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

        <button
          type="submit"
          class="w-full mt-6 px-6 py-3 bg-(--accent) text-black font-serif font-bold text-lg rounded-lg transition-all duration-200 hover:opacity-90 active:scale-95 cursor-pointer"
        >
          ENVIAR RESEÑA
        </button>
      </form>
    </div>
  `;

  const stars = document.querySelectorAll("input[name='rating']");
  const ratingDisplay = document.getElementById("rating-display");
  const nameInput = document.getElementById("review-name");
  const commentInput = document.getElementById("review-comment");

  nameInput?.addEventListener("input", () => {
    nameInput.style.borderColor = "";
    nameInput.style.borderWidth = "";
    const errorMsg = nameInput.parentElement.querySelector(".field-error");
    if (errorMsg && errorMsg.textContent.includes("nombre")) {
      errorMsg.remove();
    }
  });

  commentInput?.addEventListener("input", () => {
    commentInput.style.borderColor = "";
    commentInput.style.borderWidth = "";
    const errorMsg = commentInput.parentElement.querySelector(".field-error");
    if (errorMsg && errorMsg.textContent.includes("comentario")) {
      errorMsg.remove();
    }
  });

  stars.forEach((star) => {
    star.addEventListener("change", () => {
      const ratingGroup = document.querySelector(".rating-group");
      if (ratingGroup) {
        ratingGroup.style.borderColor = "";
        ratingGroup.style.borderWidth = "";
        ratingGroup.style.borderRadius = "";
        ratingGroup.style.padding = "";
        ratingGroup.style.borderStyle = "";
      }

      const errorMsgs =
        ratingGroup?.parentElement?.querySelectorAll(".field-error");
      errorMsgs?.forEach((msg) => {
        if (
          msg.textContent.includes("Puntuación") ||
          msg.textContent.includes("selecciona una puntuación")
        ) {
          msg.remove();
        }
      });

      ratingDisplay.textContent = generateStars(parseInt(star.value, 10));
    });

    star.addEventListener("mouseover", () => {
      ratingDisplay.textContent = generateStars(parseInt(star.value, 10));
    });
  });

  const ratingGroup = document.querySelector(".rating-group");
  ratingGroup?.addEventListener("mouseleave", () => {
    const checked = document.querySelector("input[name='rating']:checked");
    if (checked) {
      ratingDisplay.textContent = generateStars(parseInt(checked.value, 10));
    } else {
      ratingDisplay.textContent = "";
    }
  });

  const form = document.getElementById("review-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("review-name").value;
    const rating = document.querySelector("input[name='rating']:checked")?.value;
    const comment = document.getElementById("review-comment").value;

    addReview(name, rating, comment);
  });
}

function renderReviewsList(reviews) {
  const reviewsSection = document.getElementById("reviews-section");
  if (!reviewsSection) return;

  const listContainer = reviewsSection.querySelector(".reviews-list-container");
  if (!listContainer) return;

  const userRecommendation = getUserRecommendation() || "";
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

  if (userRecommendation) {
    html += `
      <div class="bg-gradient-to-r from-(--accent) to-(--accent) opacity-90 bg-opacity-20 p-6 rounded-lg border-2 border-(--accent) border-opacity-50 mb-8 relative overflow-hidden">
        <div class="absolute top-0 left-0 text-6xl opacity-10 font-serif">✨</div>
        <h4 class="font-serif text-xl text-(--text) mb-3 relative z-10">
          MI RECOMENDACIÓN ESPECIAL
        </h4>
        <p class="text-(--text) font-sans leading-relaxed italic relative z-10">
          "${userRecommendation}"
        </p>
      </div>
    `;
  }

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
            const date = new Date(review.created_at);
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
                      ${review.author}
                    </h4>
                    <div class="text text-(--accent) text-lg mt-1">
                      ${generateStars(Number(review.rating))}
                    </div>
                  </div>
                  <span class="text-xs text-(--text) opacity-60">
                    ${formattedDate}
                  </span>
                </div>
                <p class="text-(--text) font-sans opacity-90 leading-relaxed">
                  ${review.comment || ""}
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
  loadReviews();
}
