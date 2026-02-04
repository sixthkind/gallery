# lowkee-gallery AI Brief

**Summary**
This repo is a full-stack photo gallery app. It ships a Nuxt 3 single-page app (Vue 3) with Tailwind CSS and Vueform, backed by a PocketBase server for auth, data, and file storage. It's  stand out features are image albums, grouping and tags.

**Tech Stack**
- Nuxt 3 (Vue 3), SPA mode (`ssr: false` in `app/nuxt.config.ts`)
- Tailwind CSS, PostCSS
- @nuxt/ui, @nuxtjs/ionic, @vueform/nuxt
- PocketBase backend (local binary in `pocketbase/`)
- Capacitor for iOS/Android builds

**Repo Layout**
- `app/` Nuxt client app
- `app/pages` Route files (albums, items, tags, auth, etc.)
- `app/components` UI components (gallery, auth, landing, common, table)
- `app/composables` Shared state and logic
- `app/assets/css` Global styles
- `app/nuxt.config.ts` App configuration and runtime env mapping
- `pocketbase/` PocketBase app and scripts
- `pocketbase/pb_data` Local DB data (avoid touching unless requested)
- `pocketbase/pb_hooks` PocketBase hooks
- `pocketbase/pb_migrations` PocketBase migrations
- `pocketbase/pb_public` Public assets served by PocketBase
- `mcp/` MCP servers for AI integrations (separate package; optional)

**Common Commands**
- `npm install`
- `npm start` (runs Nuxt + PocketBase concurrently)
- `npm start --workspace=app` (Nuxt only)
- `npm start --workspace=pocketbase` (PocketBase only)
- `npm run generate --workspace=app` or root `npm run build`
- `npm run cp` (copy Nuxt static output into `pocketbase/pb_public`)

**Local URLs**
- App: http://localhost:3000
- PocketBase: http://localhost:8090

**Environment**
- `.env.example` shows expected variables.
- Nuxt loads repo root `.env` first if present, otherwise `app/.env`.
- Important vars: `VITE_POCKETBASE_URL`, `VITE_SITENAME`, `VITE_SITENAME2`, `VITE_ENVIRONMENT`.

**AI Editing Guidance**
- Frontend changes usually live under `app/`.
- Backend or data changes live under `pocketbase/`.
- Prefer npm workspace commands from repo root.
