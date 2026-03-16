# Maison de L'Eternel

> _Donde el aroma nunca muere_ — Una tienda de perfumería online moderna, elegante y totalmente funcional.

---

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#📖-descripción-del-proyecto)
- [Tecnologías Utilizadas](#💻-tecnologías-utilizadas)
- [Estructura del Proyecto](#📁-estructura-del-proyecto)
- [Funcionalidades Principales](#✨-funcionalidades-principales)
- [Ejemplos de Uso](#🎯-ejemplos-de-uso)
- [Cómo Ejecutar el Proyecto](#🚀-cómo-ejecutar-el-proyecto)
- [Arquitectura y Decisiones Técnicas](#🏗️-arquitectura-y-decisiones-técnicas)

---

## 📖 Descripción del Proyecto

**Maison de L'Eternel** es una tienda de perfumería online de lujo, desarrollada con JavaScript vanilla y TailwindCSS. El proyecto implementa un e-commerce completamente funcional con características avanzadas como carrito de compras, lista de deseos, sistema de filtros dinámicos, búsqueda en tiempo real, y un sistema de reseñas persistente.

El sitio cuenta con un diseño elegante y oscuro, coherente con la naturaleza premium de una perfumería de lujo, con un sistema de variables CSS customizables para tema claro/oscuro.

### Objetivos del Proyecto:

- ✅ Demostrar dominio de JavaScript vanilla y manipulación del DOM
- ✅ Implementar e-commerce con funcionalidades reales
- ✅ Aplicar principios de arquitectura modular basada en responsabilidades
- ✅ Usar TailwindCSS para un diseño responsive y consistente
- ✅ Persistencia de datos con localStorage

---

## 💻 Tecnologías Utilizadas

| Tecnología       | Versión | Uso                                                |
| ---------------- | ------- | -------------------------------------------------- |
| **HTML5**        | 5       | Estructura semántica de la página                  |
| **JavaScript**   | ES6+    | Vanilla JS, módulos con `import`/`export`          |
| **TailwindCSS**  | Latest  | Estilización y diseño responsivo                   |
| **PostCSS**      | -       | Compilación y procesamiento de CSS                 |
| **localStorage** | -       | Persistencia de datos (carrito, reseñas, wishlist) |

---

## 📁 Estructura del Proyecto

```
ejercicio_web/
├── index.html                 # Estructura principal de la página
├── README.md                  # Este archivo
├── assets/
│   ├── brands/               # Logos de marcas
│   ├── img_categories/       # Imágenes de categorías
│   ├── imgs/                 # Imágenes generales
│   └── imgs_destacados/      # Imágenes de productos destacados
├── js/
│   ├── app.js               # Punto de entrada, inicializa todas las funcionalidades
│   ├── products.js          # Array PRODUCTS y renderización de productos
│   ├── cart.js              # Lógica completa del carrito de compras
│   ├── wishlist.js          # Sistema de lista de deseos
│   ├── filters.js           # Filtros avanzados por precio y marca
│   ├── reviews.js           # Sistema de reseñas con persistencia
│   ├── nav.js               # Navegación y menú lateral
│   ├── slider.js            # Slider/hero de la página principal
│   ├── search.js            # Búsqueda en tiempo real de productos
│   └── theme.js             # Modo claro/oscuro con variables CSS
└── src/
    ├── style.css            # Estilos base y variables CSS customizables
    └── output.css           # CSS compilado por Tailwind (generado automáticamente)
```

### 📄 Descripción Detallada de Archivos

| Archivo       | Responsabilidad                                                                      |
| ------------- | ------------------------------------------------------------------------------------ |
| `app.js`      | Inicialización centralizada de todas las funcionalidades en el orden correcto        |
| `products.js` | Gestión del array de productos y renderización del grid de catálogo                  |
| `cart.js`     | Gestión completa del carrito: agregar, eliminar, actualizar cantidades, persistencia |
| `wishlist.js` | Almacenamiento y gestión de lista de deseos con localStorage                         |
| `filters.js`  | Filtros avanzados: por rango de precio, marca, ordenamiento automático               |
| `reviews.js`  | Sistema de reseñas: formulario, validación, almacenamiento, cálculo de promedio      |
| `nav.js`      | Menú lateral, navegación y controles de interfaz                                     |
| `slider.js`   | Carrusel de imágenes del hero con navegación automática                              |
| `search.js`   | Búsqueda en tiempo real filtrando productos por nombre                               |
| `theme.js`    | Toggle entre modo oscuro y claro, actualización de variables CSS                     |

---

## ✨ Funcionalidades Principales

### 1️⃣ Catálogo de Productos

📄 **Archivo**: `js/products.js`  
🎯 **Función Principal**: `renderProducts()`  
📦 **Parámetros**: Ninguno

**Descripción**: Genera dinámicamente el grid de productos a partir del array `PRODUCTS` con card individuales que incluyen:

- Imagen del producto
- Nombre y marca
- Precio original y precio con descuento
- Botones para agregar al carrito y favoritos
- Data attributes para filtros (`data-brand`, `data-price`, `data-name`)

```javascript
// Array PRODUCTS con estructura de cada producto:
{
  id: 1,
  name: "Bharara King",
  brand: "BHARARA",
  originalPrice: 340000,
  discountedPrice: 25000,
  image: "assets/imgs_destacados/bharara_king_producto.png"
}
```

---

### 2️⃣ Carrito de Compras

📄 **Archivo**: `js/cart.js`  
🎯 **Función Principal**: `initCart()`  
📦 **Parámetros**: Ninguno

**Descripción**: Sistema completo de carrito con:

- Agregar/eliminar productos manualmente
- Actualizar cantidades
- Cálculo automático de totales
- Panel flotante de vista rápida
- Persistencia en localStorage
- Contador de items en el icono del carrito

**Funciones Clave Exportadas**:

- `addToCart(id, name, price)` - Agregar producto al carrito
- `removeFromCart(id)` - Eliminar producto específico
- `clearCart()` - Vaciar carrito completamente

---

### 3️⃣ Lista de Deseos (Wishlist)

📄 **Archivo**: `js/wishlist.js`  
🎯 **Función Principal**: `initWishlist()`  
📦 **Parámetros**: Ninguno

**Descripción**: Gestión de lista de deseos con:

- Agregar/quitar productos de favoritos
- Evita duplicados automáticamente
- Panel flotante con vista de productos guardados
- Contador de favoritos en el icono
- Persistencia completa en localStorage

**Funciones Clave Exportadas**:

- `addToWishlist(productId, productName, productPrice)` - Agregar a favoritos
- `removeFromWishlist(productId)` - Quitar de favoritos
- `clearWishlist()` - Vaciar lista de deseos

---

### 4️⃣ Filtros Avanzados

📄 **Archivo**: `js/filters.js`  
🎯 **Función Principal**: `initAdvancedFilters()`  
📦 **Parámetros**: Ninguno

**Descripción**: Sistema de filtrado interactivo con:

- **Filtro por Rango de Precio**: Inputs para mín. y máx.
- **Filtro por Marca**: Checkboxes para BHARARA, AFNAN, LATTAFA, DIOR, etc.
- **Ordenamiento**: Menor a Mayor / Mayor a Menor
- **Combinación de Filtros**: Todos funcionan juntos simultáneamente
- **Limpiar Filtros**: Botón para resetear y mostrar todos los productos
- Panel flotante en el header con diseño elegante

**Características**:

- Filtros en tiempo real sin necesidad de botón "Aplicar"
- Lee datos de las cards: `data-price`, `data-brand`
- Oculta/muestra productos dinámicamente
- Reorganiza orden automáticamente según ordenamiento seleccionado

---

### 5️⃣ Búsqueda en Tiempo Real

📄 **Archivo**: `js/search.js`  
🎯 **Función Principal**: `initSearch()`  
📦 **Parámetros**: Ninguno

**Descripción**: Búsqueda instantánea de productos:

- Busca por nombre del producto
- Filtrado en tiempo real mientras se escribe
- Oculta/muestra cards automáticamente
- Input ubicado en el header derecho

---

### 6️⃣ Sistema de Reseñas

📄 **Archivo**: `js/reviews.js`  
🎯 **Función Principal**: `renderReviews()`  
📦 **Parámetros**: Ninguno

**Descripción**: Sistema completo de reseñas con:

- Formulario para escribir reseña (nombre, puntuación 1-5 estrellas, comentario)
- Validación básica (todos los campos obligatorios)
- Interfaz de estrellas visual e interactiva (★)
- Cálculo automático de puntuación media
- Mostrar reseñas en orden cronológico inverso (más reciente primero)
- Persistencia en localStorage (`maison-reviews`)
- Muestra fecha formateada de cada reseña

**Funciones Clave Exportadas**:

- `renderReviews()` - Renderiza formulario y lista de reseñas
- `addReview(name, rating, comment)` - Agregar nueva reseña con validación

**Estructura de Reseña Guardada**:

```javascript
{
  id: 1710681234567,
  name: "Juan García",
  rating: 5,
  comment: "Excelente aroma, llegó rápido!",
  date: "2026-03-16T15:20:34.567Z"
}
```

---

### 7️⃣ Navegación y Menú

📄 **Archivo**: `js/nav.js`  
🎯 **Función Principal**: `initNav()`  
📦 **Parámetros**: Ninguno

**Descripción**: Gestión del menú lateral:

- Botón hamburguesa (threebars) para abrir/cerrar menú
- Navegación por categorías
- Overlay para cerrar el menú

---

### 8️⃣ Slider del Hero

📄 **Archivo**: `js/slider.js`  
🎯 **Función Principal**: `initSlider()`  
📦 **Parámetros**: Ninguno

**Descripción**: Carrusel automático:

- Rotación automática de banners cada 5 segundos
- Transición suave entre slides
- Track de slides con contenedor responsive

---

### 9️⃣ Modo Claro/Oscuro

📄 **Archivo**: `js/theme.js`  
🎯 **Función Principal**: `initThemeToggle()`  
📦 **Parámetros**: Ninguno

**Descripción**: Sistema de temas:

- Toggle entre modo oscuro (por defecto) y claro
- Persiste la preferencia en localStorage
- Actualiza variables CSS dinámicamente
- Variables: `--bg`, `--text`, `--accent`, `--card-bg`

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Agregar un Nuevo Producto al Catálogo

Para agregar un nuevo perfume al array `PRODUCTS` en `js/products.js`:

```javascript
const PRODUCTS = [
  // ... productos existentes ...
  {
    id: 9,
    name: "Tom Ford Black Orchid",
    brand: "TOM FORD",
    originalPrice: 350000,
    discountedPrice: 85000,
    image: "assets/imgs_destacados/tom_ford_black_orchid_producto.png",
  },
];
```

Luego, simplemente llama a `renderProducts()` en `app.js` y el nuevo producto aparecerá automáticamente en el grid.

---

### Ejemplo 2: Agregar un Producto al Carrito Programáticamente

Desde cualquier módulo o consola del navegador:

```javascript
// Importar desde app.js o acceder globalmente
const productId = 1;
const productName = "Bharara King";
const productPrice = 25000;

// La lógica se dispara automáticamente cuando el usuario hace click
// en el botón "AÑADIR AL CARRITO" dentro de la card
// Pero puedes hacerlo manualmente:
addToCart(productId, productName, productPrice);
```

En la práctica, los botones de las cards tienen event listeners que llaman a `addToCart()` con los datos del atributo.

---

### Ejemplo 3: Sistema de Reseñas - Flujo Completo

1. **Usuario llena el formulario** en la sección de RESEÑAS:
   - Nombre: "María González"
   - Puntuación: 5 estrellas (★★★★★)
   - Comentario: "Aroma increíble, duración excelente"

2. **Usuario hace click en "ENVIAR RESEÑA"**

3. **Validación en `addReview()`**:
   - Verifica que todos los campos estén llenos
   - Si falta algo, muestra alerta

4. **Si válido**:
   - Se crea objeto reseña con timestamp automático
   - Se guarda en localStorage bajo clave `maison-reviews`
   - Se recalcula el promedio de puntuación
   - Se actualiza la lista mostrando la reseña nueva al principio

5. **La reseña persiste** incluso después de refrescar la página

**Código de ejemplo desde la consola**:

```javascript
import { addReview } from "./reviews.js";

addReview(
  "Juan García",
  4,
  "Muy buena fragancia, excelente relación precio-calidad",
);
// → Validación automática, almacenamiento, y renderización
```

---

### Ejemplo 4: Usar Filtros Combinados

El usuario en la página hace:

1. **Abre panel de filtros** (botón filtro en header)
2. **Establece rango de precio**: Mín: 30000, Máx: 70000
3. **Selecciona marcas**: ✓ AFNAN, ✓ LATTAFA
4. **Ordena por precio**: "Mayor a Menor"

**Resultado**:

- Solo muestra productos AFNAN y LATTAFA
- Dentro del rango 30000-70000
- Ordenados de mayor a menor precio
- Todo en tiempo real, sin botón de aplicar

**Para limpiar**: Click en "Limpiar Filtros" → vuelven todos los productos

---

### Ejemplo 5: Búsqueda mientras se Filtra

Valor agregado: Los filtros y la búsqueda **NO interfieren**:

- Si tienes filtros activos y escribes en la búsqueda, solo filtra dentro de los resultados del filtro
- Es una combinación natural de ambas funcionalidades

```
Usuario:
1. Abre filtros, selecciona DIOR
2. En búsqueda escribe "sauvage"
3. Resultado: Solo productos de DIOR con "sauvage" en el nombre
```

---

## 🚀 Cómo Ejecutar el Proyecto

### Requisitos Previos

- Node.js 14+ instalado
- npm (incluido con Node.js)
- Un navegador moderno (Chrome, Firefox, Safari, Edge)

### Pasos de Instalación

#### 1. **Clonar el repositorio** (si es tu primer acceso):

```bash
git clone https://github.com/JuanGiraldo777/taskflow-project.git
cd taskflow-project/ejercicio_web
```

#### 2. **Instalar dependencias** (desde la raíz del proyecto):

```bash
npm install
```

Esto instala Tailwind CSS, PostCSS y otras dependencias necesarias.

#### 3. **Compilar CSS** (Tailwind):

Hay dos opciones:

**Opción A - Compilación única**:

```bash
npm run build
```

**Opción B - Watch mode** (recompila automáticamente al cambiar CSS):

```bash
npm run watch
```

Se ejecuta en segundo plano. Presiona `Ctrl+C` para detener.

#### 4. **Abrir el servidor local**:

Con tu editor VS Code, usa la extensión **Live Server**:

1. Click derecho en `index.html`
2. Selecciona "Open with Live Server"
3. Se abre automáticamente en `http://localhost:5500`

O desde terminal:

```bash
# Si tienes Python 3:
python -m http.server 8000

# Luego abre en navegador:
# http://localhost:8000/ejercicio_web/
```

#### 5. **Ver en navegador**:

- 🌐 http://localhost:5500 (con Live Server)
- 🌐 http://localhost:8000/ejercicio_web/ (con Python)

---

### Comandos Disponibles

```bash
npm run build   # Compila CSS una sola vez
npm run watch   # Compila CSS automáticamente al guardar cambios
npm test        # (No configurado aún)
```

---

### Desarrollo

Mientras desarrollas:

1. **Terminal 1** - Mantén el watch activo:

   ```bash
   npm run watch
   ```

2. **Terminal 2 / Live Server** - Sirve la página

   ```bash
   # O usa Live Server desde VS Code
   ```

3. **Edita archivos**:
   - `.js` → Cambios inmediatos con Live Server reload
   - `style.css` → Compila automáticamente a `output.css`
   - `index.html` → Recarga automática

---

## 🏗️ Arquitectura y Decisiones Técnicas

### Patrón de Arquitectura: Modular Separado por Responsabilidades

El proyecto sigue un **patrón modular** donde cada funcionalidad está en su propio archivo JavaScript, con una **responsabilidad única y clara**:

```
Responsabilidad Única
     ↓
Un archivo JS
     ↓
Una o dos funciones exportadas
     ↓
listeners y lógica encapsulada
```

### Por qué se separaron los módulos:

| Beneficio          | Explicación                                      |
| ------------------ | ------------------------------------------------ |
| **Mantenibilidad** | Cada dev sabe exactamente dónde encontrar código |
| **Debugging**      | Errores aislados a un módulo específico          |
| **Reutilización**  | Cada módulo es independiente y portable          |
| **Testing**        | Fácil de testear cada funcionalidad por separado |
| **Escalabilidad**  | Agregar nuevas funciones sin afectar existentes  |
| **Colaboración**   | Múltiples devs pueden trabajar en paralelo       |

---

### Patrón de Inicialización en `app.js`

```javascript
// 1. Renderiza DOM (productos, grid)
renderProducts();

// 1.5 Inicializa funcionalidades que dependen de renderProducts()
initAdvancedFilters();

// 2-6. Inicializa interfaces y event listeners
initNav();
initSlider();
initSearch();
initCart();
initThemeToggle();

// 7-8. Inicializa después que todo lo anterior está listo
initWishlist();
renderReviews();
```

**Este orden es crítico** porque:

- `initWishlist()` necesita que `.product-card` exista (renderizado antes)
- `renderReviews()` solo necesita que el HTML del `#reviews-section` exista
- Los filtros operan sobre las cards ya renderizadas
- Evita errores de "elemento no encontrado"

---

### Persistencia con localStorage

Todos los datos del usuario se guardan automáticamente:

```javascript
// Carrito
localStorage.getItem("cart") → Array de CartItems

// Wishlist
localStorage.getItem("wishlist") → Array de items favoritos

// Reseñas
localStorage.getItem("maison-reviews") → Array de reviews

// Tema
localStorage.getItem("theme") → "light" o "dark"
```

**Ventaja**: Los datos sobreviven a:

- ✅ Refresh de página
- ✅ Cierre y reapertura del navegador
- ✅ Cambio de pestaña
- ✅ Cambio de máquina (mismo navegador, misma cuenta)

---

### Variables CSS Dinámicas para Temas

En `src/style.css`:

```css
:root {
  --bg: #1a1a1a;
  --text: #ffffff;
  --accent: #d4af37;
  --card-bg: #2a2a2a;
}

html.light-mode {
  --bg: #ffffff;
  --text: #1a1a1a;
  --accent: #d4af37;
  --card-bg: #f5f5f5;
}
```

En `theme.js`, al cambiar tema:

```javascript
document.documentElement.classList.toggle("light-mode");
```

Tailwind interpola automáticamente: `bg-(--bg)` → `background-color: var(--bg)`

---

### Flujo de Datos

```
Usuario Interacción
      ↓
Event Listener en módulo JS
      ↓
Modificar array en memoria (cartItems, wishlist, PRODUCTS, etc.)
      ↓
Guardar en localStorage
      ↓
Renderizar cambios en DOM
      ↓
Usuario ve actualización
```

**Ejemplo - Agregar a Carrito**:

```javascript
// 1. Usuario hace click
button.addEventListener("click", () => {
  // 2. Modificar cartItems
  cartItems.push({ id, name, price, quantity });

  // 3. Guardar
  saveCartToStorage();

  // 4. Renderizar
  renderCart();
});
```

---

### Importancia de async/localStorage

Todos los módulos hacen referencia a la misma clave de localStorage:

```javascript
// cart.js
const CART_STORAGE_KEY = "cart";

// wishlist.js
localStorage.getItem("wishlist");

// Si ambos módulos guardan al mismo tiempo, podría haber pérdida de datos
// → Pero en nuestro proyecto es improbable porque las APIs son síncronas
```

**Mejora futura**: Implementar un EventBus para comunicación entre módulos.

---

## 📝 Notas Importantes

1. **Datos de Prueba**: El array `PRODUCTS` contiene 8 perfumes reales con precios ficticios para demostración.

2. **localStorage Límite**: Típicamente ~5-10MB por dominio. Para este proyecto es más que suficiente.

3. **Compatibilidad**: Requiere navegadores modernos (2020+) due to ES6 modules.

4. **Seguridad**: No hay autenticación ni backend. Los datos se guardan localmente, serían públicos si se agrega un servidor.

5. **Escalabilidad**: Para convertir a producción:
   - Conectar a backend API
   - Implementar login/cuenta de usuario
   - Usar base de datos real (MongoDB, PostgreSQL)
   - Agregar procesamiento de pagos (Stripe, PayPal)

---

## 🎓 Lecciones Clave del Proyecto

✅ **JavaScript Vanilla**: Sin frameworks, solo DOM vanilla  
✅ **Modular Design**: Responsabilidades separadas  
✅ **ES6 Modules**: `import`/`export` en el navegador  
✅ **localStorage API**: Persistencia del lado del cliente  
✅ **Event Listeners**: Manipulación reactiva del DOM  
✅ **TailwindCSS**: Utility-first CSS  
✅ **CSS Variables**: Temas dinámicos  
✅ **Debugging**: Console, DevTools, localStorage inspection