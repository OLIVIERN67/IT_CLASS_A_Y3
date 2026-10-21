# Class Members Management

Secure class directory and member management application for the Y3 IT Class A.
The application uses the existing `public.members` table in Neon PostgreSQL; it
does not create a replacement directory or seed/delete member records.

## Setup

1. Install Node.js 18.17 or newer.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` and a random
   `SESSION_SECRET` (at least 32 characters).
3. Run the additive migration against the existing Neon database:

   ```bash
   psql "$DATABASE_URL" -f database/001_auth_and_audit.sql
   ```

4. Configure Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
   `CLOUDINARY_API_SECRET`) for persistent profile images.
5. Temporarily set `SETUP_TOKEN`, start the app, and provision every existing
   member with a login by calling `POST /api/auth/provision`:

   ```json
   {
     "token": "the-server-only-token",
     "password": "Y3ITA@123"
   }
   ```

   Members then sign in with their existing `RegNumber` and that password.
   Roles are copied from the existing `members."Role"` values and normalized to
   `CP`, `CEPINE`,    or `MEMBER`. Existing labels such as `CLASS REPRESENTATIVE (CP)` and
   `CLASS REPRESENTATIVE (CEPINE)` are mapped to the corresponding access
   role without changing the original `members."Role"` value. `POST /api/auth/setup` can be used instead for
   one member at a time, with `token`, `regNumber`, `password`, and a
   server-authorized `role`.
   Remove `SETUP_TOKEN` after provisioning.

   Representative accounts use the separate phone login and are provisioned
   securely with bcrypt hashes. The current configured accounts are:

   - CP: `0786718716`, password `Y3ITA@2026!`
   - CEPINE: `0791030409`, password `Y3ITA@2026!`

   Phone numbers are stored in `member_users.phone_number`; plaintext
   passwords are never stored.

6. Run `npm run dev` and open `http://localhost:3000`.

## Backend endpoints

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/members` (authenticated, search/filter supported)
- `GET /api/members/:id` (authenticated)
- `POST /api/members` (CP/CEPINE only)
- `PUT /api/members/:id` (CP/CEPINE only)
- `DELETE /api/members/:id` (CP/CEPINE only)
- `POST /api/upload` (CP/CEPINE only, Cloudinary image upload)

All SQL uses parameter placeholders. Role checks are performed from the signed
HTTP-only session on the server for every protected mutation. The UI hides
management controls from ordinary members, but the API independently rejects
their requests.

## Validation

Run `npm run typecheck` and `npm run build` after dependencies are available.
Both commands pass for the current source tree. A live database login test
requires `DATABASE_URL` and `SESSION_SECRET` to be configured.
