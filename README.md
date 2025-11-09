# GNOA — Technical README

Short technical summary for developers: a React + Vite single-page app using Supabase as the backend (auth + database + edge functions) and Tailwind-style utility classes for UI.

## Tech stack
- Frontend: React (JSX) + Vite — entry: [src/main.jsx](src/main.jsx)  
- Routing: React Router — configured in [src/App.jsx](src/App.jsx) (protected routes + layout)
- Auth & DB: Supabase — client in [`supabase`](src/supabaseClient.js)
- Styling: Tailwind-like utility classes (project uses Tailwind-style classes across components)
- Icons: lucide-react
- PDF export: @react-pdf/renderer — [`MembershipFormDoc`](src/pages/MembershipForm.jsx)
- Misc:
  - File uploads / signature handling (in [src/pages/AddMembers.jsx](src/pages/AddMembers.jsx))
  - Utilities / seeds: [src/utils/jj.js](src/utils/jj.js) (contains `insertData` seed and institutions dataset)
  - Mapping helper: [`mapFormResponseToMember`](src/utils/mapFormResponseToMember.js)

## Key features
- Authentication and session handling via Supabase and a React auth context ([`AuthProvider`](src/contexts/AuthContext.jsx), [`useAuth`](src/contexts/AuthContext.jsx)).
- Role-aware user management UI — `UserManagement` component ([`UserManagement`](src/pages/AddUser.jsx)) calling a Supabase Edge Function (configured via env).
- Membership application flow:
  - Add member form with district/province/institution selection, signature upload/preview and Google Drive URL handling — implemented in [src/pages/AddMembers.jsx](src/pages/AddMembers.jsx).
  - Application list and paging — [src/pages/AppliedMembers.jsx](src/pages/AppliedMembers.jsx) (uses `useMemberResponses` hook).
  - Member directory / search / filters / pagination — [src/pages/ExMembers.jsx](src/pages/ExMembers.jsx).
  - Mapping of raw form responses to member model via [`mapFormResponseToMember`](src/utils/mapFormResponseToMember.js).
  - PDF export of membership form using [`MembershipFormDoc`](src/pages/MembershipForm.jsx).
- Layout & UX components:
  - Global layout + auth-aware header/sidebar: [src/components/Layout.jsx](src/components/Layout.jsx), [src/components/Header.jsx](src/components/Header.jsx), [src/components/Sidebar.jsx](src/components/Sidebar.jsx).
  - Profile management: [src/components/ProfilePage.jsx](src/components/ProfilePage.jsx).
- Database seed / institution & district data helper: [`insertData`](src/utils/jj.js) and large institutions list in [src/utils/jj.js](src/utils/jj.js).

## Important files & symbols
- App entry & boot:
  - [src/main.jsx](src/main.jsx) — mounts app and wraps with [`AuthProvider`](src/contexts/AuthContext.jsx)
  - [src/App.jsx](src/App.jsx) — router + protected routes
- Supabase:
  - [src/supabaseClient.js](src/supabaseClient.js) — exports [`supabase`](src/supabaseClient.js)
  - .env: [.env.local](.env.local) — add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
- Auth context:
  - [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx) — [`AuthProvider`](src/contexts/AuthContext.jsx), [`useAuth`](src/contexts/AuthContext.jsx)
- Pages & components:
  - [src/pages/AddMembers.jsx](src/pages/AddMembers.jsx) — membership application form + signature handling
  - [src/pages/AppliedMembers.jsx](src/pages/AppliedMembers.jsx) — applications list (uses `useMemberResponses`)
  - [src/pages/ExMembers.jsx](src/pages/ExMembers.jsx) — members directory / filters / pagination
  - [src/pages/AddUser.jsx](src/pages/AddUser.jsx) — [`UserManagement`](src/pages/AddUser.jsx) (user CRUD via Supabase edge function)
  - [src/pages/MembershipForm.jsx](src/pages/MembershipForm.jsx) — PDF doc component [`MembershipFormDoc`](src/pages/MembershipForm.jsx)
  - [src/components/Layout.jsx](src/components/Layout.jsx), [src/components/Header.jsx](src/components/Header.jsx), [src/components/Sidebar.jsx](src/components/Sidebar.jsx)
- Utils:
  - [src/utils/jj.js](src/utils/jj.js) — long institutions/district dataset and `insertData` seed helper
  - [src/utils/mapFormResponseToMember.js](src/utils/mapFormResponseToMember.js) — [`mapFormResponseToMember`](src/utils/mapFormResponseToMember.js)
- Hooks:
  - [src/hooks/useMemberResponses.js](src/hooks/useMemberResponses.js) — paginated fetch hook for member responses

## Environment
- Required env variables (Vite):
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_PUBLISHABLE_KEY
- See [.env.local](.env.local) for local overrides.

## Run / Dev workflow
- Install:
  ```sh
  npm install