# UniJobs Admin API

Admin API para operaciones privilegiadas usando Supabase Service Role.

## Endpoints

- `GET /health` — estado del servicio.
- `POST /create-user` — crea usuario y su perfil.
  - body: `{ email, password, role, name? }`
  - devuelve: `{ ok, userId }`
- `POST /reset-password` — genera enlace de recuperación para un email.
  - body: `{ email }`
  - devuelve: `{ ok, action_link }`
- `POST /update-profile` — actualiza perfil (first_name, university, role).
  - body: `{ user_id, first_name?, university?, role? }`
  - devuelve: `{ ok }`
- `GET /search-users` — busca por email y une con profiles; filtros opcionales.
  - query: `email?, role?, university?, limit?`
  - devuelve: `{ ok, results: [{ id, email, first_name, role, university, company_verified, created_at }] }`
- `POST /log` — inserta acción en `admin_logs`.
  - body: `{ actorId, action, entity, entityId?, details? }`
  - devuelve: `{ ok }`
- `POST /authorize-user` — marca email como confirmado.
  - body: `{ user_id? , email? }` (requiere al menos uno)
  - devuelve: `{ ok }`
- `POST /toggle-job-active` — activa/desactiva un puesto.
  - body: `{ job_id, active }`
  - devuelve: `{ ok }`
- `POST /toggle-company-suspended` — suspende/activa una empresa.
  - body: `{ company_id, suspended }`
  - devuelve: `{ ok }`
- `POST /update-application-status` — actualiza estado de una postulación.
  - body: `{ app_id, new_status }`
  - devuelve: `{ ok }`

## Variables de entorno

Crea `.env` copiando de `.env.example`:

```
PORT=8787
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=... // tu URL de proyecto
SUPABASE_SERVICE_ROLE_KEY=... // clave de Service Role
ADMIN_API_TOKEN=change-me-strong-token // opcional, para proteger endpoints
```

> Nota: `ADMIN_API_TOKEN` habilita un chequeo simple vía cabecera `X-Admin-Token`. Si no lo estableces, los endpoints quedarán abiertos; no recomendado en producción.

## Instalación y ejecución

```
cd server
npm install
npm run start
```

El servicio iniciará en `http://localhost:8787`. Configura `VITE_ADMIN_API_URL` en el frontend apuntando a esta URL.

## Seguridad

- Usa la clave de **Service Role** solo en el backend.
- Restringe origen (`FRONTEND_ORIGIN`) y protege con `ADMIN_API_TOKEN` o un mecanismo más robusto (JWT, mTLS, etc.).
- Valida inputs; este servidor incluye validaciones básicas.

## Integración con el frontend

El frontend ya llama estos endpoints vía `services/adminService.ts` usando `VITE_ADMIN_API_URL`. Tras levantar este servidor y setear envs:

- Creación de usuarios desde “Gestión de usuarios”.
- Reset de password desde el formulario.
- Edición de perfil con auditoría.
- Búsqueda por email/rol/universidad.
- Autorización de cuentas sin verificación por email.