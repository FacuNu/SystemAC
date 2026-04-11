alter table public.employees
add column if not exists monthly_salary numeric(12,2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_monthly_salary_non_negative'
  ) then
    alter table public.employees
      add constraint employees_monthly_salary_non_negative
      check (monthly_salary is null or monthly_salary >= 0);
  end if;
end $$;
