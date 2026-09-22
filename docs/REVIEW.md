# CampusVote Production Code Review

Review date: 2026-06-08

Scope: production correctness, ballot secrecy, double-voting concurrency, SQL/RLS
boundaries, administrator authentication and roles, CSV/file upload handling,
CSRF/origin checks, privacy/logging, accessibility, responsive UX, exports, and
edge cases. The review covered the migration, route handlers, Server Actions,
Supabase clients, authentication helpers, admin pages, and student ballot flow.

## Remediation Status

The findings below preserve the original review record. The integrated build now
remediates findings 3, 5, 6, 8, 9, 10, 11, 12, 13, and 14. Finding 1 was materially
reduced by removing selection digests and exact student-linked cast timestamps;
the documented privileged-operator timing-analysis limit remains. Finding 2 no
longer permits active-session takeover and now uses generic verification failures,
but matric number plus surname remains a weak voter-authentication factor that
must be replaced or augmented for a high-assurance election. Finding 4 is reduced
by revoking authenticated base-table DML and audit-log insert privileges; most
service-role mutations and audit writes are still separate transactions. Finding
7 now supports enforced AAL2 and recent-authentication checks, while shared login
and voter rate limits remain deployment controls.

The repository now includes unit tests and pgTAP database tests. The unit suite has
been executed; the database suite still requires a running or linked Supabase
instance.

## Findings

### Critical

#### 1. Persisted session data can be correlated to a student's exact ballot

References:

- `supabase/migrations/202606080001_secure_foundation.sql:86-98`
- `supabase/migrations/202606080001_secure_foundation.sql:113-127`
- `supabase/migrations/202606080001_secure_foundation.sql:525-539`
- `supabase/migrations/202606080001_secure_foundation.sql:596-608`
- `src/app/page.tsx:100-104`
- `src/components/student/BallotClient.tsx:233-235`

`private.ballot_sessions` retains both `student_id` and a deterministic SHA-256
digest of the submitted candidate IDs. Ballots have low entropy, so a privileged
reader can enumerate candidate combinations and recover the choices represented
by `selection_digest`. There is also a direct timing correlation: `votes.created_at`
defaults to PostgreSQL `now()` and `ballot_sessions.consumed_at` is set with
`now()` in the same transaction. PostgreSQL's `now()` is transaction-stable, so
the consumed session timestamp can match the anonymous ballot rows' timestamp
exactly. This contradicts the UI's unconditional anonymity claims.

Minimal fix:

1. Remove `selection_digest`; a consumed bearer token can return a generic
   idempotent `already_accepted` result without proving that the retry body is
   identical.
2. Do not retain a student-linked session row with the exact cast timestamp.
   Mark eligibility usage in the identity domain, then irreversibly remove the
   student link before persisting the anonymous ballot.
3. For a production secrecy boundary, split credential issuance and anonymous
   casting into separate transactions and trust zones using a one-time anonymous
   credential/nullifier. Avoid shared precise timestamps and logs across zones.
4. Until that design is implemented, change product copy to state the actual
   threat model rather than promising anonymous storage without qualification.

#### 2. Matric number plus surname is sufficient to steal or invalidate a ballot

References:

- `src/app/api/verify/route.ts:18-46`
- `src/app/api/verify/route.ts:69-87`
- `supabase/migrations/202606080001_secure_foundation.sql:369-426`
- `src/components/student/VerifyForm.tsx:38-56`

The only voter authentication factors are a matric number and surname, both
commonly known or discoverable. A successful request issues the caller a bearer
ballot token. It also expires any existing open session for that student before
creating the new one, so an attacker can take over the voting opportunity or
repeatedly interrupt a legitimate voter. The API separately reveals `not_found`,
`not_eligible`, and `already_voted`, enabling roster and turnout enumeration.
There is no repository-enforced rate limit.

Minimal fix:

1. Require an institution-authenticated session, one-time code delivered through
   a verified channel, or an election-issued high-entropy credential. Surname
   must not be an authentication secret.
2. Return one generic failure response for all roster, eligibility, and prior-vote
   failures.
