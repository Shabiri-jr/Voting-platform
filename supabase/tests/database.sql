begin;
select plan(11);

select has_table('public', 'students', 'students table exists');
select has_table('public', 'voter_election_status', 'participation is election scoped');
select has_table('public', 'votes', 'anonymous votes table exists');
select has_table('private', 'ballot_sessions', 'private ballot sessions exist');

select col_not_null(
  'public',
  'votes',
  'created_at',
  'anonymous votes have a non-null coarse timestamp'
);

select hasnt_column('public', 'votes', 'student_id', 'votes have no student_id');
select hasnt_column('public', 'votes', 'matric_number', 'votes have no matric number');
select hasnt_column('private', 'ballot_sessions', 'ballot_id', 'sessions do not link to ballots');

update public.elections set status = 'closed' where status = 'open';

insert into public.elections (
  id,
  title,
  description,
  status,
  start_time,
  end_time
) values (
  '00000000-0000-4000-8000-000000000003',
  'Reopen transition test',
  '',
  'pending',
  now() - interval '1 hour',
  now() + interval '1 hour'
);

insert into public.positions (
  id,
  election_id,
  title,
  description,
  display_order
) values (
  '00000000-0000-4000-8000-000000000103',
  '00000000-0000-4000-8000-000000000003',
  'Test position',
  '',
  1
);

insert into public.candidates (
  id,
  position_id,
  full_name,
  department,
  level,
  manifesto
) values (
  '00000000-0000-4000-8000-000000000203',
  '00000000-0000-4000-8000-000000000103',
  'Test candidate',
  'Test department',
  '100L',
  ''
);

update public.elections
set status = 'closed'
where id = '00000000-0000-4000-8000-000000000003';

select lives_ok(
  $$
    update public.elections
    set status = 'open'
    where id = '00000000-0000-4000-8000-000000000003'
  $$,
  'a closed election can be reopened'
);

select is(
  (
    select status::text
    from public.elections
    where id = '00000000-0000-4000-8000-000000000003'
  ),
  'open',
  'reopened election has open status'
);

insert into public.elections (
  id,
  title,
  description,
  status,
  start_time,
  end_time
) values (
  '00000000-0000-4000-8000-000000000004',
  'Previous election',
  '',
  'closed',
  now() - interval '2 months',
  now() - interval '1 month'
);

insert into public.students (
  id,
  matric_number,
  first_name,
  surname,
  department,
  level,
  is_eligible
) values (
  '00000000-0000-4000-8000-000000000303',
  'DU/TEST/2026/001',
  'Test',
  'Student',
  'Test department',
  '100L',
  true
);

insert into public.voter_election_status (
  student_id,
  election_id,
  has_voted,
  voted_at
) values (
  '00000000-0000-4000-8000-000000000303',
  '00000000-0000-4000-8000-000000000004',
  true,
  now() - interval '1 month'
);

select is(
  (
    select status::text
    from public.verify_student(
      '00000000-0000-4000-8000-000000000003',
      'DU/TEST/2026/001',
      'Student',
      repeat('ab', 32)
    )
  ),
  'verified',
  'a student who voted in a previous election can vote in a new election'
);

select * from finish();
rollback;
