begin;

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
    or (old.status = 'closed' and new.status = 'open')
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

comment on function public.guard_election_transition() is
  'Enforces election state changes. Closed elections may be reopened without altering ballots or voter participation.';

commit;
