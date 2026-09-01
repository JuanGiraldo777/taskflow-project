/**
 * @file ejercicio_web/js/productMeta.js
 * @description Arma el texto "Marca · Original/Preparado · Subcategoría ·
 * Sexo" que se muestra sobre el nombre del producto — en las tarjetas y en
 * el detalle. Los preparados omiten la subcategoría: su única categoría
 * real es "Preparados", que ya queda dicho por "Preparado" como tipo, así
 * que repetirla no aporta nada.
 */
export function getProductMetaParts(product) {
  const isPreparado = product.type === "preparado";
  const typeLabel = isPreparado ? "Preparado" : "Original";

  const rest = [typeLabel];
  if (!isPreparado && product.category) {
    rest.push(product.category);
  }
  if (product.gender) {
    rest.push(product.gender);
  }

  return {
    brand: product.brand || "",
    rest: rest.join(" · "),
  };
}

/** Versión de una sola cadena, para donde no hace falta estilizar la marca aparte. */
export function formatProductMeta(product) {
  const { brand, rest } = getProductMetaParts(product);
  return [brand, rest].filter(Boolean).join(" · ");
}
