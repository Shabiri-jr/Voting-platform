create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.admin_role as enum ('viewer', 'election_officer', 'super_admin');
create type public.election_status as enum ('pending', 'open', 'paused', 'closed');
create type public.verification_status as enum (
  'verified', 'not_found', 'details_mismatch', 'not_eligible',
  'already_voted', 'session_active', 'election_unavailable'
);
create type public.cast_status as enum (
  'accepted', 'already_accepted', 'already_voted', 'expired',
  'invalid_session', 'invalid_ballot', 'election_unavailable'
);

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text not null unique check (email = lower(btrim(email))),
  role public.admin_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.elections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 160),
  description text not null default '',
  status public.election_status not null default 'pending',
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_by uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint elections_valid_window check (start_time < end_time)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  matric_number text not null,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 120),
  surname text not null check (char_length(btrim(surname)) between 1 and 120),
  department text not null check (char_length(btrim(department)) between 1 and 160),
  level text not null check (char_length(btrim(level)) between 1 and 80),
  is_eligible boolean not null default true,
  has_voted boolean not null default false,
  voted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint students_matric_normalized check (
    matric_number = upper(btrim(matric_number))
  ),
  constraint students_unique_matric unique (matric_number),
  constraint students_vote_timestamp check (
    (has_voted and voted_at is not null) or (not has_voted and voted_at is null)
  )
);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 120),
  description text not null default '',
  display_order integer not null check (display_order > 0),
  created_at timestamptz not null default now(),
  unique (election_id, title),
  unique (election_id, display_order),
  unique (id, election_id)
);

create table public.voter_election_status (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  election_id uuid not null references public.elections(id) on delete cascade,
  has_voted boolean not null default false,
  voted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, election_id),
  constraint voter_election_status_timestamp check (
    (has_voted and voted_at is not null) or (not has_voted and voted_at is null)
  )
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.positions(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 160),
  department text not null check (char_length(btrim(department)) between 1 and 160),
  level text not null check (char_length(btrim(level)) between 1 and 80),
  photo_url text,
  manifesto text not null default '',
  created_at timestamptz not null default now(),
  unique (position_id, full_name),
  unique (id, position_id)
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  ballot_id uuid not null,
  election_id uuid not null references public.elections(id) on delete restrict,
  position_id uuid not null,
  candidate_id uuid not null,
  created_at timestamptz not null default date_trunc('day', now()),
  foreign key (position_id, election_id)
    references public.positions(id, election_id) on delete restrict,
  foreign key (candidate_id, position_id)
    references public.candidates(id, position_id) on delete restrict,
  unique (ballot_id, position_id)
);

comment on table public.votes is
  'Anonymous ballot selections. Deliberately contains no student, session, token, or nullifier column.';

