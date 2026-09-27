# Agencia de Viajes y Turismo Multisucursal — Destinos

Hoja de repaso · Desarrollo Web · MA. Ing. Elvis Morales
Universidad Mariano Gálvez — Centro Universitario Cuilapa, Santa Rosa

Tabla asignada: **Tbl_Destinos**

| Parte | Tecnología | Puerto |
|---|---|---|
| Base de datos | PostgreSQL 16 (Docker) | 5433 |
| Administración | pgAdmin 4 (Docker) | 5050 |
| Backend (API REST) | Node.js + NestJS | 3001 |
| Frontend | Next.js 15 (React) | 3000 |

```
agencia-viajes/
├── database/              Scripts SQL (se ejecutan solos al levantar Docker)
│   ├── 01_tablas.sql          Tbl_Destinos + Tbl_Usuarios (+ Proveedores/Hoteles para la relación)
│   ├── 02_sp_destinos.sql     5 SP CRUD: consultar, buscar, agregar, editar, eliminar
│   ├── 03_sp_auth.sql         SP de login, refresh, logout, registro, perfil
│   └── 04_datos_prueba.sql    5 destinos + usuario admin + 1 hotel ligado al destino 1
├── backend/               API NestJS (controller → service → repository → SP)
├── frontend/              Next.js (login + CRUD con renovación automática del token)
├── postman/               Colección lista para importar
├── pgadmin/servers.json   Registra el servidor en pgAdmin automáticamente
└── docker-compose.yml
```

---

## 1. Levantar la base de datos

```bash
docker compose up -d
```

La primera vez crea la BD `agencia_viajes_db` y ejecuta todos los scripts de `database/`.

- pgAdmin: http://localhost:5050 (el servidor ya aparece registrado; contraseña `Admin123`)
- Conexión desde fuera de Docker: `localhost:5433`, usuario `postgres`, contraseña `Admin123`

> Si cambias un script y quieres que se vuelva a ejecutar: `docker compose down -v` y luego `docker compose up -d` (esto borra los datos).

## 2. Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

El archivo `.env` ya viene listo (copia de `.env.example`). API en `http://localhost:3001/api`.

## 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Abrir http://localhost:3000 → usuario **admin** / contraseña **Admin123**.

---

## Autenticación: Access Token + Refresh Token

1. `POST /api/auth/login` → devuelve `accessToken` (JWT, dura **5 min**) y `refreshToken` (dura **7 días**).
2. Cada petición a `/api/destinos` lleva `Authorization: Bearer <accessToken>`.
3. Cuando el access token vence, el API responde **401**. El cliente llama a `POST /api/auth/refresh` con el refresh token y recibe **un par nuevo** (el refresh anterior queda inválido: rotación).
4. `POST /api/auth/logout` invalida el refresh token.

En la BD solo se guarda el **hash SHA-256** del refresh token y la contraseña cifrada con **bcrypt** (pgcrypto). Todo el acceso a datos, incluido el login, se hace por stored procedures.

En el frontend esto es automático: si una petición recibe 401, renueva el token y reintenta sin que el usuario lo note. La barra superior muestra el tiempo restante del access token.

Para ver la renovación en vivo rápido, cambia en `backend/.env`: `JWT_ACCESS_EXPIRES=30s`.

## Endpoints

| Operación | Método | Ruta | Protegida |
|---|---|---|---|
| Login | POST | `/api/auth/login` | No |
| Refresh | POST | `/api/auth/refresh` | No (usa refreshToken) |
| Logout | POST | `/api/auth/logout` | No (usa refreshToken) |
| Registro | POST | `/api/auth/registro` | No |
| Perfil | GET | `/api/auth/perfil` | Sí |
| **Consultar** | GET | `/api/destinos` | Sí |
| **Buscar** | GET | `/api/destinos/:codigo` | Sí |
| **Agregar** | POST | `/api/destinos` | Sí |
| **Editar** | PUT | `/api/destinos/:codigo` | Sí |
| **Eliminar** | DELETE | `/api/destinos/:codigo` | Sí |

### Formato JSON de respuesta

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Destino encontrado con éxito.",
  "data": { "codigoDestino": 3, "nombreDestino": "Torre Eiffel", "...": "..." }
}
```

| Código | Significado | Ejemplo de mensaje |
|---|---|---|
| 200 | Éxito | Destino actualizado exitosamente. |
| 201 | Creado | Destino agregado exitosamente. |
| 400 | Datos inválidos | El nombre del destino es obligatorio. |
| 401 | Sin token / token vencido | El access token expiró. Renueve la sesión con el refresh token. |
| 404 | Registro inexistente | El destino con el código 99 no existe. |
| 409 | Duplicado / registro relacionado | No se puede eliminar el destino 1 porque tiene registros relacionados… |
| 500 | Error | Error interno al … |

### Body para Agregar / Editar

```json
{
  "nombreDestino": "Coliseo Romano",
  "ciudad": "Roma",
  "pais": "Italia",
  "continente": "Europa",
  "descripcion": "Ciudad eterna: historia, arte y gastronomía.",
  "clima": "Mediterráneo",
  "moneda": "Euro (EUR)",
  "idiomaPrincipal": "Italiano",
  "requiereVisa": 1,
  "costoPromedioDiario": 1850.50,
  "estado": 1
}
```

## Postman

Importar `postman/Agencia_Viajes_Destinos.postman_collection.json`.
Ejecutar primero **1. Auth → Login**: guarda `accessToken` y `refreshToken` en las variables de la colección y todas las demás peticiones los usan solas.

El destino **1 (Antigua Guatemala)** tiene un hotel relacionado, así que eliminarlo devuelve **409** a propósito.

## Verificar en PostgreSQL

```sql
SELECT * FROM sp_destinos_consultar();
SELECT * FROM Tbl_Destinos ORDER BY CodigoDestino;
```

## Subir a GitHub

```bash
git remote add origin https://github.com/Elmer-Fuentes/agencia-viajes.git
git branch -M main
git push -u origin main
```
