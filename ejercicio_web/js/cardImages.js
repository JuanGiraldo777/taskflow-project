/**
 * @file ejercicio_web/js/cardImages.js
 * @description Recortes sin fondo (WebP con transparencia) que usan SOLO las
 * tarjetas del grid, para que la foto se vea "flotando" sobre la tarjeta. La
 * página de detalle no usa este archivo: muestra siempre la foto original.
 *
 * Cubre las fotos ambientadas (escenas: desierto, frutas, agua...) y las de
 * fondo claro no blanco, que el truco de CSS (mix-blend-mode en output.css)
 * no puede limpiar. Las de fondo blanco no necesitan recorte.
 *
 * Clave = URL EXACTA de la foto principal original en Cloudinary. Si la foto
 * de un producto se cambia desde el admin, la clave deja de coincidir y la
 * tarjeta vuelve sola a la foto nueva — nunca se muestra un recorte viejo.
 * Recortes generados el 2026-09-26 con BiRefNet (licencia MIT) y revisados
 * uno por uno. Archivos en ejercicio_web/assets/previews/.
 */
const CARD_IMAGES = {
  // 9 PM Afnan
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787955281/afnan-9-pm-caballero.png": "assets/previews/afnan-9-pm-caballero-49a6ee.webp",
  // ARABIYAT PRESTIGE MAHD AL DAHAB 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786985198/ARABIYAT-PRESTIGE-MAHD-AL-DAHAB.jpg": "assets/previews/arabiyat-prestige-mahd-al-dahab-191b01.webp",
  // ARABIYAT PRESTIGE UHUD 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786984966/ARABIYAT_PRESTIGE_UHUD.jpg": "assets/previews/arabiyat-prestige-uhud-904c20.webp",
  // ARMAF ODYSSEY MONTIAGNE 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786984981/ARMAF_ODYSSEY_MONTAGNE3.jpg": "assets/previews/armaf-odyssey-montagne3-8cfada.webp",
  // Badee al Oud Amethyste Lattafa
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787957075/Badee-oud-amethyste.png": "assets/previews/badee-oud-amethyste-f187dc.webp",
  // Badee al Oud Sublime Lattafa
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787957081/badee-oud-sublime.png": "assets/previews/badee-oud-sublime-aeb824.webp",
  // Can Can Paris Hilton
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787875085/can-can-paris1.png": "assets/previews/can-can-paris1-a74e7b.webp",
  // Coconut Passion VS
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787875098/coconut-passion1.png": "assets/previews/coconut-passion1-a6dbbd.webp",
  // Creed Silver Mountain Water
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787955295/creed-silver.png": "assets/previews/creed-silver-cc9e8c.webp",
  // Hugo Boos Bottled
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787955300/hugo-boss.png": "assets/previews/hugo-boss-6121d2.webp",
  // JO MILANO GAME OF SPADES ALL IN 100ML PARFUM
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786985642/JO_MILANO_GAME_OF_SPADES_ALL_IN%C3%ADtulo3.jpg": "assets/previews/jo-milano-game-of-spades-all-in-c3-adtulo3-efaafd.webp",
  // JO MILANO GAME OF SPADES BLACKSAPPHIRE 90ML PARFUM
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786985617/JO_MILANO_GAME_OF_SPADES_BLACK_SAPPHIRE3.jpg": "assets/previews/jo-milano-game-of-spades-black-sapphire3-702703.webp",
  // LATTAFA BADEE AL OUD AMETHYST 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786985201/BADEE_AL_OUD_AMETHYSTE_LATAFFA4.png": "assets/previews/badee-al-oud-amethyste-lataffa4-e898fd.webp",
  // LATTAFA BADEE AL OUD SUBLIME 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786984990/LATTAFASUBLIMEEDP2.png": "assets/previews/lattafasublimeedp2-b0b8f2.webp",
  // Light Blue Pour Homme D&G
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787955315/light-blue-caballero.png": "assets/previews/light-blue-caballero-10494d.webp",
  // Mandarine Sky Odyssey
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787957772/mandarine-sky.png": "assets/previews/mandarine-sky-f3f3b6.webp",
  // ORIENTICA LUXURY COLLECTION OUD SAFFRON 80ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786985041/ORIENTICA_LUXURY_COLLECTION_OUD_SAFFRON.jpg": "assets/previews/orientica-luxury-collection-oud-saffron-0ce793.webp",
  // Odyssey Candee
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787875035/odyssey-candee1.png": "assets/previews/odyssey-candee1-7b72c1.webp",
  // RASASI HAWAS ATLANTIS 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786475141/atlantis1.jpg": "assets/previews/atlantis1-e74c28.webp",
  // RASASI HAWAS EXOTIC 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786475209/exotic1.jpg": "assets/previews/exotic1-1c3075.webp",
  // RASASI HAWAS ICE 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786475253/ice.jpg": "assets/previews/ice-b806ac.webp",
  // Santal 33 Le Labo
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787957143/santal-33_1.png": "assets/previews/santal-33-1-97bc8e.webp",
  // Versace Eros
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787955331/versace-eros.png": "assets/previews/versace-eros-71afcf.webp",
};

export function cardImageFor(url) {
  return (url && CARD_IMAGES[url]) || null;
}