create table public.audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references public.admins(id) on delete set null,
  action text not null check (char_length(action) between 3 and 100),
  details text not null default '' check (char_length(details) <= 2000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table private.ballot_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  election_id uuid not null references public.elections(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'consumed', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint ballot_session_expiry check (expires_at > created_at),
  constraint ballot_session_status check (status in ('open', 'consumed', 'expired'))
);

create unique index ballot_sessions_one_open_per_student_election
  on private.ballot_sessions (student_id, election_id)
  where status = 'open';
create index ballot_sessions_expiry_idx on private.ballot_sessions (expires_at) where status = 'open';
create index elections_status_window_idx on public.elections (status, start_time, end_time);
create index positions_election_order_idx on public.positions (election_id, display_order);
create index candidates_position_name_idx on public.candidates (position_id, full_name);
create index votes_election_candidate_idx on public.votes (election_id, candidate_id);
create index votes_election_ballot_idx on public.votes (election_id, ballot_id);
create index voter_election_status_election_idx
  on public.voter_election_status (election_id, has_voted);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create unique index elections_one_open
  on public.elections ((status))
  where status = 'open';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger admins_touch before update on public.admins
for each row execute function public.touch_updated_at();
create trigger elections_touch before update on public.elections
for each row execute function public.touch_updated_at();

create or replace function public.current_admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select role
  from public.admins
  where auth_user_id = auth.uid() and active
  limit 1
$$;

create or replace function public.is_admin(required_roles public.admin_role[])
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(public.current_admin_role() = any(required_roles), false)
$$;

create or replace function public.guard_frozen_configuration()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  target_election uuid;
  target_status public.election_status;
begin
  if tg_table_name = 'positions' then
    target_election := coalesce(new.election_id, old.election_id);
  else
    select election_id into target_election
    from public.positions
    where id = coalesce(new.position_id, old.position_id);
  end if;
  select status into target_status from public.elections where id = target_election;
  if target_status <> 'pending' then
    raise exception 'Election configuration is frozen';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger positions_frozen_guard before insert or update or delete on public.positions
for each row execute function public.guard_frozen_configuration();
create trigger candidates_frozen_guard before insert or update or delete on public.candidates
for each row execute function public.guard_frozen_configuration();

create or replace function public.guard_election_transition()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if not (
    (old.status = 'pending' and new.status in ('open', 'closed'))
    or (old.status = 'open' and new.status in ('paused', 'closed'))
    or (old.status = 'paused' and new.status in ('open', 'closed'))
  ) then
    raise exception 'Invalid election status transition';
  end if;
  if new.status = 'open' then
    if new.start_time >= new.end_time then
      raise exception 'Election time window is invalid';
    end if;
    if not exists (
      select 1 from public.positions where election_id = new.id
    ) then
      raise exception 'Election has no positions';
    end if;
    if exists (
      select 1
      from public.positions p
      where p.election_id = new.id
        and not exists (
          select 1 from public.candidates c where c.position_id = p.id
        )
    ) then
      raise exception 'Every position must have at least one candidate';
    end if;
  end if;
  return new;
end;
$$;

create trigger elections_transition_guard before update of status on public.elections
for each row execute function public.guard_election_transition();

alter table public.admins enable row level security;
alter table public.students enable row level security;
alter table public.elections enable row level security;
alter table public.positions enable row level security;
alter table public.voter_election_status enable row level security;
alter table public.candidates enable row level security;
alter table public.votes enable row level security;
alter table public.audit_logs enable row level security;
alter table private.ballot_sessions enable row level security;

create policy admins_self_read on public.admins for select to authenticated
using (auth_user_id = auth.uid() and active);
create policy admins_super_read on public.admins for select to authenticated
using (public.is_admin(array['super_admin']::public.admin_role[]));
create policy admins_super_write on public.admins for all to authenticated
using (public.is_admin(array['super_admin']::public.admin_role[]))
with check (public.is_admin(array['super_admin']::public.admin_role[]));

create policy students_admin_read on public.students for select to authenticated
using (public.is_admin(array['viewer', 'election_officer', 'super_admin']::public.admin_role[]));
create policy students_officer_insert on public.students for insert to authenticated
with check (public.is_admin(array['election_officer', 'super_admin']::public.admin_role[]));
create policy students_officer_update on public.students for update to authenticated
using (public.is_admin(array['election_officer', 'super_admin']::public.admin_role[]))
with check (public.is_admin(array['election_officer', 'super_admin']::public.admin_role[]));
create policy students_super_delete on public.students for delete to authenticated
using (public.is_admin(array['super_admin']::public.admin_role[]));

create policy elections_admin_read on public.elections for select to authenticated
using (public.is_admin(array['viewer', 'election_officer', 'super_admin']::public.admin_role[]));
create policy elections_officer_insert on public.elections for insert to authenticated
with check (public.is_admin(array['election_officer', 'super_admin']::public.admin_role[]));
create policy elections_officer_update on public.elections for update to authenticated
using (public.is_admin(array['election_officer', 'super_admin']::public.admin_role[]))
with check (public.is_admin(array['election_officer', 'super_admin']::public.admin_role[]));
create policy elections_super_delete on public.elections for delete to authenticated
using (public.is_admin(array['super_admin']::public.admin_role[]));

create policy positions_admin_read on public.positions for select to authenticated
using (public.is_admin(array['viewer', 'election_officer', 'super_admin']::public.admin_role[]));
create policy positions_officer_write on public.positions for all to authenticated
using (public.is_admin(array['election_officer', 'super_admin']::public.admin_role[]))
with check (public.is_admin(array['election_officer', 'super_admin']::public.admin_role[]));

create policy voter_election_status_admin_read
on public.voter_election_status for select to authenticated
using (public.is_admin(array['viewer', 'election_officer', 'super_admin']::public.admin_role[]));

create policy candidates_admin_read on public.candidates for select to authenticated
using (public.is_admin(array['viewer', 'election_officer', 'super_admin']::public.admin_role[]));
create policy candidates_officer_write on public.candidates for all to authenticated
using (public.is_admin(array['election_officer', 'super_admin']::public.admin_role[]))
with check (public.is_admin(array['election_officer', 'super_admin']::public.admin_role[]));

create policy audit_admin_read on public.audit_logs for select to authenticated
using (public.is_admin(array['viewer', 'election_officer', 'super_admin']::public.admin_role[]));
create policy audit_admin_insert on public.audit_logs for insert to authenticated
with check (
  admin_id = (select id from public.admins where auth_user_id = auth.uid() and active)
  and public.is_admin(array['viewer', 'election_officer', 'super_admin']::public.admin_role[])
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-photos',
  'candidate-photos',
  true,
  2000000,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy candidate_photos_public_read on storage.objects
for select to public
using (bucket_id = 'candidate-photos');

revoke all on all tables in schema public from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;
grant select on public.admins, public.students, public.elections, public.positions,
  public.candidates, public.voter_election_status, public.audit_logs to authenticated;
grant usage on schema public to anon, authenticated;

create or replace function public.verify_student(
  p_election_id uuid,
  p_matric_number text,
  p_surname text,
  p_token_hash_hex text
)
returns table(status public.verification_status, expires_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  normalized_matric_number text;
  normalized_surname text;
  supplied_hash bytea;
  target_election public.elections%rowtype;
  target_student public.students%rowtype;
  session_expiry timestamptz;
begin
  normalized_matric_number := upper(btrim(coalesce(p_matric_number, '')));
  normalized_surname := lower(regexp_replace(btrim(coalesce(p_surname, '')), '\s+', ' ', 'g'));

  begin
    supplied_hash := decode(p_token_hash_hex, 'hex');
  exception when others then
    return query select 'details_mismatch'::public.verification_status, null::timestamptz;
    return;
  end;

  if octet_length(supplied_hash) <> 32 then
    return query select 'details_mismatch'::public.verification_status, null::timestamptz;
    return;
  end if;

  select * into target_election from public.elections where id = p_election_id;
  if not found
    or target_election.status <> 'open'
    or now() < target_election.start_time
    or now() >= target_election.end_time then
    return query select 'election_unavailable'::public.verification_status, null::timestamptz;
    return;
  end if;

  select * into target_student
  from public.students
  where matric_number = normalized_matric_number;

  if not found then
    return query select 'not_found'::public.verification_status, null::timestamptz;
    return;
  end if;

  if lower(regexp_replace(btrim(target_student.surname), '\s+', ' ', 'g')) <> normalized_surname then
    return query select 'details_mismatch'::public.verification_status, null::timestamptz;
    return;
  end if;

  if not target_student.is_eligible then
    return query select 'not_eligible'::public.verification_status, null::timestamptz;
    return;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(target_student.id::text || ':' || p_election_id::text, 0)
  );

  insert into public.voter_election_status (student_id, election_id)
  values (target_student.id, p_election_id)
  on conflict (student_id, election_id) do nothing;

  if exists (
    select 1
    from public.voter_election_status
    where student_id = target_student.id
      and election_id = p_election_id
      and has_voted
  ) then
    return query select 'already_voted'::public.verification_status, null::timestamptz;
    return;
  end if;

  select ballot_session.expires_at into session_expiry
  from private.ballot_sessions ballot_session
  where ballot_session.student_id = target_student.id
    and ballot_session.election_id = p_election_id
    and ballot_session.token_hash = supplied_hash
    and ballot_session.status = 'open'
    and ballot_session.expires_at > now()
  limit 1;

  if found then
    return query select 'verified'::public.verification_status, session_expiry;
    return;
  end if;

  if exists (
    select 1
    from private.ballot_sessions
    where student_id = target_student.id
      and election_id = p_election_id
      and status = 'open'
      and expires_at > now()
  ) then
    return query select 'session_active'::public.verification_status, null::timestamptz;
    return;
  end if;

  update private.ballot_sessions
  set status = 'expired'
  where student_id = target_student.id
    and election_id = p_election_id
    and status = 'open';

  session_expiry := least(now() + interval '15 minutes', target_election.end_time);
  insert into private.ballot_sessions (token_hash, election_id, student_id, expires_at)
  values (supplied_hash, p_election_id, target_student.id, session_expiry);

  return query select 'verified'::public.verification_status, session_expiry;
end;
$$;

create or replace function public.get_ballot_session(p_token_hash_hex text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  supplied_hash bytea;
  session_row private.ballot_sessions%rowtype;
  payload jsonb;
begin
  begin
    supplied_hash := decode(p_token_hash_hex, 'hex');
  exception when others then
    return null;
  end;
  if octet_length(supplied_hash) <> 32 then return null; end if;

  select * into session_row
  from private.ballot_sessions
  where token_hash = supplied_hash;

  if not found or session_row.status <> 'open' or session_row.expires_at <= now() then
    return null;
  end if;

  select jsonb_build_object(
    'election', jsonb_build_object(
      'id', e.id, 'title', e.title, 'description', e.description,
      'status', e.status, 'startTime', e.start_time, 'endTime', e.end_time
    ),
    'expiresAt', session_row.expires_at,
    'positions', coalesce(jsonb_agg(
      jsonb_build_object(
        'id', p.id, 'title', p.title, 'description', p.description,
        'displayOrder', p.display_order,
        'candidates', (
          select coalesce(jsonb_agg(
            jsonb_build_object(
              'id', c.id, 'fullName', c.full_name, 'department', c.department,
              'level', c.level, 'manifesto', c.manifesto,
              'photoUrl', c.photo_url
            ) order by c.full_name
          ), '[]'::jsonb)
          from public.candidates c
          where c.position_id = p.id
        )
      ) order by p.display_order
    ), '[]'::jsonb)
  ) into payload
  from public.elections e
  join public.positions p on p.election_id = e.id
  where e.id = session_row.election_id
    and e.status = 'open'
    and now() >= e.start_time
    and now() < e.end_time
  group by e.id;

  return payload;
end;
$$;

create or replace function public.expire_ballot_session(p_token_hash_hex text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  supplied_hash bytea;
begin
  begin
    supplied_hash := decode(p_token_hash_hex, 'hex');
  exception when others then
    return;
  end;

  if octet_length(supplied_hash) <> 32 then
    return;
  end if;

  update private.ballot_sessions
  set status = 'expired'
  where token_hash = supplied_hash
    and status = 'open';
end;
$$;

create or replace function public.cast_ballot(
  p_token_hash_hex text,
  p_selections jsonb
)
returns table(status public.cast_status)
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  supplied_hash bytea;
  session_row private.ballot_sessions%rowtype;
  election_row public.elections%rowtype;
  student_row public.students%rowtype;
  required_count integer;
  submitted_count integer;
  valid_count integer;
  new_ballot_id uuid;
begin
  begin
    supplied_hash := decode(p_token_hash_hex, 'hex');
  exception when others then
    return query select 'invalid_session'::public.cast_status;
    return;
  end;
  if octet_length(supplied_hash) <> 32 or jsonb_typeof(p_selections) <> 'array' then
    return query select 'invalid_ballot'::public.cast_status;
    return;
  end if;

  select * into session_row
  from private.ballot_sessions
  where token_hash = supplied_hash;

  if not found then
    return query select 'invalid_session'::public.cast_status;
    return;
  end if;
  if session_row.status = 'consumed' then
    return query select 'already_accepted'::public.cast_status;
    return;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(session_row.student_id::text || ':' || session_row.election_id::text, 0)
  );

  select * into session_row
  from private.ballot_sessions
  where token_hash = supplied_hash
  for update;

  if session_row.status = 'consumed' then
    return query select 'already_accepted'::public.cast_status;
    return;
  end if;
  if session_row.status <> 'open' or session_row.expires_at <= now() then
    if session_row.status = 'open' then
      update private.ballot_sessions set status = 'expired' where id = session_row.id;
    end if;
    return query select 'expired'::public.cast_status;
    return;
  end if;

  select * into student_row from public.students where id = session_row.student_id;
  select * into election_row from public.elections where id = session_row.election_id;

  if exists (
    select 1
    from public.voter_election_status
    where student_id = session_row.student_id
      and election_id = session_row.election_id
      and has_voted
  ) then
    return query select 'already_voted'::public.cast_status;
    return;
  end if;
  if election_row.status <> 'open'
    or now() < election_row.start_time
    or now() >= election_row.end_time then
    return query select 'election_unavailable'::public.cast_status;
    return;
  end if;

  create temporary table ballot_input (
    position_id uuid not null,
    candidate_id uuid not null,
    primary key (position_id)
  ) on commit drop;

  begin
    insert into ballot_input (position_id, candidate_id)
    select (item->>'positionId')::uuid, (item->>'candidateId')::uuid
    from jsonb_array_elements(p_selections) item;
  exception when others then
    return query select 'invalid_ballot'::public.cast_status;
    return;
  end;

  select count(*) into required_count from public.positions where election_id = election_row.id;
  select count(*) into submitted_count from ballot_input;
  select count(*) into valid_count
  from ballot_input i
  join public.candidates c
    on c.id = i.candidate_id
   and c.position_id = i.position_id
  join public.positions p
    on p.id = i.position_id
   and p.election_id = election_row.id;

  if required_count = 0 or submitted_count <> required_count or valid_count <> required_count then
    return query select 'invalid_ballot'::public.cast_status;
    return;
  end if;

  new_ballot_id := gen_random_uuid();
  insert into public.votes (ballot_id, election_id, position_id, candidate_id)
  select new_ballot_id, election_row.id, position_id, candidate_id from ballot_input;

  update public.students
  set has_voted = true, voted_at = date_trunc('day', now())
  where id = student_row.id;

  update public.voter_election_status
  set has_voted = true,
      voted_at = date_trunc('day', now())
  where student_id = student_row.id
    and election_id = election_row.id;

  update private.ballot_sessions
  set status = 'consumed'
  where id = session_row.id;

  return query select 'accepted'::public.cast_status;
end;
$$;

create or replace function public.admin_dashboard(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  payload jsonb;
begin
  if not public.is_admin(array['viewer', 'election_officer', 'super_admin']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;
  select jsonb_build_object(
    'registeredStudents', (select count(*) from public.students),
    'eligibleStudents', (select count(*) from public.students where is_eligible),
    'studentsVoted', (
      select count(*)
      from public.voter_election_status ves
      join public.students s on s.id = ves.student_id
      where ves.election_id = p_election_id and s.is_eligible and ves.has_voted
    ),
    'studentsNotVoted', (
      select count(*)
      from public.students s
      where s.is_eligible
        and not exists (
          select 1 from public.voter_election_status ves
          where ves.student_id = s.id
            and ves.election_id = p_election_id
            and ves.has_voted
        )
    ),
    'ballotsCast', (select count(distinct ballot_id) from public.votes where election_id = p_election_id),
    'totalCandidates', (
      select count(*)
      from public.candidates c
      join public.positions p on p.id = c.position_id
      where p.election_id = p_election_id
    ),
    'totalPositions', (select count(*) from public.positions where election_id = p_election_id),
    'turnoutPercentage', coalesce(
      round(
        100.0 * (
          select count(*)
          from public.voter_election_status ves
          join public.students s on s.id = ves.student_id
          where ves.election_id = p_election_id and s.is_eligible and ves.has_voted
        )
        / nullif((select count(*) from public.students where is_eligible), 0),
        1
      ),
      0
    )
  ) into payload;
  return payload;
end;
$$;

create or replace function public.admin_results(p_election_id uuid)
returns table(
  election_id uuid,
  election_title text,
  position_id uuid,
  position_title text,
  position_order integer,
  candidate_id uuid,
  candidate_name text,
  vote_count bigint
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_admin(array['viewer', 'election_officer', 'super_admin']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;
  return query
  select e.id, e.title, p.id, p.title, p.display_order, c.id, c.full_name, count(v.id)
  from public.elections e
  join public.positions p on p.election_id = e.id
  join public.candidates c on c.position_id = p.id
  left join public.votes v on v.candidate_id = c.id and v.election_id = e.id
  where e.id = p_election_id
  group by e.id, e.title, p.id, p.title, p.display_order, c.id, c.full_name
  order by p.display_order, count(v.id) desc, c.full_name;
end;
$$;

create or replace function public.reorder_positions(
  target_election_id uuid,
  ordered_position_ids uuid[],
  acting_admin_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  expected_count integer;
begin
  if not exists (
    select 1 from public.admins
    where id = acting_admin_id
      and active
      and role in ('election_officer', 'super_admin')
  ) then
    raise exception 'Not authorized';
  end if;
  if not exists (
    select 1 from public.elections
    where id = target_election_id and status = 'pending'
  ) then
    raise exception 'Election configuration is frozen';
  end if;
  select count(*) into expected_count
  from public.positions
  where election_id = target_election_id;
  if expected_count <> cardinality(ordered_position_ids)
    or expected_count <> (
      select count(distinct id)
      from unnest(ordered_position_ids) as submitted(id)
      where id in (
        select id from public.positions where election_id = target_election_id
      )
    ) then
    raise exception 'Position order does not match election positions';
  end if;

  update public.positions p
  set display_order = ordered.ordinality::integer + 1000
  from unnest(ordered_position_ids) with ordinality as ordered(id, ordinality)
  where p.id = ordered.id and p.election_id = target_election_id;

  update public.positions p
  set display_order = ordered.ordinality::integer
  from unnest(ordered_position_ids) with ordinality as ordered(id, ordinality)
  where p.id = ordered.id and p.election_id = target_election_id;

  insert into public.audit_logs (admin_id, action, details)
  values (acting_admin_id, 'positions_reordered', 'Updated ballot position display order.');
end;
$$;

create or replace function public.public_election(p_election_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'id', e.id, 'title', e.title, 'description', e.description,
    'status', e.status, 'startTime', e.start_time, 'endTime', e.end_time,
    'positions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'title', p.title, 'description', p.description,
        'displayOrder', p.display_order,
        'candidates', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', c.id, 'fullName', c.full_name, 'department', c.department,
            'level', c.level, 'manifesto', c.manifesto,
            'photoUrl', c.photo_url
          ) order by c.full_name), '[]'::jsonb)
          from public.candidates c where c.position_id = p.id
        )
      ) order by p.display_order)
      from public.positions p where p.election_id = e.id
    ), '[]'::jsonb)
  )
  from public.elections e
  where e.id = p_election_id and e.status in ('pending', 'open', 'paused', 'closed')
$$;

revoke all on function public.verify_student(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.get_ballot_session(text) from public, anon, authenticated;
revoke all on function public.expire_ballot_session(text) from public, anon, authenticated;
revoke all on function public.cast_ballot(text, jsonb) from public, anon, authenticated;
grant execute on function public.verify_student(uuid, text, text, text) to service_role;
grant execute on function public.get_ballot_session(text) to service_role;
grant execute on function public.expire_ballot_session(text) to service_role;
grant execute on function public.cast_ballot(text, jsonb) to service_role;
grant execute on function public.admin_dashboard(uuid) to authenticated, service_role;
grant execute on function public.admin_results(uuid) to authenticated, service_role;
grant execute on function public.reorder_positions(uuid, uuid[], uuid) to service_role;
grant execute on function public.public_election(uuid) to anon, authenticated, service_role;

revoke execute on function public.current_admin_role() from public, anon;
revoke execute on function public.is_admin(public.admin_role[]) from public, anon;
grant execute on function public.current_admin_role() to authenticated, service_role;
grant execute on function public.is_admin(public.admin_role[]) to authenticated, service_role;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema private revoke all on tables from anon, authenticated;
