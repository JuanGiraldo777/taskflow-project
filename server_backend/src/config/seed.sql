-- ============================================================
-- DATOS DE PRUEBA — Maison de L'Eternel
-- ============================================================

USE defaultdb;

-- ── MARCAS ──────────────────────────────────────────────────────
INSERT IGNORE INTO brands (name, slug) VALUES
('Dior', 'dior'),
('Chanel', 'chanel'),
('Guerlain', 'guerlain'),
('Yves Saint Laurent', 'yves-saint-laurent'),
('Lancôme', 'lancome'),
('Hermès', 'hermes'),
('Carolina Herrera', 'carolina-herrera'),
('Paco Rabanne', 'paco-rabanne');

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
(1, 1, 'Jaime Dior', 'Un perfume floral elegante y sofisticado para la mujer moderna', 89.99, 79.99, 15),
(2, 2, 'Coco Mademoiselle', 'Fragancia oriental intensa y seductora', 95.50, 85.50, 12),
(3, 3, 'Shalimar', 'Clásico amaderado con notas de vainilla y almizcares', 110.00, NULL, 8),
(4, 4, 'La Libre', 'Un cítrico fresco con toque floral y especiado', 78.00, 68.00, 20),
(5, 5, 'La Vie Est Belle', 'Fragancia fresca y luminosa para la vida cotidiana', 82.50, 72.50, 18),
(1, 6, 'Eau de Merveilles', 'Floral misterioso con notas de bergamota y almizcares', 98.00, 88.00, 10),
(3, 7, 'Bad Boy', 'Amaderado intenso con especias orientales', 75.00, NULL, 14),
(2, 8, '1 Million', 'Oriental adictivo con toques de especias y ámbar', 85.99, 75.99, 16),
(4, 1, 'Poison', 'Oriental especiado con toques florales sofisticados', 92.00, 82.00, 9),
(5, 2, 'No. 5', 'El icónico cítrico floral que define la elegancia', 115.00, 105.00, 11);

-- ── IMÁGENES DE PRODUCTOS ──────────────────────────────────────
INSERT IGNORE INTO product_images (product_id, url, is_main) VALUES
(1, '/assets/imgs/jaime-dior.jpg', TRUE),
(2, '/assets/imgs/coco-mademoiselle.jpg', TRUE),
(3, '/assets/imgs/shalimar.jpg', TRUE),
(4, '/assets/imgs/la-libre.jpg', TRUE),
(5, '/assets/imgs/la-vie-est-belle.jpg', TRUE),
(6, '/assets/imgs/eau-de-merveilles.jpg', TRUE),
(7, '/assets/imgs/bad-boy.jpg', TRUE),
(8, '/assets/imgs/1-million.jpg', TRUE),
(9, '/assets/imgs/poison.jpg', TRUE),
(10, '/assets/imgs/no-5.jpg', TRUE);

-- ══════════════════════════════════════════════════════════════
-- FIN DE DATOS DE PRUEBA
-- ══════════════════════════════════════════════════════════════
