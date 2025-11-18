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
4. (Optional) Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` if your backend runs somewhere other than `http://localhost:5050/api`.

### Backend (Express / MongoDB)

1. Install API dependencies
   ```bash
   cd server
   npm install
   ```
2. Copy the environment template and fill in credentials
   ```bash
   cp .env.example .env
   ```
   - `MONGO_URI`: MongoDB Atlas connection string
   - `JWT_SECRET`: random string for signing auth tokens
   - `FRONTEND_URL`: comma-separated list of allowed origins (e.g. `http://localhost:5173`)
3. Start the API
   ```bash
   npm run dev
   ```
4. The API listens on `http://localhost:5000` by default (configurable via `PORT` in `.env`). The React app will begin integrating with these endpoints next.

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

## Demo & Deployment Checklist

- **Video walkthrough**: _TBD_ – record a short demo covering auth, chair controls, motions, voting, and overturn workflow. (Link placeholder: https://youtu.be/your-demo-url)
- **Hosted site**: _TBD_ – Netlify build hook ready once backend is wired. (URL placeholder: https://rulesoforder.netlify.app)
- **Screenshots**: capture landing, committees dashboard, chair control panel + speaker queue, decision archive, and motion detail cards for the README report.

## Feature Walkthrough

| Area | Highlights |
| --- | --- |
| Authentication | Email/password register + login, guarded routes, session persistence with localStorage seed data. |
| Committee creation | Owner/chair/member/observer roles, granular permissions (`createMotion`, `discussion`, `moveToVote`, `vote`) plus validation for a single owner. |
| Chair control panel | Toggles offline mode, min speakers before vote, whether votes record names, and whether special motions are allowed. Settings persist per committee. |
| Speaker queue | Members raise hands tagged pro/con/neutral with optional notes. Chairs can mark speakers as complete; members can lower their own hands. |
| Motions & sub-motions | Raise standard/procedure/special motions, attach discussion threads, spawn revisions/amendments/postponements, and track variants on the parent card. |
| Voting | Permission-gated ballots prevent duplicates, show tallies + optional voter names, and respect committee settings. |
| Decisions | Chairs record outcomes (passed/failed/postponed) with summary + pros/cons. Decision archive lists historical context for future readers. |
| Overturns | Members who voted “support” on a passed motion can request an overturn; requests are stored as child motions and surfaced in the archive. |

## Documentation Assets

- Landing + marketing copy in `src/pages/landing.jsx`.
- High-fidelity styled auth pages (`login.jsx`, `register.jsx`).
- Motion log demonstrates RONR adaptations for asynchronous use.

Add screenshots of each page/workflow above when available to satisfy the report requirement.

## Backend API Plan

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/register` | POST | Create user, hash password, issue JWT/session cookie. |
| `/api/auth/login` | POST | Validate credentials, return auth token. |
| `/api/committees` | GET/POST | List committees current user belongs to / create new committee with members + settings. |
| `/api/committees/:id` | GET/PATCH | Fetch committee detail (motions, settings, hand raises) / update settings or membership changes. |
| `/api/committees/:id/motions` | POST | Create motion, sub-motion, or special motion. |
| `/api/motions/:motionId/discussion` | POST | Append discussion entry. |
| `/api/motions/:motionId/votes` | POST | Cast or update a vote. |
| `/api/motions/:motionId/decision` | POST | Record decision summary/outcome (owner/chair only). |
| `/api/motions/:motionId/overturn` | POST | Submit overturn request (supporters only). |
| `/api/committees/:id/hands` | POST/DELETE | Raise or lower a hand in the speaker queue. |

Authentication: bearer token/JWT on every request. Committees filtered server-side so users only see permitted data.

## Data Model Sketch

| Collection | Key Fields |
| --- | --- |
| `users` | `_id`, `name`, `email`, `passwordHash`, `profile` (optional metadata). |
| `committees` | `_id`, `name`, `settings` (offline, minSpeakersBeforeVote, recordNamesInVotes, allowSpecialMotions), `members[]` (user ref, role, permissions). |
| `motions` | `_id`, `committeeId`, `parentMotionId`, `variantOf` (`revision`, `amendment`, `postpone`, `overturn`), `type`, `title`, `description`, `status`, `createdBy`, timestamps. |
| `discussionEntries` | `_id`, `motionId`, `stance`, `content`, `createdBy`, timestamps. |
| `votes` | `_id`, `motionId`, `choice`, `createdBy`, timestamps. |
| `decisions` | `_id`, `motionId`, `outcome`, `summary`, `pros`, `cons`, `recordedBy`, timestamps. |
| `handRaises` | `_id`, `committeeId`, `stance`, `note`, `createdBy`, timestamps. |

> Implementation detail: some collections could be embedded (motions with nested discussion/votes) for faster reads, but separating them makes pagination and audit logging easier once Mongo indexes are in place.

## Final Project Deliverables Roadmap

1. **Frontend polish** – take screenshots, record demo video, ensure Netlify build scripts are ready.
2. **Backend implementation** – scaffold Express server, connect to MongoDB Atlas, wire endpoints above, and swap React storage helpers to `fetch` calls.
3. **Documentation** – update this README with final video link, hosted URL, API reference, and ERD screenshot; prepare personal report referencing repos/tasks/tests.

With features now implemented in the SPA, the remaining pre-backend work is mostly documentation and preparing assets so the final submission meets rubric expectations.
