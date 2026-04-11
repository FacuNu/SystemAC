create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'employee_role'
  ) then
    create type employee_role as enum ('admin', 'employee');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'work_report_status'
  ) then
    create type work_report_status as enum ('open', 'closed', 'nullified');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  employee_code text not null,
  password_hash text not null,
  dni_hash text,
  role employee_role not null,
  hourly_rate numeric(12,2),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint employees_full_name_not_blank
    check (btrim(full_name) <> ''),
  constraint employees_employee_code_not_blank
    check (btrim(employee_code) <> ''),
  constraint employees_employee_code_normalized
    check (employee_code = upper(btrim(employee_code))),
  constraint employees_password_hash_not_blank
    check (btrim(password_hash) <> ''),
  constraint employees_hourly_rate_non_negative
    check (hourly_rate is null or hourly_rate >= 0)
);

create table if not exists public.work_reports (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  work_date date not null,
  check_in_at timestamptz not null,
  check_out_at timestamptz,
  check_in_lat numeric(9,6) not null,
  check_in_lng numeric(9,6) not null,
  check_in_accuracy numeric(10,2) not null,
  check_out_lat numeric(9,6),
  check_out_lng numeric(9,6),
  check_out_accuracy numeric(10,2),
  task_text text,
  null_report boolean not null default false,
  total_minutes integer,
  status work_report_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint work_reports_work_date_matches_check_in
    check (work_date = (check_in_at at time zone 'utc')::date),
  constraint work_reports_checkout_after_checkin
    check (check_out_at is null or check_out_at >= check_in_at),
  constraint work_reports_check_in_coordinates_valid
    check (
      check_in_lat between -90 and 90
      and check_in_lng between -180 and 180
      and check_in_accuracy >= 0
    ),
  constraint work_reports_check_out_coordinates_valid
    check (
      check_out_lat is null
      or (
        check_out_lat between -90 and 90
        and check_out_lng between -180 and 180
        and check_out_accuracy >= 0
      )
    ),
  constraint work_reports_check_out_coordinates_complete
    check (
      (check_out_lat is null and check_out_lng is null and check_out_accuracy is null)
      or (check_out_lat is not null and check_out_lng is not null and check_out_accuracy is not null)
    ),
  constraint work_reports_total_minutes_non_negative
    check (total_minutes is null or total_minutes >= 0),
  constraint work_reports_status_payload_consistency
    check (
      (status = 'open'
        and check_out_at is null
        and check_out_lat is null
        and check_out_lng is null
        and check_out_accuracy is null
        and total_minutes is null
        and null_report = false
        and task_text is null)
      or
      (status = 'closed'
        and check_out_at is not null
        and check_out_lat is not null
        and check_out_lng is not null
        and check_out_accuracy is not null
        and total_minutes is not null
        and null_report = false
        and btrim(coalesce(task_text, '')) <> '')
      or
      (status = 'nullified'
        and check_out_at is not null
        and check_out_lat is not null
        and check_out_lng is not null
        and check_out_accuracy is not null
        and total_minutes is not null
        and null_report = true
        and btrim(coalesce(task_text, '')) = '')
    )
);

create table if not exists public.report_mail_logs (
  id uuid primary key default gen_random_uuid(),
  from_date date not null,
  to_date date not null,
  recipient_email text not null,
  subject text not null,
  sent_at timestamptz not null default timezone('utc', now()),
  sent_by uuid references public.employees(id) on delete set null,
  constraint report_mail_logs_valid_range
    check (from_date <= to_date),
  constraint report_mail_logs_recipient_email_not_blank
    check (btrim(recipient_email) <> ''),
  constraint report_mail_logs_recipient_email_shape
    check (position('@' in recipient_email) > 1),
  constraint report_mail_logs_subject_not_blank
    check (btrim(subject) <> '')
);

create unique index if not exists employees_employee_code_uidx
  on public.employees (employee_code);

create index if not exists employees_role_idx
  on public.employees (role);

create index if not exists employees_is_active_idx
  on public.employees (is_active);

create unique index if not exists work_reports_one_report_per_employee_per_day_uidx
  on public.work_reports (employee_id, work_date);

create unique index if not exists work_reports_one_open_report_per_employee_idx
  on public.work_reports (employee_id)
  where status = 'open';

create index if not exists work_reports_employee_work_date_idx
  on public.work_reports (employee_id, work_date desc);

create index if not exists work_reports_work_date_idx
  on public.work_reports (work_date);

create index if not exists report_mail_logs_sent_at_idx
  on public.report_mail_logs (sent_at desc);

create index if not exists report_mail_logs_date_range_idx
  on public.report_mail_logs (from_date, to_date);

create index if not exists report_mail_logs_sent_by_sent_at_idx
  on public.report_mail_logs (sent_by, sent_at desc);

drop trigger if exists set_work_reports_updated_at on public.work_reports;

create trigger set_work_reports_updated_at
before update on public.work_reports
for each row
execute function public.set_updated_at();
