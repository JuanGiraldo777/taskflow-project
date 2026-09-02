-- ============================================================
-- Maison DB — Schema completo actualizado
-- ============================================================
-- Marcas de perfumes (tabla independiente, se amplía con el tiempo)
CREATE TABLE IF NOT EXISTS brands (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE
);

-- Subcategorías de perfumes (Árabe, Nicho, Diseñador) — compartidas entre
-- productos originales y preparados; el campo products.type distingue cuál es cuál.
CREATE TABLE IF NOT EXISTS categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE
);

-- Sexo del producto (Dama, Caballero, Unisex). Tabla aparte en vez de ENUM
-- para poder añadir valores nuevos con un INSERT, sin migración de schema.
CREATE TABLE IF NOT EXISTS genders (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE
);

-- Presentaciones disponibles para productos preparados (1oz, 3oz, combos...).
-- El precio es global: se aplica igual a todos los productos preparados que
-- ofrezcan esa presentación. Cambiar el precio aquí lo actualiza para todos.
CREATE TABLE IF NOT EXISTS presentations (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(50)    NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL
);

-- Usuarios: perfil completo + role preparado para admin futuro
CREATE TABLE IF NOT EXISTS users (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  full_name        VARCHAR(100) NOT NULL,
  email            VARCHAR(150) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  favorite_perfume VARCHAR(100) DEFAULT NULL,
  perfume_rec      VARCHAR(100) DEFAULT NULL,
  discount_code    VARCHAR(50)  DEFAULT NULL,
  role             ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Productos
-- type='original'  → producto físico único de 100ml. Precio en original_price/
--                     discounted_price (varía por marca/producto, como siempre).
-- type='preparado' → fraccionado en varias presentaciones. Su precio y stock
--                     viven en product_variants/presentations, NO aquí
--                     (original_price, discounted_price y stock quedan sin usar).
-- El precio real que se usa para filtros de un ORIGINAL es: COALESCE(discounted_price, original_price)
-- Qué combinaciones de (type, category, gender) son válidas en el catálogo es
-- una regla de negocio que se valida en el backend, no aquí — cambia seguido.
CREATE TABLE IF NOT EXISTS products (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  category_id      INT            NOT NULL,
  brand_id         INT            NOT NULL,
  gender_id        INT            NOT NULL,
  type             ENUM('original', 'preparado') NOT NULL,
  name             VARCHAR(150)   NOT NULL,
  description      TEXT,
  original_price   DECIMAL(10, 2) DEFAULT NULL,
  discounted_price DECIMAL(10, 2) DEFAULT NULL,
  stock            INT            NOT NULL DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id)    REFERENCES brands(id),
  FOREIGN KEY (gender_id)   REFERENCES genders(id)
);

-- Imágenes por producto (1:N — una is_main para el feed, el resto para la
-- galería de la página de detalle)
CREATE TABLE IF NOT EXISTS product_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT          NOT NULL,
  url        VARCHAR(500) NOT NULL,
  is_main    BOOLEAN      NOT NULL DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Presentaciones que ofrece cada producto preparado, con su propio stock
-- (ej. puede haber 1oz disponible y 3oz agotado del mismo producto).
CREATE TABLE IF NOT EXISTS product_variants (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  product_id      INT NOT NULL,
  presentation_id INT NOT NULL,
  stock           INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id)      REFERENCES products(id)      ON DELETE CASCADE,
  FOREIGN KEY (presentation_id) REFERENCES presentations(id),
  UNIQUE (product_id, presentation_id)
);

-- Carrito persistente
-- variant_id es NULL para productos originales; el backend debe exigirlo
-- para preparados, ya que el stock se descuenta por presentación, no por producto.
CREATE TABLE IF NOT EXISTS cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT DEFAULT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)            ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)         ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Reseñas
-- Al insertar una reseña, el servicio genera un discount_code
-- con formato MAISON-2026-XXXXXX y lo actualiza en users.discount_code
-- product_id es NULL para las reseñas de TIENDA (index.html, sin producto
-- asociado) — review.service.js ya distinguía los dos casos por esto
-- (WHERE product_id IS NULL / INSERT ... VALUES (?, NULL, ...)), pero la
-- columna había quedado NOT NULL: cualquier reseña de tienda fallaba con
-- error 500 al insertar. Encontrado y corregido 2026-09-02.
CREATE TABLE IF NOT EXISTS reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT     NOT NULL,
  product_id INT     NULL,
  rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Historial de productos vistos (panel de usuario)
-- Se inserta al cargar producto.html?id=X
-- El servicio mantiene solo las últimas 10 entradas por usuario
CREATE TABLE IF NOT EXISTS viewed_products (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  viewed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);