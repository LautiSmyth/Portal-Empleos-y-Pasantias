<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1C9OuNpXVW4cCiwgIDVT88GbSHh1B0V84

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy a Vercel (gratuito)

- Variables de entorno (Frontend):
  - `VITE_SUPABASE_URL` (URL de tu proyecto Supabase)
  - `VITE_SUPABASE_ANON_KEY` (anon key de Supabase)
  - Opcional si usas panel admin: `VITE_ADMIN_API_URL` = `/api` y `VITE_ADMIN_API_TOKEN`
- Build y deploy: Vercel detecta Vite (`npm run build`) y sirve `dist`.

## Admin API con Functions (gratuito en Vercel)

- Endpoints en `api/`:
  - `GET /api/health`
  - `POST /api/create-user`
  - `POST /api/reset-password`
  - `POST /api/update-profile`
  - `GET /api/search-users`
  - `POST /api/log`
  - `POST /api/authorize-user`
- Variables de entorno (Backend en Vercel):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_API_TOKEN`
- Seguridad: la `SERVICE_ROLE_KEY` va solo en backend; nunca en el frontend.

## Desarrollo local

- `npm run dev` sirve el frontend en `http://localhost:3000/`.
- Las funciones `/api` no corren en Vite; para probar endpoints localmente usa Vercel CLI o verifica directamente con Supabase RPCs desde el cliente.
