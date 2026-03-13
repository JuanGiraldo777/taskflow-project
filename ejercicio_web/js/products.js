const PRODUCTS = [
  {
    id: 1,
    name: "Bharara King",
    brand: "BHARARA",
    originalPrice: 340000,
    discountedPrice: 25000,
    image: "assets/imgs_destacados/bharara_king_producto.png",
  },
  {
    id: 2,
    name: "Afnan 9PM",
    brand: "AFNAN",
    originalPrice: 340000,
    discountedPrice: 55000,
    image: "assets/imgs_destacados/afnan_9pm_producto.png",
  },
  {
    id: 3,
    name: "ASAD Lattafa",
    brand: "LATTAFA",
    originalPrice: 340000,
    discountedPrice: 45000,
    image: "assets/imgs_destacados/asad_lattafa_producto.png",
  },
  {
    id: 4,
    name: "Dior Sauvage",
    brand: "DIOR",
    originalPrice: 340000,
    discountedPrice: 45000,
    image: "assets/imgs_destacados/dior_sauvage_producto.png",
  },
];

export function renderProducts() {
  const gridContainer = document.querySelector(".grid.grid-cols-4");
  gridContainer.innerHTML = ""; // Vaciar el contenedor

  PRODUCTS.forEach((product) => {
    const productCard = document.createElement("article");
    productCard.className =
      "product-card relative bg-(--card-bg) p-8 rounded-xl overflow-hidden text-(--text)";
    productCard.dataset.name = product.name.toLowerCase();

    productCard.innerHTML = `
      <span class="absolute top-5 left-5 bg-(--accent) text-black text-xs px-[10px] py-[6px] rounded">OFERTA</span>
      <a href="producto.html" class="block">
        <img
          src="${product.image}"
          alt="${product.name}"
          class="w-[90%] h-[280px] object-contain transition-transform duration-300"
        />
      </a>
      <div class="mt-1">
        <span class="text-xs text-[#999]">${product.brand}</span>
        <h3 class="font-serif text-lg my-2">${product.name}</h3>
        <div class="flex gap-2 items-center">
          <span class="line-through text-[#999]">$${product.originalPrice.toLocaleString()}</span>
          <span class="text-xs">Desde</span>
          <span class="text-(--accent) font-bold">$${product.discountedPrice.toLocaleString()}</span>
        </div>
      </div>
      <button
        class="add-to-cart font-serif absolute bottom-5 left-5 right-5 bg-(--bg) border border-(--text) text-(--text) py-[14px] cursor-pointer"
        data-id="${product.id}"
        data-name="${product.name}"
        data-price="${product.discountedPrice}"
        aria-label="Añadir producto al Carrito"
      >
        AÑADIR AL CARRITO
      </button>
      <button
        class="add-to-favorites absolute top-5 right-5 bg-transparent border-none cursor-pointer"
        data-id="${product.id}"
        data-name="${product.name}"
        data-price="${product.discountedPrice}"
        aria-label="Añadir producto a Favoritos"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11.48 3.499a5.373 5.373 0 0 0-7.61 0 5.373 5.373 0 0 0 0 7.61L12 19.24l8.13-8.13a5.373 5.373 0 0 0 0-7.61 5.373 5.373 0 0 0-7.61 0l-.02.02Z"
          />
        </svg>
      </button>
    `;

    gridContainer.appendChild(productCard);
  });
}
