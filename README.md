# RONR Platform (React SPA)

Authors: VN, AR, CS  
Live preview: https://rulesoforder.netlify.app/

## Getting Started

1. Install dependencies (Node 18+)
   ```bash
   npm install
   ```
2. Start Vite dev server
   ```bash
   npm run dev
   ```
3. Open the printed local URL (e.g. http://localhost:5173)

## App Structure

- Entry: `index.html` mounts React into `#root`
- Router shell: `src/App.jsx`
- Global state: `src/context/AuthContext.jsx`, `src/utils/storage.js`
- Pages:
  - `src/pages/login.jsx`
  - `src/pages/register.jsx`
  - `src/pages/committee-list.jsx`
  - `src/pages/committee-detail.jsx`
  - `src/pages/committee-create.jsx`

Legacy static HTML pages in the project root are retained for reference but are no longer part of the build.

## Mock Backend & Persistence

- Initial data is seeded from `src/utils/storage.js` the first time the app loads.
- Subsequent interactions persist to `localStorage` under the `appData` key.
- The committee creation form POSTs to `/create-committee`; replace this endpoint once your backend is ready. When the request fails, the committee is still created locally so offline work can continue.

## Current Feature Highlights

- Email/password registration and login with session persistence.
- Committees list with guarded routes for authenticated users.
- Committee creation workflow with role/permission management.
- Motion log on the committee detail page, including support for procedure-changing motions that require supermajority votes.

## Next Steps

- Add discussion threads or speaker queue per motion.
- Implement chair controls (offline mode toggles, vote rules, etc.).
- Connect to the Node/Mongo backend for real data syncing.