3. Add shared, deployment-level limits by account/credential and IP, with backoff
   and monitoring. Rate limiting alone does not repair the weak authentication.
4. Do not invalidate an existing ballot session merely because another caller
   supplied the same biographical data; require explicit authenticated handoff or
   let the existing session expire.

### High

#### 3. Voting state is global, so a student can vote in only one election ever

References:

- `supabase/migrations/202606080001_secure_foundation.sql:41-59`
- `supabase/migrations/202606080001_secure_foundation.sql:413-415`
- `supabase/migrations/202606080001_secure_foundation.sql:551-602`
- `supabase/migrations/202606080001_secure_foundation.sql:627-646`
- `src/lib/admin/queries.ts:144-160`

`has_voted` and `voted_at` live on the student record rather than on a
student/election relationship. After voting in one election, the student is
rejected from every later election. Dashboard and department turnout calculations
also mix all elections while labeling metrics for one selected election.

Minimal fix: create an election-scoped participation table such as
`voter_election_status(student_id, election_id, voted_at)` with a unique
`(student_id, election_id)` constraint. Move all verification, casting, turnout,
and admin status queries to it.

#### 4. RLS permits direct mutations that bypass application validation and audit

References:

- `supabase/migrations/202606080001_secure_foundation.sql:249-287`
- `supabase/migrations/202606080001_secure_foundation.sql:331-347`
- `src/actions/admin.ts:57-65`
- `src/actions/admin.ts:323-332`
- `src/lib/audit.ts:10-21`

Authenticated election officers receive direct table DML privileges, and every
admin can directly insert self-attributed audit rows. A logged-in admin can call
Supabase REST directly, bypass Server Action validation, election-opening checks,
and application audit logging. They can also fabricate audit events. Within the
application, mutations and audit inserts are separate transactions; an audit
failure occurs after the mutation has already committed.

Minimal fix:

1. Revoke direct DML on protected base tables and direct insert on `audit_logs`
   from `authenticated`.
2. Expose narrowly scoped `SECURITY DEFINER` mutation RPCs that validate role and
   resource state, perform the mutation, and write an immutable audit event in
   one transaction.
3. Alternatively, enforce audit creation with database triggers whose fields are
   derived by the database, not supplied by the caller.
4. Add privilege tests proving REST calls cannot bypass the approved RPCs.

#### 5. An election can be opened with an unusable or ambiguous ballot

References:

- `src/components/admin/ElectionSettingsForm.tsx:69-79`
- `src/actions/admin.ts:302-328`
- `src/actions/admin.ts:350-368`
- `supabase/migrations/202606080001_secure_foundation.sql:209-230`
- `src/app/api/verify/route.ts:27-34`
- `src/lib/admin/queries.ts:36-58`

The general election settings form can write `status = open` directly, bypassing
the dedicated status action. The dedicated action checks only that at least one
position and at least one candidate exist in total; it does not require every
position to have a candidate. The database transition trigger checks state order
but not ballot completeness. There is also no constraint preventing multiple
simultaneously open elections; student verification silently chooses the most
recent one while admin pages may choose a different first open row.

Minimal fix:

1. Remove `status` from the general settings mutation.
2. Make status changes a database RPC that verifies every position has at least
   one candidate, the time window is valid, configuration is frozen, and no other
   election is open.
3. Add a database-enforced single-active-election invariant if multi-open voting
   is not a supported product requirement.
4. Require callers to identify the election explicitly rather than selecting it
   by ordering.

#### 6. Verification and casting use conflicting lock order and can deadlock

References:

- `supabase/migrations/202606080001_secure_foundation.sql:384-396`
- `supabase/migrations/202606080001_secure_foundation.sql:418-426`
- `supabase/migrations/202606080001_secure_foundation.sql:526-552`

Verification locks election then student, while casting locks session then student
then election. A cast can hold the student lock while waiting for the election,
as a concurrent verification holds the election lock while waiting for the
student, causing PostgreSQL to abort one transaction as a deadlock victim.
Additionally, every verification for the same election takes an exclusive lock
on the election row, serializing all voters at peak load.

