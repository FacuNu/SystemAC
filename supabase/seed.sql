insert into public.employees (
  id,
  full_name,
  employee_code,
  password_hash,
  dni_hash,
  role,
  hourly_rate,
  is_active
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'Administrador General',
    'ADM-001',
    crypt('30000000', gen_salt('bf', 10)),
    encode(digest('30000000', 'sha256'), 'hex'),
    'admin',
    null,
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Juan Perez',
    'EMP-001',
    crypt('30111222', gen_salt('bf', 10)),
    encode(digest('30111222', 'sha256'), 'hex'),
    'employee',
    8200.00,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Maria Gomez',
    'EMP-002',
    crypt('28999111', gen_salt('bf', 10)),
    encode(digest('28999111', 'sha256'), 'hex'),
    'employee',
    9100.00,
    true
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Luciano Fernandez',
    'EMP-003',
    crypt('31555777', gen_salt('bf', 10)),
    encode(digest('31555777', 'sha256'), 'hex'),
    'employee',
    9750.00,
    true
  )
on conflict (id) do update
set
  full_name = excluded.full_name,
  employee_code = excluded.employee_code,
  password_hash = excluded.password_hash,
  dni_hash = excluded.dni_hash,
  role = excluded.role,
  hourly_rate = excluded.hourly_rate,
  is_active = excluded.is_active;

insert into public.work_reports (
  id,
  employee_id,
  work_date,
  check_in_at,
  check_out_at,
  check_in_lat,
  check_in_lng,
  check_in_accuracy,
  check_out_lat,
  check_out_lng,
  check_out_accuracy,
  task_text,
  null_report,
  total_minutes,
  status
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    '2026-04-01',
    '2026-04-01T12:00:00Z',
    '2026-04-01T20:30:00Z',
    -34.603700,
    -58.381600,
    12.50,
    -34.603900,
    -58.381100,
    8.40,
    'Relevamiento de obra, carga de materiales y cierre de parte diario.',
    false,
    510,
    'closed'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '33333333-3333-4333-8333-333333333333',
    '2026-04-02',
    '2026-04-02T11:45:00Z',
    '2026-04-02T19:10:00Z',
    -34.604200,
    -58.382100,
    15.20,
    -34.604000,
    -58.381900,
    10.60,
    null,
    true,
    445,
    'nullified'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '44444444-4444-4444-8444-444444444444',
    '2026-04-09',
    '2026-04-09T12:10:00Z',
    null,
    -34.605100,
    -58.380700,
    9.30,
    null,
    null,
    null,
    null,
    false,
    null,
    'open'
  )
on conflict (id) do update
set
  employee_id = excluded.employee_id,
  work_date = excluded.work_date,
  check_in_at = excluded.check_in_at,
  check_out_at = excluded.check_out_at,
  check_in_lat = excluded.check_in_lat,
  check_in_lng = excluded.check_in_lng,
  check_in_accuracy = excluded.check_in_accuracy,
  check_out_lat = excluded.check_out_lat,
  check_out_lng = excluded.check_out_lng,
  check_out_accuracy = excluded.check_out_accuracy,
  task_text = excluded.task_text,
  null_report = excluded.null_report,
  total_minutes = excluded.total_minutes,
  status = excluded.status;

insert into public.report_mail_logs (
  id,
  from_date,
  to_date,
  recipient_email,
  subject,
  sent_at,
  sent_by
)
values
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '2026-04-01',
    '2026-04-30',
    'admin@empresa.com',
    'Reporte mensual Abril 2026',
    '2026-04-03T15:00:00Z',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    '2026-03-01',
    '2026-03-31',
    'rrhh@empresa.com',
    'Reporte mensual Marzo 2026',
    '2026-04-01T13:30:00Z',
    '11111111-1111-4111-8111-111111111111'
  )
on conflict (id) do update
set
  from_date = excluded.from_date,
  to_date = excluded.to_date,
  recipient_email = excluded.recipient_email,
  subject = excluded.subject,
  sent_at = excluded.sent_at,
  sent_by = excluded.sent_by;
