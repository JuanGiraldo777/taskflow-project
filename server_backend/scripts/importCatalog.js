/**
 * @file server_backend/scripts/importCatalog.js
 * @description Carga masiva del catálogo real (originales + preparados) desde los
 * Excel de inventario en C:\Users\jjbui\Documents\WEB_IVAN. Reutiliza
 * product.service.js para que cada producto pase por la misma validación
 * (incluida la matriz sexo/subcategoría) que usa el panel admin.
 *
 * Por defecto corre en modo DRY-RUN (no escribe nada, solo muestra qué haría).
 * Para escribir de verdad: node scripts/importCatalog.js --commit
 */
const XLSX = require("xlsx");
const pool = require("../src/config/db");
const productService = require("../src/services/product.service");

const ORIGINALES_PATH =
  "C:/Users/jjbui/Documents/WEB_IVAN/inventario-ORIGINALES.xlsx";
const PREPARADOS_PATH =
  "C:/Users/jjbui/Documents/WEB_IVAN/inventario-PREPARADOS.xlsx";

// Sin columna de stock en ningún Excel — el negocio trabaja sobre pedido.
// Este número solo marca "disponible"; cuando algo se agota se quita del
// catálogo a mano (según lo acordado), no se lleva conteo real aquí.
const DEFAULT_STOCK = 10;

const COMMIT = process.argv.includes("--commit");

// ── Utilidades ──────────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toTitleCase(text) {
  return text
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// Nombres "bonitos" para marcas cuyo Title Case automático queda mal
// (siglas, marcas compuestas).
const BRAND_DISPLAY_NAMES = {
  CH: "Carolina Herrera",
  JPG: "Jean Paul Gaultier",
  "D&G": "Dolce & Gabbana",
  MFK: "Maison Francis Kurkdjian",
};

const brandIdCache = new Map();
async function getOrCreateBrandId(rawName) {
  const key = rawName.trim().toUpperCase();
  if (brandIdCache.has(key)) return brandIdCache.get(key);

  const displayName = BRAND_DISPLAY_NAMES[key] || toTitleCase(rawName.trim());
  const slug = slugify(displayName);

  if (!COMMIT) {
    // En dry-run no tocamos la BD — devolvemos un id ficticio solo para log.
    brandIdCache.set(key, `(nueva: ${displayName})`);
    return brandIdCache.get(key);
  }

  const [existing] = await pool.execute(
    "SELECT id FROM brands WHERE slug = ?",
    [slug],
  );
  if (existing.length > 0) {
    brandIdCache.set(key, existing[0].id);
    return existing[0].id;
  }

  const [result] = await pool.execute(
    "INSERT INTO brands (name, slug) VALUES (?, ?)",
    [displayName, slug],
  );
  brandIdCache.set(key, result.insertId);
  return result.insertId;
}

const categoryIdCache = new Map();
async function getCategoryId(slug) {
  if (categoryIdCache.has(slug)) return categoryIdCache.get(slug);
  const [rows] = await pool.execute(
    "SELECT id FROM categories WHERE slug = ?",
    [slug],
  );
  if (rows.length === 0) throw new Error(`Categoría no encontrada: ${slug}`);
  categoryIdCache.set(slug, rows[0].id);
  return rows[0].id;
}

const genderIdCache = new Map();
async function getGenderId(slug) {
  if (genderIdCache.has(slug)) return genderIdCache.get(slug);
  const [rows] = await pool.execute("SELECT id FROM genders WHERE slug = ?", [
    slug,
  ]);
  if (rows.length === 0) throw new Error(`Sexo no encontrado: ${slug}`);
  genderIdCache.set(slug, rows[0].id);
  return rows[0].id;
}

let presentationIdsByLabel = null;
async function getPresentationIdsByLabel() {
  if (presentationIdsByLabel) return presentationIdsByLabel;
  const [rows] = await pool.execute("SELECT id, label FROM presentations");
  presentationIdsByLabel = new Map(rows.map((r) => [r.label, r.id]));
  return presentationIdsByLabel;
}

function collectImages(values) {
  return values.filter((v) => typeof v === "string" && v.trim().length > 0);
}

// ── ORIGINALES ───────────────────────────────────────────────────────────
// Columnas (verificadas con xlsx): [categoria, sexo, marca, nombre, mayor, ventaPublico, foto1..foto5]
const CATEGORY_SLUG_BY_LABEL = {
  ARABE: "arabe",
  NICHO: "nicho",
  DISEÑADOR: "disenador",
};

