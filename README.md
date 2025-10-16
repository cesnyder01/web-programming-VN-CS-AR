# RONR Platform (React SPA)

Authors: VN, AR, CS

This project has been migrated to a single-page React application with React Router. Legacy static HTML/JS pages remain in the root for reference, but the app now runs from `index.html` mounting React into `#root` and routing all pages client-side.

## Getting Started

1. Install dependencies (requires Node 18+):
   - `npm install`
2. Start dev server:
   - `npm run dev`
3. Open the printed local URL (e.g., http://localhost:5173)

## App Structure

- Entry: `index.html` mounts React and loads `src/main.jsx`
- Router + shell: `src/App.jsx`
- State: `src/context/AuthContext.jsx`, `src/utils/storage.js`
- Pages:
  - `src/pages/login.jsx`
  - `src/pages/register.jsx`
  - `src/pages/committee-list.jsx`
  - `src/pages/committee-detail.jsx`
  - `src/pages/committee-create.jsx`

## Notes

- Old files like `login.html`, `register.html`, and `committee-create.html` are no longer used.
- The committee create form submits to `/create-committee`. Update this endpoint to match your backend or adapt as needed.
