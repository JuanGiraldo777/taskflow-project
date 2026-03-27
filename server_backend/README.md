# Backend API - Maison de L'Eternel

API REST para e-commerce de perfumeria: autenticacion, catalogo, carrito, wishlist, reseñas, historial de usuario y administracion.

## 1. Stack tecnico

- Node.js + Express 5
- MySQL 8 (`mysql2/promise`)
- JWT (`jsonwebtoken`)
- Hash de contraseñas (`bcryptjs`)
- CORS + JSON API

## 2. Estructura del backend

```txt
server_backend/
├── src/
│   ├── index.js
│   ├── config/
│   │   ├── env.js
│   │   ├── db.js
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   └── services/
├── package.json
└── .env.example
```

## 3. Variables de entorno

Requeridas (validadas por `src/config/env.js`):

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=defaultdb
JWT_SECRET=tu_clave_super_segura
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Si falta una variable critica, el servidor no arranca (fail fast).

## 4. Arranque

```bash
cd server_backend
npm install
npm run dev
```

Servidor: `http://localhost:3000`

Healthcheck:

```http
GET /health
```

Respuesta:

```json
{
  "status": "ok",
  "message": "Servidor Maison activo"
}
```

## 5. Modelo de datos (resumen)

Tablas principales:

- `users`
- `products`
- `product_images`
- `brands`
- `categories`
- `cart_items`
- `wishlist_items`
- `reviews`
- `viewed_products`

Scripts SQL:

- Esquema: `src/config/schema.sql`
- Seed: `src/config/seed.sql`

## 6. Autenticacion y seguridad

### 6.1 JWT

Rutas protegidas requieren:

```http
Authorization: Bearer <token>
```

### 6.2 Roles

- `user`: flujo normal
- `admin`: rutas bajo `/api/v1/admin` y escritura en productos

### 6.3 Middlewares

- `verifyToken`: valida JWT y carga `req.user`
- `verifyAdmin`: exige `req.user.role === "admin"`
- `errorHandler`: mapea errores de negocio y errores tecnicos

## 7. Errores estandar

Errores de negocio principales:

- `NOT_FOUND` -> 404
- `INVALID_CREDENTIALS` -> 401
- `EMAIL_TAKEN` -> 409
- `ALREADY_REVIEWED` -> 409
- `OUT_OF_STOCK` -> 400
- `INVALID_QUANTITY` -> 400

Error JSON malformado -> `400`.
Error inesperado -> `500` (`details` y `stack` solo en desarrollo).

## 8. API detallada

Base URL local: `http://localhost:3000/api/v1`

### 8.1 Auth

#### `POST /auth/register`

Body:

```json
{
  "fullName": "Juan Perez",
  "email": "juan@email.com",
  "password": "123456"
}
```

Validaciones:

- `fullName`, `email`, `password` obligatorios
- `password` minimo 6 caracteres
- email unico

Respuesta `201`:

```json
{
  "id": 7,
  "fullName": "Juan Perez",
  "email": "juan@email.com",
  "role": "user"
}
```

Errores: `400`, `409`.

#### `POST /auth/login`

Body:

```json
{
  "email": "juan@email.com",
  "password": "123456"
}
```