The student row lock does correctly prevent two casts from both passing the
`has_voted` check, but the lock graph creates avoidable election-day failures.

Minimal fix: establish and document one lock order for every RPC. Avoid locking
the election row during ordinary verification; use a consistent
student/election-scoped advisory lock or lock participation then session, and
recheck election state immediately before commit.

#### 7. Admin sessions do not require MFA or recent authentication

References:

- `src/app/api/admin/login/route.ts:22-50`
- `src/lib/auth.ts:18-52`
- `src/actions/admin.ts:340-373`
- `src/app/api/admin/results/export/route.ts:9-15`

Admin authorization verifies a valid Supabase user and database role, but it does
not enforce an AAL2/MFA session, session age, or recent reauthentication for
opening/closing elections and exporting results. Login has no application or
repository-enforced throttling. Documentation recommending MFA is not an
enforcement boundary.

Minimal fix: require AAL2 for every admin page/action and recent authentication
for election status changes, role changes, roster deletion, and final exports.
Add shared login throttling and alerts for repeated failures. Preserve the current
server-side role lookup so deactivation takes effect without waiting for stale
JWT role claims.

#### 8. Ties are displayed and exported as a unique winner

References:

- `src/app/admin/results/page.tsx:21-37`
- `src/app/admin/results/print/page.tsx:45-63`
- `src/components/ResultsTable.tsx:38-46`
- `src/app/api/admin/results/export/route.ts:25-36`

Ranks are assigned with `index + 1`. If two candidates have equal top vote
counts, only the first sorted row receives rank 1 and the "Winner" label. The
print page always passes `final`, even for an open or paused election, and CSV
export repeats the same false ranking. This can produce an incorrect official
result.

Minimal fix: compute tie-aware competition or dense ranks from vote totals, label
all tied leaders correctly, and never display "Winner" or offer a final export
until the election is closed. Include election ID/title, status, generation time,
and tie state in the export.

#### 9. `datetime-local` values are interpreted in the server timezone

References:

- `src/app/admin/elections/page.tsx:14-17`
- `src/app/admin/elections/page.tsx:59-66`
- `src/actions/admin.ts:307-321`

The page formats dates using the server's timezone and the Server Action parses a
timezone-free `datetime-local` string with `new Date(...)` on the server. On a
UTC deployment, an administrator entering Nigerian local time can store a value
one hour earlier than intended. Election opening and closing can therefore occur
at the wrong real-world time.

Minimal fix: make the election timezone explicit (for example
`Africa/Lagos`), convert in the browser or with a timezone-aware server library,
store UTC, and display the timezone next to every editable and read-only time.

### Medium

#### 10. Custom origin validation trusts request-controlled host headers

References:

- `src/lib/security/origin.ts:4-19`
- `src/app/api/verify/route.ts:9-15`
- `src/app/api/vote/route.ts:12-20`
- `src/app/api/admin/login/route.ts:8-14`

The allowlist includes `request.nextUrl.origin` and constructs another allowed
origin from `x-forwarded-host`/`x-forwarded-proto`. If the deployment proxy does
not overwrite these headers, a forged host pair can make an attacker-controlled
Origin appear valid. The ballot cookie's `SameSite=Strict` setting limits impact
for ballot casting, but admin Supabase cookies and future deployments should not
depend on proxy behavior.

Minimal fix: compare a parsed Origin only against explicit configured production
origins. If preview origins are needed, configure a bounded allowlist; do not add
Host or forwarded-host values supplied by the current request. Keep Next.js
Server Action origin checks as defense in depth.

#### 11. Candidate images allow remote tracking and weak file validation

References:

- `src/components/CandidateForm.tsx:78-100`
- `src/lib/validation.ts:84-93`
- `src/actions/admin.ts:240-270`
- `src/components/CandidateCard.tsx:51-58`

`z.url()` accepts non-HTTP schemes and arbitrary hosts, while the ballot renders
the stored value directly in `<img src>`. An officer can therefore make every
voter's browser contact a third-party host, exposing IP address, timing, and the
CampusVote origin. Uploaded files are trusted based on caller-supplied MIME type
and size only; file signatures, dimensions, and decoder safety are not checked.
An uploaded object is also orphaned if the later candidate insert/update fails.

