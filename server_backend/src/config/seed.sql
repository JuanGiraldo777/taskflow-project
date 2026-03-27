-- ============================================================
-- DATOS DE PRUEBA — Maison de L'Eternel
-- ============================================================
-- SEED DE DATOS — ejecutar manualmente solo si la BD está vacía
-- NO ejecutar si ya hay datos — borrará todo lo existente
USE defaultdb;

-- ── MARCAS ──────────────────────────────────────────────────────
INSERT IGNORE INTO brands (name, slug) VALUES
('Afnan', 'afnan'),
('Ariana Grande', 'ariana-grande'),
('Lattafa', 'lattafa'),
('Bharara', 'bharara'),
('Creed', 'creed'),
('Dior', 'dior'),
('Armaf', 'armaf'),
('Versace', 'versace');

-- ── CATEGORÍAS ──────────────────────────────────────────────────
INSERT IGNORE INTO categories (name, slug) VALUES
('Floral', 'floral'),
('Oriental', 'oriental'),
('Amaderado', 'amaderado'),
('Cítrico', 'citrico'),
('Fresco', 'fresco'),
('Especiado', 'especiado');

-- ── PRODUCTOS ──────────────────────────────────────────────────
INSERT IGNORE INTO products (category_id, brand_id, name, description, original_price, discounted_price, stock) VALUES
(2, 1, '9PM', 'Fragancia dulce y especiada para la noche, con notas de manzana, canela y vainilla.', 49.99, 42.99, 25),
(1, 2, 'Cloud', 'Perfume floral gourmand con carácter cremoso, ideal para uso diario y juvenil.', 59.99, 51.99, 20),
(6, 3, 'Asad', 'Aroma intenso y especiado con fondo ambarado y maderas cálidas de gran duración.', 44.99, 38.99, 30),
(4, 4, 'King', 'Fragancia fresca cítrica con salida brillante y fondo elegante para uso versátil.', 69.99, 61.99, 18),
(3, 5, 'Aventus', 'Perfume amaderado afrutado de perfil sofisticado con notas de piña, abedul y almizcle.', 349.99, 329.99, 8),
(5, 6, 'Sauvage Eau de Toilette', 'Fragancia fresca aromática con bergamota y ambroxan, moderna y potente.', 129.99, 114.99, 15),
(2, 7, 'Odyssey Homme', 'Oriental moderno con toque dulce y ambarado, ideal para noches y clima frío.', 54.99, NULL, 22),
(6, 8, 'Eros Flame', 'Perfume especiado cítrico con maderas cálidas y carácter intenso.', 109.99, 96.99, 12);

-- ── IMÁGENES DE PRODUCTOS ──────────────────────────────────────
INSERT IGNORE INTO product_images (product_id, url, is_main) VALUES
(1, '/assets/imgs_destacados/afnan_9pm_producto.png', TRUE),
(2, '/assets/imgs_destacados/ariana_grande_cloud_producto.png', TRUE),
(3, '/assets/imgs_destacados/asad_lattafa_producto.png', TRUE),
(4, '/assets/imgs_destacados/bharara_king_producto.png', TRUE),
(5, '/assets/imgs_destacados/creed_aventus_producto.png', TRUE),
(6, '/assets/imgs_destacados/dior_sauvage_producto.png', TRUE),
(7, '/assets/imgs_destacados/odyssey_homme_producto.png', TRUE),
(8, '/assets/imgs_destacados/versace_eros_flame_producto.png', TRUE);

-- ══════════════════════════════════════════════════════════════
-- FIN DE DATOS DE PRUEBA
-- ══════════════════════════════════════════════════════════════