async function importOriginales() {
  const wb = XLSX.readFile(ORIGINALES_PATH);
  const ws = wb.Sheets["ORIGINALES"];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 2 });

  let lastCategory = null;
  let created = 0;
  let failed = 0;

  console.log(`\n=== ORIGINALES (${rows.length} filas) ===`);

  for (const row of rows) {
    const [categoria, sexo, marca, nombre, , ventaPublico, ...fotos] = row;
    if (categoria) lastCategory = categoria.toString().trim().toUpperCase();
    if (!nombre) continue;

    const nombreTrim = nombre.toString().trim();

    try {
      const categorySlug = CATEGORY_SLUG_BY_LABEL[lastCategory];
      if (!categorySlug) {
        throw new Error(`Categoría desconocida: "${lastCategory}"`);
      }
      if (!sexo) throw new Error("Sin sexo");
      if (!marca) throw new Error("Sin marca");
      if (!ventaPublico) throw new Error("Sin VALOR VENTA");

      const genderSlug = sexo.toString().trim().toLowerCase();
      const images = collectImages(fotos);

      if (!COMMIT) {
        await getOrCreateBrandId(marca.toString());
        console.log(
          `  [dry-run] original | ${nombreTrim} | cat=${categorySlug} sexo=${genderSlug} marca=${marca} precio=${ventaPublico} imgs=${images.length}`,
        );
        created += 1;
        continue;
      }

      const [brandId, categoryId, genderId] = await Promise.all([
        getOrCreateBrandId(marca.toString()),
        getCategoryId(categorySlug),
        getGenderId(genderSlug),
      ]);

      const product = await productService.create({
        type: "original",
        categoryId,
        brandId,
        genderId,
        name: nombreTrim,
        description: "",
        originalPrice: Number(ventaPublico),
        discountedPrice: null,
        stock: DEFAULT_STOCK,
        imageUrls: images,
      });

      created += 1;
      console.log(`  OK  original | ${nombreTrim}`);
    } catch (err) {
      failed += 1;
      console.error(`  ERROR original | ${nombreTrim}: ${err.message}`);
    }
  }

  console.log(`\nOriginales: ${created} OK, ${failed} con error.`);
}

// ── PREPARADOS ───────────────────────────────────────────────────────────
// Columnas (verificadas con xlsx): [_, nombre, categoria(constante), descripcion, valor1oz, valor3oz, comboTexto, foto1..foto3]
const GENDER_SUFFIXES = [
  ["Caballero", "caballero"],
  ["Dama", "dama"],
  ["Unisex", "unisex"],
];

const PRESENTATION_LABELS = ["1oz", "3oz", "Combo 3x1oz", "Combo 3x3oz"];