Minimal fix: remove arbitrary photo URLs or restrict them to HTTPS URLs under the
known Supabase bucket host/path. Verify magic bytes, decode and re-encode images,
cap dimensions/pixels, strip metadata, and delete newly uploaded objects if the
database mutation fails.

#### 12. CSV export is vulnerable to spreadsheet formula injection

References:

- `src/lib/csv.ts:117-120`
- `src/app/api/admin/results/export/route.ts:22-53`

CSV escaping handles commas, quotes, and newlines but does not neutralize cells
beginning with `=`, `+`, `-`, `@`, tab, or carriage return. Candidate and position
names are administrator-controlled, so opening the export in Excel or similar
software can evaluate a formula. The GET export also writes an audit row, making
a safe/read-only method produce a database side effect.

Minimal fix: prefix formula-like cells with an apostrophe (or use a library with
spreadsheet-safe CSV mode), test all dangerous prefixes, and move the audited
export initiation to a POST/action or otherwise make audit creation idempotent
and resistant to cross-site triggering.

#### 13. Ballot keyboard focus and state changes are not visibly announced

References:

- `src/components/CandidateCard.tsx:34-50`
- `src/components/student/BallotClient.tsx:107-116`
- `src/components/student/BallotClient.tsx:193-212`
- `src/components/AdminSidebar.tsx:40-70`

The real radio input is visually clipped with `sr-only`, but the card has no
`focus-within` style, so keyboard users cannot see which candidate has focus.
Switching to review scrolls visually but does not move focus or announce the new
heading. On small screens every admin page places the full seven-item navigation
and account panel before the main content, creating repeated navigation burden.

Minimal fix: add a strong `focus-within` state to candidate labels, focus the
review heading after the state change, add a skip link, and use a compact mobile
admin menu. Verify at 320 CSS pixels and with keyboard/screen-reader navigation.

### Low

#### 14. Position reordering is non-atomic and can leave temporary order values

References:

- `src/actions/admin.ts:169-199`

Reordering performs two loops of independent update requests. A conflict, network
failure, concurrent reorder, or collision with an existing `1000 + index` value
can leave only part of the list updated. The audit row is also separate.

Minimal fix: move reorder validation and all updates into one database transaction
RPC, verify the submitted IDs exactly match the election's positions, and audit
the committed order in the same transaction.

## Sound Controls

- `cast_ballot` validates one candidate per required position, validates
  candidate/position/election relationships, inserts the complete ballot in one
  transaction, and locks the student before marking the vote complete.
- `votes` deliberately has no student/session foreign key, and authenticated
  admins receive no direct `SELECT` privilege on `votes` or `private` tables.
- Sensitive ballot RPC execution is revoked from anon/authenticated roles and
  granted only to `service_role`; `SECURITY DEFINER` functions pin `search_path`.
- The ballot token is 32 random bytes, only its SHA-256 hash is stored, and the
  production cookie is `__Host-`, `HttpOnly`, `Secure`, `SameSite=Strict`, and
  short-lived.
- Vote and verification APIs bound JSON payload size and return `no-store`
  responses. Admin Server Actions re-check authorization rather than relying on
  page guards or proxy routing.
- Role lookup is database-backed and checks `active`, so disabling an admin takes
  effect on the next authorization check.
- SQL foreign keys prevent cross-election/cross-position candidate substitution,
  and configuration/transition triggers provide useful defense in depth.
- CSV import has strict headers, quoting validation, per-field schemas, row and
  byte limits, and duplicate detection within the file.
- React rendering escapes administrator-entered text. Tables use captions and
  header scopes, ballot groups use `fieldset`/`legend`, alerts use live roles, and
  global focus styling exists.
- The checked versions, Next.js `16.2.7` and React `19.2.4`, include the relevant
  current RSC security patches described by the bundled Next.js documentation.

## Residual Risks

