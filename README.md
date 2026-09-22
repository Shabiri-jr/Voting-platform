# CampusVote

CampusVote is a production-oriented university election system built with Next.js,
React, Tailwind CSS, Supabase PostgreSQL, and Supabase Auth.

The student flow verifies eligibility, creates a short-lived one-time ballot session,
and submits all anonymous selections through one atomic PostgreSQL transaction.
Administrator roles manage the roster, ballot configuration, election status,
aggregate results, exports, and audit logs without access to voter choices.
The same installation supports recurring elections: each election has separate
positions, candidates, voter participation, ballots, and results.

## Start

1. Follow [docs/SETUP.md](docs/SETUP.md).
2. Copy `.env.example` to `.env.local` and add Supabase credentials.
3. Run `npm install`.
4. Run `npm run dev`.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Architecture and privacy limits are documented in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
