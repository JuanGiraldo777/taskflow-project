/**
 * @file ejercicio_web/js/imageUrl.js
 * @description Pide a Cloudinary la foto ya optimizada para el lugar donde se muestra.
 *
 * Las fotos de producto se subieron como PNG/JPG grandes (hasta ~1 MB). Al
 * agregar a la URL de Cloudinary:
 *   f_auto  → el formato más liviano que entienda el navegador (WebP/AVIF),
 *   q_auto  → compresión ajustada a la imagen sin pérdida visible,
 *   c_limit,w_N → nunca más ancha que N píxeles (no agranda las pequeñas),
 * la foto más pesada del catálogo pasa de 496 KB a 56 KB (w_800, medido).
 * Cloudinary genera cada tamaño una sola vez y lo guarda en su CDN: con
 * ~130 fotos y 4 tamaños el gasto es menor a 1 crédito de los 25 del plan
 * gratis.
 *
 * IMPORTANTE: el mapa de recortes (js/cardImages.js) usa la URL ORIGINAL
 * como clave. Buscar el recorte primero y optimizar después, nunca al revés.
 */
const UPLOAD_SEGMENT = "/image/upload/";

/** Anchos usados en el sitio (px reales, ya contando pantallas retina). */
export const IMAGE_WIDTHS = {
  card: 600, // tarjetas del catálogo/inicio (se ven a ~280 px de alto)
  detail: 1000, // foto grande de la ficha de producto
  thumb: 200, // miniaturas de la galería
  zoom: 1600, // visor a pantalla completa
};

export function optimizedImage(url, width) {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com")) return url;
  const at = url.indexOf(UPLOAD_SEGMENT);
  if (at === -1) return url;
  const insertAt = at + UPLOAD_SEGMENT.length;
  // Si ya trae transformaciones (empieza con "f_", "w_", etc.), no duplicar.
  if (/^[a-z]{1,2}_[^/]+\//.test(url.slice(insertAt))) return url;
  return `${url.slice(0, insertAt)}f_auto,q_auto,c_limit,w_${width}/${url.slice(insertAt)}`;
}
