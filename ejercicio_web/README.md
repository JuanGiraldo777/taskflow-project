# Proyecto Perfumes - Filtro de Búsqueda y Carrito de Compras

## Descripción

Este proyecto implementa dos funcionalidades principales en la sección de productos destacados:

1. **Filtro de búsqueda en tiempo real**:
   - Permite buscar productos escribiendo texto en un input.
   - Oculta productos que no coinciden y muestra solo los que coinciden.
   - Muestra un recuadro al lado del input indicando cuántas coincidencias hay en la sección de destacados.

2. **Carrito de compras dinámico**:
   - Cada producto viene en una card de producto en la sección de destacados.
   - Cada producto tiene un botón "Añadir al carrito" y se añaden al carrito.
   - Los productos seleccionados se almacenan en `localStorage` para mantener el estado.
   - Se puede incrementar, disminuir o eliminar productos desde el carrito.
   - Un contador en el icono del carrito muestra el número total de productos añadidos.

3. **Dark/Light Mode**:
   - Alterna entre modo oscuro y modo claro con un botón en la top bar.
   - Botón con doble emoji indicando Dark y Light Mode.
   - Persistencia: recuerda la elección del usuario usando `localStorage`.
   - Colores dinámicos: usa variables CSS para cambiar fondos y textos.
   - Transiciones suaves: cambios de color y efecto hover elegantes en el botón.
   - Compatible con toda la página, incluyendo top bar, menú lateral, productos y secciones.