// Marca real detrás de cada nombre base (sin el sufijo de sexo) — el Excel
// de preparados no trae columna de marca separada.
const NAME_TO_BRAND = {
  "212 VIP Rose CH": "Carolina Herrera",
  "9 PM Afnan": "Afnan",
  "Acqua Di Giò": "Giorgio Armani",
  "Arabians Tonka Montale Paris": "Montale",
  "Azzaro The Most Wanted": "Azzaro",
  "Baccarat Rouge 540 Maison Francis Kurkdijan Paris":
    "Maison Francis Kurkdjian",
  "Badee al Oud Amethyste Lattafa": "Lattafa",
  "Badee al Oud Sublime Lattafa": "Lattafa",
  "Bharara King": "Bharara",
  "Bianco Latte Giardini di Toscana": "Giardini di Toscana",
  "Bon Bon Armaf": "Armaf",
  "Bourbon Asad Lattafa": "Lattafa",
  "Burberry Her": "Burberry",
  "Can Can Paris Hilton": "Paris Hilton",
  "CH 212": "Carolina Herrera",
  "Cloud Ariana Grande": "Ariana Grande",
  "Club de Nuit Intense": "Armaf",
  "Club de Nuit Sillage": "Armaf",
  "Coconut Passion VS": "Victoria's Secret",
  "Creed Silver Mountain Water": "Creed",
  "Eclaire Lattafa": "Lattafa",
  "Emper Stallion 53": "Emper",
  "Erba Pura": "Xerjoff",
  "Good Girl Blush CH": "Carolina Herrera",
  "Good Girl CH": "Carolina Herrera",
  "Haramain Amber Oud Aqua Dubai": "Al Haramain",
  "Haramain Amber Oud Gold": "Al Haramain",
  "Hawas Ice Rasis": "Rasasi",
  "Haya Lattafa": "Lattafa",
  "Hugo Boos Bottled": "Hugo Boss",
  "Ilmin il Goutte": "Ilmin",
  "Invictus Victory Paco Rabanne": "Paco Rabanne",
  "Issey Miyake L'eau D'issey": "Issey Miyake",
  "Khamrah Lattafa": "Lattafa",
  "Khamrah Qahawa Lattafa": "Lattafa",
  "Korbaj Toxic Desire": "Korbaj",
  "La Vida Es Bella Lacome": "Lancôme",
  "Lacoste Red": "Lacoste",
  "Le Beau Le Parfum JPG": "Jean Paul Gaultier",
  "Le Male Elixir JPG": "Jean Paul Gaultier",
  "Light Blue D&C": "Dolce & Gabbana",
  "Light Blue D&G": "Dolce & Gabbana",
  "Mandarine Sky Odyssey": "Armaf",
  "Mayar Lattafa": "Lattafa",
  "Miss Dior": "Dior",
  "Moschino Toy 2": "Moschino",
  "Odyssey Candee": "Armaf",
  "Odyssey Homme": "Armaf",
  "Odyssey Spectra": "Armaf",
  "One Million Paco Rabanne": "Paco Rabanne",
  "Orientica Royal Amber": "Orientica",
  "Santal 33 Le Labo": "Le Labo",
  "Sauvage Dior": "Dior",
  "Thank U Next Ariana Grande": "Ariana Grande",
  "Valentino Born In Roma": "Valentino",
  "Valentino Donna Born in Roma": "Valentino",
  "Valentino Uomo": "Valentino",
  "Versace Eros": "Versace",
  "Yara Elixir Lattafa": "Lattafa",
  "Yum Yum Armaf": "Armaf",
};

async function importPreparados() {
  const wb = XLSX.readFile(PREPARADOS_PATH);
  const ws = wb.Sheets["caballero-dama-unisex"];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 2 });

  let created = 0;
  let failed = 0;

  console.log(`\n=== PREPARADOS (${rows.length} filas) ===`);

  for (const row of rows) {
    const [, nombreFull, , descripcion, , , , ...fotos] = row;
    if (!nombreFull) continue;

    const nombreTrim = nombreFull.toString().trim();

    try {
      const suffixEntry = GENDER_SUFFIXES.find(([suf]) =>
        nombreTrim.endsWith(suf),
      );
      if (!suffixEntry) {
        throw new Error("No se pudo determinar el sexo por el nombre");
      }
      const [suffix, genderSlug] = suffixEntry;
      const baseName = nombreTrim.slice(0, -suffix.length).trim();

      const brandName = NAME_TO_BRAND[baseName];
      if (!brandName) {
        throw new Error(`Sin marca mapeada para "${baseName}"`);
      }

      const images = collectImages(fotos);

      if (!COMMIT) {
        await getOrCreateBrandId(brandName);
        console.log(
          `  [dry-run] preparado | ${baseName} | sexo=${genderSlug} marca=${brandName} imgs=${images.length}`,
        );
        created += 1;
        continue;
      }

      const [brandId, categoryId, genderId, presentations] =
        await Promise.all([
          getOrCreateBrandId(brandName),
          getCategoryId("preparados"),
          getGenderId(genderSlug),
          getPresentationIdsByLabel(),
        ]);

      const variants = PRESENTATION_LABELS.map((label) => {
        const presentationId = presentations.get(label);
        if (!presentationId) {
          throw new Error(`Presentación no encontrada: ${label}`);
        }
        return { presentationId, stock: DEFAULT_STOCK };
      });

      const product = await productService.create({
        type: "preparado",
        categoryId,
        brandId,
        genderId,
        name: baseName,
        description: descripcion ? descripcion.toString().trim() : "",
        imageUrls: images,
        variants,
      });

      created += 1;
      console.log(`  OK  preparado | ${baseName}`);
    } catch (err) {
      failed += 1;
      console.error(`  ERROR preparado | ${nombreTrim}: ${err.message}`);
    }
  }

  console.log(`\nPreparados: ${created} OK, ${failed} con error.`);
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    COMMIT
      ? "Modo COMMIT — se va a escribir en la base de datos."
      : "Modo DRY-RUN — no se escribe nada. Corre con --commit para aplicar de verdad.",
  );

  await importOriginales();
  await importPreparados();

  await pool.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exitCode = 1;
});
