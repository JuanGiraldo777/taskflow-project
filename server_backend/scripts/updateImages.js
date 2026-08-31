const pool = require('../src/config/db.js');

// Actualiza la URL de la imagen principal (is_main = TRUE) de cada producto indicado.
// Recibe el array de imágenes como parámetro para poder reutilizarse desde otros
// scripts o, más adelante, desde un endpoint del panel admin.
async function updateImages(images) {
  let updatedCount = 0;

  for (const image of images) {
    const [result] = await pool.execute(
      'UPDATE product_images SET url = ? WHERE product_id = ? AND is_main = TRUE',
      [image.url, image.product_id]
    );

    if (result.affectedRows > 0) {
      updatedCount += 1;
    }
  }

  console.log(`Actualizadas ${updatedCount} imágenes correctamente`);
  return updatedCount;
}

module.exports = updateImages;

// Solo corre si el archivo se ejecuta directamente (`node scripts/updateImages.js`),
// no cuando otro módulo hace require() de la función de arriba.
if (require.main === module) {
  const imagesToUpdate = [
    { product_id: 1, url: 'https://res.cloudinary.com/fknoxpjk/image/upload/v1786398865/WhatsApp_Image_2025-12-16_at_1.47.07_AM_3_1080x.jpg.' },
  ];

  updateImages(imagesToUpdate)
    .catch((error) => {
      console.error('Error actualizando imágenes:', error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