- A single Supabase project, service-role key, database owner, backup operator,
  WAL observer, or sufficiently detailed network/logging system remains able to
  perform timing analysis. Strong anonymity against that operator requires
  separate identity and ballot trust zones, not only table-level separation.
- A transferable bearer ballot credential does not provide coercion resistance
  or prove that the eligible student personally selected the candidates.
- Supabase project settings are outside this repository. MFA policy, password
  policy, refresh-token lifetime, breached-password checks, storage response
  headers, PITR, backups, and service-key rotation must be reviewed separately.
- Deployment WAF/rate-limit rules, reverse-proxy header sanitation, analytics,
  error reporting, access logs, and session replay were not available for review.
  They must not record matric numbers, surnames, ballot cookies, request bodies,
  candidate IDs, or precise identity/cast correlation data.
- Live results are currently visible to every admin role during voting. Confirm
  that this is an explicit election policy; otherwise hide counts until closure.

## Release-Blocking Tests

The following must pass against a clean, production-like Supabase instance before
release:

1. Apply the migration from an empty database and assert table, sequence, schema,
   function, and Storage privileges for anon, ordinary authenticated users, each
   admin role, service role, and database owner.
2. Prove authenticated admins cannot mutate base tables or fabricate audit events
   outside approved transactional RPCs.
3. Cast the same token concurrently at least 20 times: exactly one ballot is
   created, retries are idempotent, no duplicate position rows exist, and no
   request returns an ambiguous server failure after commit.
4. Cast concurrently from two sessions for the same student/election: exactly one
   ballot is accepted and the other receives a deterministic already-voted result.
5. Run verification, cast, pause/close, and session refresh concurrently under
   load; assert zero deadlocks, bounded lock waits, and no election-row
   serialization bottleneck.
6. Verify one student can vote once in each of two elections while never voting
   twice in either election; verify all dashboard/department metrics are scoped
   to the selected election.
7. Assert an election cannot open with zero positions, a position without a
   candidate, invalid times, or another active election. Verify the configured
   `Africa/Lagos` wall-clock opening and closing instants.
8. Test voter authentication against guessed surnames, roster enumeration,
   repeated session takeover, credential replay, rate limits, lockout/backoff,
   and generic failure responses.
9. Require MFA/AAL2 for viewer, officer, and super-admin sessions; test inactive
   users, role downgrade during a session, stale tokens, session expiry, recent
   authentication, and login throttling.
10. Test CSRF with absent/malformed Origin, cross-site Origin, forged Host,
    `x-forwarded-host`, and `x-forwarded-proto` headers through the actual
    production proxy.
11. Verify persisted operational data cannot map a student to candidate choices.
    Specifically test digest enumeration and exact timestamp joins after casts.
12. Upload wrong-signature images, polyglots, oversized dimensions, corrupt files,
    metadata-heavy files, non-HTTPS/foreign photo URLs, and a database failure
    after upload; assert rejection or cleanup.
13. Import empty, malformed, quoted, BOM, duplicate, 2 MB boundary, 10,000-row,
    and oversized CSV files. Verify large valid imports complete within production
    request limits without partial writes.
14. Export names beginning with every spreadsheet formula prefix. Verify ties,
    zero-vote positions, Unicode, commas/newlines, election identity, status,
    generation timestamp, download headers, and no "Winner" before closure.
15. Run automated accessibility checks plus keyboard and screen-reader tests for
    verification, every ballot position, review, submission errors, admin
    navigation, tables, print, and 320/768/1280-pixel layouts.
16. Simulate a network disconnect after database commit but before the vote API
    response; retry must confirm acceptance without creating a second ballot or
    telling the voter to begin a new session.

## Verification Performed

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed: 3 files and 13 tests.
- `npm run build` passed with Next.js `16.2.7`.
- Browser smoke checks covered the home, verification, guarded ballot, admin login,
  protected dashboard redirect, form error announcement, and desktop overflow.
- `supabase/tests/database.sql` is present, but database integration and
  concurrency tests were not executed because no local Supabase CLI/database was
  available in the verification environment.
- Full automated accessibility, load, WAF/rate-limit, and external security tests
  remain release-environment responsibilities.
