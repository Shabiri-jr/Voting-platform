begin;

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

  select * into target_election
  from public.elections
  where id = p_election_id;

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
    from public.voter_election_status voter_status
    where voter_status.student_id = target_student.id
      and voter_status.election_id = p_election_id
      and voter_status.has_voted
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
    from private.ballot_sessions active_session
    where active_session.student_id = target_student.id
      and active_session.election_id = p_election_id
      and active_session.status = 'open'
      and active_session.expires_at > now()
  ) then
    return query select 'session_active'::public.verification_status, null::timestamptz;
    return;
  end if;

  update private.ballot_sessions ballot_session
  set status = 'expired'
  where ballot_session.student_id = target_student.id
    and ballot_session.election_id = p_election_id
    and ballot_session.status = 'open';

  session_expiry := least(now() + interval '15 minutes', target_election.end_time);

  insert into private.ballot_sessions (
    token_hash,
    election_id,
    student_id,
    expires_at
  )
  values (
    supplied_hash,
    p_election_id,
    target_student.id,
    session_expiry
  );

  return query select 'verified'::public.verification_status, session_expiry;
end;
$$;

revoke all on function public.verify_student(uuid, text, text, text)
from public, anon, authenticated;

grant execute on function public.verify_student(uuid, text, text, text)
to service_role;

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

  update private.ballot_sessions ballot_session
  set status = 'expired'
  where ballot_session.token_hash = supplied_hash
    and ballot_session.status = 'open';
end;
$$;

revoke all on function public.expire_ballot_session(text)
from public, anon, authenticated;

grant execute on function public.expire_ballot_session(text)
to service_role;

commit;
