# Proyecto Practicas CE - TaskFlow / Maison

Repositorio de practicas DAM con un e-commerce completo de perfumeria dividido en frontend y backend.

## Estado actual

Proyecto funcional de extremo a extremo:

- Frontend modular en JavaScript vanilla
- Backend REST en Express + MySQL
- Autenticacion JWT
- Perfil de usuario, carrito, wishlist, reseñas, historial
- Rutas de administracion y CRUD de productos

## Arquitectura

```txt
proyecto_practicas_CE/
├── ejercicio_web/         # Frontend (catalogo, detalle, UI, integracion API)
├── server_backend/        # API REST y logica de negocio
├── docs/                  # Documentacion academica y de experimentacion
├── package.json           # Scripts CSS (Tailwind/PostCSS)
└── README.md
```

## Tecnologias usadas

### Frontend

- HTML5
- CSS + TailwindCSS
- PostCSS
- JavaScript ES Modules
- Fetch API
- localStorage (token/sesion)

### Backend

- Node.js
- Express 5
- MySQL 8
- mysql2/promise
- JSON Web Token
- bcryptjs
- dotenv
- cors

### Tooling

- npm
- nodemon
- Live Server (recomendado para frontend)

## Funcionalidades implementadas

### Catalogo y producto

- Listado de productos remoto desde backend
- Busqueda por texto
- Filtros por precio y marcas
- Ordenacion por precio y nombre
- Pagina de detalle con galeria
- Productos relacionados

### Usuario y autenticacion

- Registro
- Login
- Cierre de sesion
- Perfil editable
- Eliminacion de perfil
- Historial de productos vistos

### Compra y engagement

- Carrito persistente en backend
- Wishlist persistente en backend
- Reseñas por producto
- Codigo de descuento generado al reseñar

### Administracion

- Listado de usuarios (admin)
- Eliminacion de usuarios (admin)
- CRUD de productos (admin)

## Scripts de proyecto

### Raiz

```bash
npm install
npm run build
npm run watch
```

### Backend

```bash
cd server_backend
npm install
npm run dev
npm start
```

## Entornos y configuracion

### Frontend

- URL backend configurada en `ejercicio_web/js/api/client.js`
- Para local: `http://localhost:3000/api/v1`

### Backend

Crear `.env` en `server_backend/` con:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=defaultdb
JWT_SECRET=tu_secreto
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## Documentacion especifica

- Backend detallado: `server_backend/README.md`
- Frontend detallado: `ejercicio_web/README.md`
- SQL schema/seed: `server_backend/src/config/schema.sql`, `server_backend/src/config/seed.sql`

## Calidad y pruebas

- Pruebas automatizadas: no implementadas aun
- Pruebas manuales: documentadas en README de backend y frontend
- Manejo de errores centralizado en backend (`errorHandler`)

## Mejoras recomendadas

- Tests automatizados (backend + e2e frontend)
- Documentacion OpenAPI/Swagger
- CI/CD con lint + tests
- Hardening de seguridad (rate limiting, helmet, validacion de payload)
