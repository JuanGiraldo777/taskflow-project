-- ============================================================
-- DATOS DE PRUEBA — Maison de L'Eternel
-- ============================================================
-- SEED DE DATOS — ejecutar manualmente solo si la BD está vacía
-- NO ejecutar si ya hay datos — borrará todo lo existente
--
-- Fija primero tu schema activo en Workbench (doble clic sobre él) antes de
-- ejecutar este script — a diferencia de la versión anterior, ya NO asume
-- ningún nombre de base de datos fijo, así sirve igual para local o Aiven.

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
-- Árabe/Nicho/Diseñador son subcategorías de ORIGINALES.
-- "Preparados" es la única categoría de los preparados — ahí el sexo
-- (dama/caballero/unisex) hace de clasificación, no hay Árabe/Nicho/Diseñador.
INSERT IGNORE INTO categories (name, slug) VALUES
('Árabe', 'arabe'),
('Nicho', 'nicho'),
('Diseñador', 'disenador'),
('Preparados', 'preparados');

-- ── SEXOS ───────────────────────────────────────────────────────
INSERT IGNORE INTO genders (name, slug) VALUES
('Dama', 'dama'),
('Caballero', 'caballero'),
('Unisex', 'unisex');

-- ── PRESENTACIONES (precio global para productos preparados) ──────
INSERT IGNORE INTO presentations (label, price) VALUES
('1oz', 16000),
('3oz', 35000),
('Combo 3x1oz', 38000),
('Combo 3x3oz', 90000);

-- ══════════════════════════════════════════════════════════════
-- FIN DE DATOS DE PRUEBA
-- Los productos reales (originales y preparados) se cargan aparte,
-- cuando tengas nombres, precios e imágenes definitivos.
-- ══════════════════════════════════════════════════════════════