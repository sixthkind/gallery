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

## Module System Contract (Required for New Modules)

This app uses a core shell plus installable modules. New modules must preserve the same root-mapping behavior as gallery.

- Core management route is `/manage`.
- Root route `/` is not module-specific by default; it renders a core placeholder unless a module is set as main.
- Installed modules may be marked as main. The main module owns `/` and its feature subroutes at root-level.
- Nested module routes must always continue to work even when the module is main.

### Required data contract

Every installable module record in `modules` must include:
- `slug` (unique)
- `name`
- `installed`
- `isMain`
- `routeBase` (example: `"/gallery"`, `"/blog"`)
- `collectionPrefix` (module namespace for PocketBase collections)

Only one module may have `isMain = true` at a time.

### Required routing behavior for each module

When adding a module with slug `<module>`:
- Add nested pages under `app/pages/<module>/...` (canonical module routes).
- Add root aliases for the same feature pages under `app/pages/...`.
- Protect root aliases with module-specific middleware that redirects to `/` unless module is both installed and main.
- Keep auth middleware on both nested and root alias routes as appropriate.

### Required navigation behavior

- Do not hardcode module-internal links to nested paths.
- Use a module-aware route helper/composable so links resolve to:
- root paths when module is main
- nested `/<module>/...` paths when module is not main
- Navbar and menu links must resolve the same way (dynamic root vs nested).

### Required backend behavior

- `GET /api/modules` must return live module state including `isMain`.
- `POST /api/modules/{slug}/set-main` must:
- validate auth
- require module is installed
- clear any existing main module
- set requested module `isMain = true`
- `POST /api/modules/{slug}/unset-main` must clear `isMain` for that slug.
- Uninstalling a module must clear `isMain` if that module was main.

### Required implementation checklist for new modules

- Add/update PocketBase migration(s) for namespaced module collections.
- Add/update module seed record in `modules`.
- Implement install/uninstall runtime schema handling in hooks.
- Ensure module appears on `/manage` with Install/Uninstall, Open, Set as Main/Unset Main.
- Add middleware and root alias pages for main-module root ownership.
- Verify both nested routes and root aliases work after toggling main on/off.
