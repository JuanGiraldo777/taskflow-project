# Frontend - Maison de L'Eternel

Aplicacion frontend de e-commerce de perfumeria conectada a API REST real.

## 1. Tecnologias

- HTML5 semantico (`index.html`, `producto.html`)
- JavaScript ES Modules (arquitectura modular)
- TailwindCSS + CSS variables
- PostCSS (build de CSS)
- Fetch API + JWT en `localStorage`

## 2. Estructura actual

```txt
ejercicio_web/
├── index.html
├── producto.html
├── assets/
├── js/
│   ├── app.js
│   ├── api/client.js
│   ├── products.js
│   ├── cart.js
│   ├── wishlist.js
│   ├── filters.js
│   ├── search.js
│   ├── nav.js
│   ├── slider.js
│   ├── theme.js
│   ├── reviews.js
│   ├── user.js
│   └── pages/producto.js
└── src/
    ├── style.css
    └── output.css
```

## 3. Flujo funcional del frontend

### 3.1 Arranque

`js/app.js` inicializa:

1. usuario/sesion (`initUser`)
2. filtros (`initAdvancedFilters`)
3. navegacion (`initNav`)
4. slider (`initSlider`)
5. busqueda (`initSearch`)
6. carrito (`initCart`)
7. tema (`initThemeToggle`)
8. wishlist (`initWishlist`)
9. reseñas (`renderReviews`)
10. carga de catalogo (`fetchProducts`)

### 3.2 Catalogo remoto

`products.js` consume `GET /api/v1/products` y renderiza cards dinamicas.

Soporta:

- paginacion backend
- filtro por marca (multi-value)
- rango de precio
- ordenacion
- busqueda textual

### 3.3 Carrito conectado a backend

`cart.js` + `api/client.js` usan:

- `GET /cart`
- `POST /cart/items`
- `PUT /cart/items/:id`
- `DELETE /cart/items/:id`
- `DELETE /cart`

Incluye drawer lateral, contador, totales y sincronizacion por eventos (`sync-cart`, `user-logged-in`, `session-expired`).

### 3.4 Wishlist conectada a backend

`wishlist.js` usa:

- `GET /wishlist`
- `POST /wishlist`
- `DELETE /wishlist/:id`
- `DELETE /wishlist`

Caracteristicas:

- iconos activos/inactivos por producto
- panel desplegable de favoritos
- contador en header

### 3.5 Sesion y perfil

`user.js` gestiona:

- registro/login (`/auth/register`, `/auth/login`)
- modal de perfil editable
- historial de vistos (`/users/:id/history`)
- actualizacion de perfil (`PUT /users/:id`)
- borrado de cuenta (`DELETE /users/:id`)

### 3.6 Reseñas

`reviews.js` gestiona:

- lectura de reseñas por producto (`GET /reviews/:productId`)
- alta de reseña autenticada (`POST /reviews/:productId`)
- validacion de formulario
- visualizacion de promedio
- visualizacion y guardado de discount code generado por backend

### 3.7 Pagina detalle

`js/pages/producto.js`:

- carga detalle (`GET /products/:id`)
- carga relacionados (`GET /products/:id/related`)
- integra carrito y wishlist desde el detalle
- registra producto visto en historial

### 3.8 UI transversal

- `nav.js`: menu lateral + overlay
- `search.js`: barra con tendencias y busqueda remota
- `filters.js`: panel de filtros conectado al backend
- `slider.js`: hero automatico
- `theme.js`: light/dark mode con persistencia local

## 4. Configuracion API

`js/api/client.js` usa `BASE_URL`:

- actual: `https://maison-backend-7pq8.onrender.com/api/v1`

Si trabajas local, cambia a:

```js
const BASE_URL = "http://localhost:3000/api/v1";
```

## 5. Eventos de sincronizacion interna

Eventos custom usados en app:

- `user-logged-in`
- `session-expired`
- `products-rendered`
- `sync-cart`
- `sync-wishlist`

## 6. Ejecucion

Desde raiz del proyecto:

```bash
npm install
npm run build
npm run watch
```

Abrir `ejercicio_web/index.html` con Live Server (VS Code) o servidor estatico.

## 7. Pruebas manuales recomendadas

1. Login/registro correcto e incorrecto
2. Filtros + busqueda combinados
3. Add/remove carrito y recalculo de total
4. Add/remove wishlist en catalogo y detalle
5. Crear reseña validando errores y codigo descuento
6. Editar perfil y comprobar persistencia
7. Sesion expirada (401) y limpieza automatica de token

## 8. Incidencias conocidas / deuda tecnica

- `js/pages/producto.js` usa una llamada `fetch` hardcodeada a `localhost` en relacionados; se recomienda unificar con `api/client.js`.
- No existe test automatizado del frontend.
- No hay estado global centralizado; la comunicacion se basa en eventos.

## 9. Roadmap sugerido

- Integrar router frontend para navegacion SPA opcional
- Implementar paginacion visual en catalogo
- Añadir validaciones con mensajes inline unificados
- Incorporar pruebas E2E (Playwright/Cypress)
