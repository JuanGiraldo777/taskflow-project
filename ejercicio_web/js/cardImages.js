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
 *
 * Sin recorte a propósito (el automático no quedó limpio; la tarjeta usa la
 * foto original): Khamrah y Club de Nuit Intense (la caja quedó
 * agujereada/perdida), Cloud y Bon Bon (se perdía la caja — son de fondo
 * blanco y el blend de CSS ya los muestra bien), Amber Oud Gold y Fakhar
 * Woman (adornos grandes flotando), Victoria (caja con cielo impreso,
 * bordes irregulares), Haya (línea suelta de la caja).
 */
const CARD_IMAGES = {
  // 9 PM Afnan
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787955281/afnan-9-pm-caballero.png": "assets/previews/afnan-9-pm-caballero-49a6ee.webp",
  // ARABIYAT PRESTIGE LEMON SORBET 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786399321/images_2.jpg": "assets/previews/images-2-59fd60.webp",
  // ARABIYAT PRESTIGE MAHD AL DAHAB 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786985198/ARABIYAT-PRESTIGE-MAHD-AL-DAHAB.jpg": "assets/previews/arabiyat-prestige-mahd-al-dahab-191b01.webp",
  // ARABIYAT PRESTIGE MARASI FOR HER 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786399513/IMAGEN_1.jpg": "assets/previews/imagen-1-f3ce1a.webp",
  // ARABIYAT PRESTIGE MARASI FOR HIM 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786474478/him.jpg": "assets/previews/him-e8f76c.webp",
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
  // DUMONT NITRO RED 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786474651/red1.jpg": "assets/previews/red1-e44eb9.webp",
  // DUMONT NITRO RED INTENSELY 100ML EXTRAIT DE PARFUM
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786474693/intensely1.jpg": "assets/previews/intensely1-2f6f9c.webp",
  // EMPER STALLION 53 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786474742/53_1.jpg": "assets/previews/53-1-34f47f.webp",
  // Hugo Boos Bottled
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1787955300/hugo-boss.png": "assets/previews/hugo-boss-6121d2.webp",
  // JO MILANO GAME OF SPADES ALL IN 100ML PARFUM
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786985642/JO_MILANO_GAME_OF_SPADES_ALL_IN%C3%ADtulo3.jpg": "assets/previews/jo-milano-game-of-spades-all-in-c3-adtulo3-efaafd.webp",
  // JO MILANO GAME OF SPADES BLACKSAPPHIRE 90ML PARFUM
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786985617/JO_MILANO_GAME_OF_SPADES_BLACK_SAPPHIRE3.jpg": "assets/previews/jo-milano-game-of-spades-black-sapphire3-702703.webp",
  // LATTAFA ASAD 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786398852/arabia-lattafa-asad-edp-922614_large.webp": "assets/previews/arabia-lattafa-asad-edp-922614-large-c9989c.webp",
  // LATTAFA BADEE AL OUD AMETHYST 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786985201/BADEE_AL_OUD_AMETHYSTE_LATAFFA4.png": "assets/previews/badee-al-oud-amethyste-lataffa4-e898fd.webp",
  // LATTAFA BADEE AL OUD SUBLIME 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786984990/LATTAFASUBLIMEEDP2.png": "assets/previews/lattafasublimeedp2-b0b8f2.webp",
  // LATTAFA EMEER 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786474913/emeer1.jpg": "assets/previews/emeer1-8633fb.webp",
  // LATTAFA ETERNAL VANILLE 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786399914/LAT_1.jpg": "assets/previews/lat-1-7074d5.webp",
  // LATTAFA HIS CONFESSION 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786474966/confession1.jpg": "assets/previews/confession1-abace0.webp",
  // LATTAFA MAYAR 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786399211/REF-GF1369-MAYAR-LATTAFA-PARA-MUJER-IMAGEN-4.jpg": "assets/previews/ref-gf1369-mayar-lattafa-para-mujer-imagen-4-4cf9ba.webp",
  // LATTAFA RAVE NOW BLACK 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786475006/rave1.jpg": "assets/previews/rave1-4dcc21.webp",
  // LATTAFA RAVE NOW WOMAN 100MML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786472333/im.jpg": "assets/previews/im-3aba20.webp",
  // LATTAFA YARA 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786399217/Perfume_Yara_Lattafa_EDP_ENVIOAC.png": "assets/previews/perfume-yara-lattafa-edp-envioac-19d795.webp",
  // LATTAFA YARA CANDY 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786472384/ims.jpg": "assets/previews/ims-b5af7e.webp",
  // LATTAFA YARA ELIXIR 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786399214/lattafa-yara-elixir-100ml-edp-for-women-5b1ddc4f115e9175b217677264060132-480-0.webp": "assets/previews/lattafa-yara-elixir-100ml-edp-for-women-5b1ddc4f-8abff7.webp",
  // LATTAFA YARA TOUS 100ML EDP
  "https://res.cloudinary.com/fknoxpjk/image/upload/v1786473304/tous_1.jpg": "assets/previews/tous-1-73ad1c.webp",
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
