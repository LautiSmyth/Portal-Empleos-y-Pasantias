# Changelog

All notable changes to this project during the cleanup are documented here.

## [Unreleased] - Cleanup

- Removed Gemini AI integration from the frontend:
  - Deleted `services/geminiService.ts` and related UI elements.
  - Removed AI generate button and overlay from `pages/CompanyDashboard.tsx`.
  - Deleted unused UI components: `components/Spinner.tsx` and `components/icons/SparklesIcon.tsx`.
  - Removed `process.env.API_KEY` and `process.env.GEMINI_API_KEY` defines from `vite.config.ts`.
  - Ensured `@google/genai` is no longer present in `package.json`.

- Removed unnecessary console statements across services:
  - `services/companiesService.ts`: deleted `console.warn` calls in fetch functions.
  - `services/applicationsService.ts`: deleted `console.warn` calls and streamlined error handling.
  - `services/cvService.ts`: deleted `console.warn` in `fetchCVByOwnerId` and `saveCV`.
  - `services/supabaseClient.ts`: deleted environment warning `console.warn`.
  - Verified no remaining `console.*` statements across the repo.

- Dependencies:
  - Frontend `package.json` reviewed; only used packages remain (`react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, `@vercel/speed-insights`).
  - Server `package.json` reviewed; all dependencies used (`fastify`, `@fastify/cors`, `@supabase/supabase-js`, `dotenv`).

- Server API routes:
  - Verified all Admin API endpoints are referenced by the frontend (`/create-user`, `/reset-password`, `/update-profile`, `/search-users`, `/authorize-user`, `/log`). No routes removed.

- CSS and assets:
  - `index.css` is minimal and globally applied; no unused styles detected.
  - No unreferenced multimedia assets found in the repository structure.

- Validation:
  - Frontend dev server opened at `http://localhost:3000/` and loads without errors after cleanup.

## Notes
- The Gemini feature was optional and fully removed. The app remains functional without it.
- If you plan to reintroduce AI generation, prefer a server-side implementation to avoid exposing API keys in the client.