Respuesta `200`:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 7,
    "fullName": "Juan Perez",
    "email": "juan@email.com",
    "role": "user"
  }
}
```

Errores: `400`, `401`.

### 8.2 Products

#### `GET /products`

Query params opcionales:

- `search`
- `category` (id)
- `brand` (slug, repetible)
- `minPrice`
- `maxPrice`
- `sortBy`: `price-asc | price-desc | name-asc | name-desc`
- `page` (default 1)
- `limit` (default 10)

Respuesta `200`:

```json
{
  "data": [
    {
      "id": 1,
      "name": "9PM",
      "brand": "Afnan",
      "original_price": 49.99,
      "discounted_price": 42.99,
      "price": 42.99,
      "stock": 25,
      "category": "Oriental",
      "image": "/assets/imgs_destacados/afnan_9pm_producto.png"
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

Errores: `400` en parametros invalidos.

#### `GET /products/:id`

Respuesta `200`:

```json
{
  "id": 1,
  "brand_id": 1,
  "category_id": 2,
  "name": "9PM",
  "description": "...",
  "original_price": 49.99,
  "discounted_price": 42.99,
  "price": 42.99,
  "stock": 25,
  "brand": "Afnan",
  "category": "Oriental",
  "images": [
    { "url": "/assets/imgs_destacados/afnan_9pm_producto.png", "is_main": 1 }
  ]
}
```

Errores: `400`, `404`.

#### `GET /products/:id/related`

Devuelve hasta 4 productos relacionados (prioriza marca, completa con categoria).

Respuesta `200`: array de productos resumidos.

#### `POST /products` (admin)

Body:

```json
{
  "categoryId": 2,
  "brandId": 1,
  "name": "Nuevo Perfume",
  "description": "Descripcion",
  "originalPrice": 99.9,
  "discountedPrice": 79.9,
  "stock": 10,
  "imageUrl": "/assets/imgs_destacados/nuevo.png"
}
```

Respuesta `201`: producto completo (formato de `GET /products/:id`).

Errores: `400`, `401`, `403`.

#### `PUT /products/:id` (admin)

Mismo body que create (sin `imageUrl` en update actual).

Respuesta `200`: producto actualizado.

#### `DELETE /products/:id` (admin)

Respuesta `204` sin body.

### 8.3 Categories

#### `GET /categories`

Respuesta `200`:

```json
[
  { "id": 1, "name": "Floral", "slug": "floral" }
]
```

### 8.4 Brands

#### `GET /brands`

Respuesta `200`:

```json
[
  { "id": 1, "name": "Afnan", "slug": "afnan" }
]
```

### 8.5 Users (token requerido)

Regla: el usuario solo puede operar sobre su propio `:id`.

#### `GET /users/:id`

Respuesta `200`:

```json
{
  "id": 7,
  "full_name": "Juan Perez",
  "email": "juan@email.com",
  "favorite_perfume": null,
  "perfume_rec": null,
  "discount_code": null,
  "role": "user",
  "created_at": "2026-03-28T10:00:00.000Z"
}
```

Errores: `403`, `404`.

#### `PUT /users/:id`

Body:

```json
{
  "fullName": "Juan Perez",
  "favoritePerfume": "Sauvage",
  "perfumeRec": "Aventus para ocasiones especiales"
}
```

Respuesta `200`: perfil actualizado (`snake_case` desde BD).

#### `DELETE /users/:id`

Respuesta `204`.

#### `GET /users/:id/history`

Respuesta `200`: ultimos 10 productos vistos.

#### `POST /users/:id/history`

Body:

```json
{ "productId": 3 }
```

Respuesta `201`:

```json
{ "message": "Producto añadido al historial" }
```

### 8.6 Cart (token requerido)

#### `GET /cart`

Respuesta `200`:

```json
{
  "items": [
    {
      "id": 11,
      "quantity": 2,
      "product_id": 3,
      "name": "Asad",
      "price": 38.99,
      "brand": "Lattafa",
      "image": "/assets/..."
    }
  ],
  "total": 77.98
}
```

#### `POST /cart/items`

Body:

```json
{ "productId": 3, "quantity": 1 }
```

Respuesta `201`: carrito completo.

#### `PUT /cart/items/:id`

Body:

```json
{ "quantity": 3 }
```

Respuesta `200`: carrito completo.

#### `DELETE /cart/items/:id`

Respuesta `200`: carrito actualizado.

#### `DELETE /cart`

Respuesta `200`:

```json
{ "message": "carrito vacio" }
```

### 8.7 Wishlist (token requerido)

#### `GET /wishlist`

Respuesta `200`: array de items de wishlist.

#### `POST /wishlist`

Body:

```json
{ "productId": 5 }
```

Respuesta `201`: wishlist completa.

#### `DELETE /wishlist/:id`

Respuesta `200`: wishlist actualizada.

#### `DELETE /wishlist`

Respuesta `200`:

```json
{ "message": "wishlist vacia" }
```

### 8.8 Reviews

#### `GET /reviews/:productId` (publica)

Respuesta `200`:

```json
[
  {
    "id": 4,
    "rating": 5,
    "comment": "Excelente",
    "created_at": "2026-03-28T11:00:00.000Z",
    "author": "Juan Perez"
  }
]
```

#### `POST /reviews/:productId` (token requerido)

Body:

```json
{ "rating": 5, "comment": "Muy buena duracion" }
```

Respuesta `201`:

```json
{
  "id": 9,
  "rating": 5,
  "comment": "Muy buena duracion",
  "discountCode": "MAISON-2026-ABC123"
}
```

Notas:

- 1 reseña por usuario por producto.
- Al crear reseña se genera/actualiza `discount_code` del usuario.

### 8.9 Admin (token + role admin)

#### `GET /admin/users`

Respuesta `200`: listado completo de usuarios.

#### `DELETE /admin/users/:id`

Reglas:

- no permite eliminarse a si mismo (admin actual)

Respuesta `204`.

## 9. Pruebas

Actualmente no hay tests automatizados (`npm test` no implementado). Se recomienda:

### 9.1 Pruebas manuales API

Herramientas:

- Postman
- Thunder Client
- curl

### 9.2 Flujo minimo de smoke test

1. `GET /health`
2. `POST /auth/register`
3. `POST /auth/login`
4. `GET /products`
5. `POST /cart/items` con token
6. `GET /cart`
7. `POST /wishlist`
8. `POST /reviews/:productId`
9. `GET /users/:id/history`
10. `GET /admin/users` con token admin

### 9.3 Ejemplo rapido con curl

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@maison.com","password":"123456"}'

# Productos
curl http://localhost:3000/api/v1/products?search=asad&sortBy=price-asc
```

## 10. Mejoras recomendadas

- Suite de tests (Jest + Supertest)
- Validacion de entrada con esquema (Zod/Joi)
- Documentacion OpenAPI/Swagger
- Rate limiting y hardening de seguridad
- Logging estructurado y trazas
