# Local Setup

## 1. Complete `.env.local`

The repo now includes a base [`.env.local`](/E:/SystemAC/.env.local).

You still need to fill:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2. Apply database schema

In your Supabase SQL editor, run:

1. [`supabase/migrations/0000_initial_schema.sql`](/E:/SystemAC/supabase/migrations/0000_initial_schema.sql)
2. [`supabase/migrations/0001_employee_monthly_salary.sql`](/E:/SystemAC/supabase/migrations/0001_employee_monthly_salary.sql)
3. [`supabase/migrations/0002_allow_multiple_reports_per_day.sql`](/E:/SystemAC/supabase/migrations/0002_allow_multiple_reports_per_day.sql)
4. [`supabase/migrations/0003_employee_password_change_required.sql`](/E:/SystemAC/supabase/migrations/0003_employee_password_change_required.sql)
5. [`supabase/seed.sql`](/E:/SystemAC/supabase/seed.sql)

## 3. Start the app

```bash
npm run dev
```

Open:

- `http://localhost:3000`

## 4. Test users from seed

Admin:

- employee code: `ADM-001`
- password: `30000000`

Employees:

- `EMP-001` / `30111222`
- `EMP-002` / `28999111`
- `EMP-003` / `31555777`

## 5. What works today

- login
- protected routes
- employee check-in
- employee check-out
- monthly XLSX export
- salary summary and employee detail

## 6. What will not work yet

- report email sending

That route still returns `Not Implemented`:

- [`app/api/admin/send-report-email/route.ts`](/E:/SystemAC/app/api/admin/send-report-email/route.ts)
