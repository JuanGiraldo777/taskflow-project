-- ============================================================
-- Maison DB — Schema completo actualizado
-- ============================================================

CREATE DATABASE IF NOT EXISTS maison_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE maison_db;

-- Marcas de perfumes (tabla independiente, se amplía con el tiempo)
CREATE TABLE IF NOT EXISTS brands (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE
);

-- Categorías de perfumes
CREATE TABLE IF NOT EXISTS categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE
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
-- original_price  → precio sin descuento, siempre presente
-- discounted_price → nullable, solo si el producto tiene descuento activo
-- El precio real que se usa para filtros es: COALESCE(discounted_price, original_price)
CREATE TABLE IF NOT EXISTS products (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  category_id      INT            NOT NULL,
  brand_id         INT            NOT NULL,
  name             VARCHAR(150)   NOT NULL,
  description      TEXT,
  original_price   DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2) DEFAULT NULL,
  stock            INT            NOT NULL DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id)    REFERENCES brands(id)
);

-- Imágenes por producto (1:N — preparado para múltiples imágenes en detalle)
CREATE TABLE IF NOT EXISTS product_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT          NOT NULL,
  url        VARCHAR(500) NOT NULL,
  is_main    BOOLEAN      NOT NULL DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Carrito persistente
CREATE TABLE IF NOT EXISTS cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
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
CREATE TABLE IF NOT EXISTS reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT     NOT NULL,
  product_id INT     NOT NULL,
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