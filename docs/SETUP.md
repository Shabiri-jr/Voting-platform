# CampusVote Setup and Deployment

## Prerequisites

- Node.js 20.9 or newer
- npm
- A Supabase project
- Supabase CLI for local database development
- A Vercel account for deployment

## Local Database

Install and authenticate the Supabase CLI, then link this repository to a project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Apply the schema:

```bash
npx supabase db push
```

For a fully local Supabase stack:

```bash
npx supabase start
npx supabase db reset
```

The migration creates the requested tables, private ballot sessions, RLS policies,
atomic verification/casting RPCs, aggregate admin RPCs, audit controls, and the
`candidate-photos` Storage bucket. Local seed files and administrator provisioning
scripts are excluded from Git because they contain private student data or
credentials. On a fresh installation, create the first administrator as described
below, configure an election in the admin interface, and import students using the
CSV import.

## Recurring Elections

Use a separate election record for each term, month, or year:

1. Open **Election settings** and choose **Create another election**.
2. Enter the new title and voting window.
3. Select the new election from the **Working election** menu.
4. Add that election's positions and candidates.
5. Open voting after the ballot is complete.

The student roster is reusable. Positions, candidates, participation, ballots, and
results remain scoped to their election, so a student who voted previously can vote
again in a later election. Historical elections remain selectable for reporting.
Use **Reopen voting** only to resume the same election without resetting its votes.

## Environment

Copy `.env.example` to `.env.local`:

```bash
copy .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe anon key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key used only by narrow ballot APIs.
- `NEXT_PUBLIC_APP_URL`: exact application origin, such as
  `http://localhost:3000`.
- `ALLOWED_ORIGINS`: comma-separated additional trusted origins. Keep this empty
  unless a known preview or alternate production origin must submit forms.
- `REQUIRE_ADMIN_MFA`: set to `true` in production to require Supabase AAL2 for
  all administrator pages and actions.

Never expose the service-role key in a `NEXT_PUBLIC_` variable or browser bundle.

## First Administrator

Create a user in Supabase Authentication using the dashboard or Admin API. Copy the
new auth user UUID, then run:

```sql
insert into public.admins (
  auth_user_id,
  full_name,
  email,
  role
) values (
  'AUTH-USER-UUID',
  'Election Administrator',
  'elections@university.edu',
  'super_admin'
);
```

Use the same email and password at `/admin/login`. Enable MFA for production admin
accounts in Supabase Auth and institutional policy.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Quality gates:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Database policy and transaction tests:

```bash
npx supabase test db
```

## CSV Student Import

The exact headers are:

```csv
matric_number,first_name,surname,department,level
DU/CSC/2021/001,Sayo,Dabiri,Computer Science,400L
DU/CSC/2021/002,Temi,Ade,Mass Communication,300L
```

The parser supports quoted CSV fields, rejects malformed rows, limits files to 2 MB
and 10,000 rows, normalizes matric numbers, and skips database duplicates.

## Deploy to Vercel

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Import it into Vercel as a Next.js project.
3. Add all six environment variables for Production and Preview. Set
   `REQUIRE_ADMIN_MFA=true` in Production.
4. Set `NEXT_PUBLIC_APP_URL` to the exact production URL.
5. Deploy.
6. In Supabase Auth URL Configuration, add the production URL and approved preview
   URLs.
7. Run `npx supabase db push` against the production Supabase project before opening
   the election.

Use Vercel Firewall or an equivalent shared rate limiter for `/api/verify`,
`/api/vote`, and `/api/admin/login`. An in-memory limiter is intentionally not used
because it is unreliable across serverless instances.

The Vercel deployment uses BotID Basic for `/api/verify` and
`/api/admin/login`. Keep the matching client and server `checkLevel` values set
to `basic`. The project firewall should also keep one fixed-window rule for
`POST` requests to `/api/verify`, `/api/vote`, and `/api/admin/login`, counted by
IP and JA4. The initial production threshold is 120 requests per 60 seconds.
Review Firewall traffic after election rehearsals and lower the limit only when
shared-network traffic is understood.

During a confirmed active attack, an operator can temporarily challenge all
visitors:

```bash
npx vercel firewall attack-mode enable
```

Disable it after traffic returns to normal:

```bash
npx vercel firewall attack-mode disable
```

Candidate photos are decoded, pixel-limited, metadata-stripped, resized, and
re-encoded as WebP before Storage upload. Arbitrary third-party image URLs are not
accepted, which prevents voter browsers from being used for external tracking.

## Election-Day Checklist

- Confirm database backups and point-in-time recovery.
- Confirm all admins use MFA and least-privilege roles.
- Confirm election start/end times and the institution timezone.
- Load test verification and casting at expected peak traffic.
- Verify admins cannot select `public.votes` or `private.ballot_sessions`.
- Verify logs, analytics, error reporting, and session replay do not capture matric
  numbers, surnames, ballot cookies, candidate IDs, or request bodies.
- Keep third-party analytics off `/verify`, `/ballot`, and `/api/vote`.
- Close the election when voting is complete. If voting must resume, an election
  officer can use **Reopen voting** in Election settings after recent
  authentication. Reopening keeps all existing ballots and `has_voted` records.
- Export and print aggregate final results, then retain audit logs according to
  university policy.

## Privacy Boundary

Vote rows never store student identity, and private session rows never store the
anonymous ballot ID. This prevents normal application/admin access from linking a
student to a candidate. It does not provide absolute anonymity against a fully
privileged database, backup, hosting, or network operator who may attempt timing
correlation. See `docs/ARCHITECTURE.md` for the future blind-credential design.
