# Implementacion tecnica de la capa de base de datos

## Alcance

Se completo y endurecio la base SQL de REPORTE HORARIO sobre estas entidades:

- `employees`
- `work_reports`
- `report_mail_logs`

Tambien se completo el seed inicial, se alinearon tipos compartidos y se documentaron decisiones globales de persistencia.

## Cambios en `employees`

- Se mantuvo la tabla y los nombres de columnas existentes.
- Se agregaron checks para evitar valores vacios en:
  - `full_name`
  - `employee_code`
  - `password_hash`
- Se agrego check para `hourly_rate >= 0` cuando no es `null`.
- Se definio `employee_code` como identificador operativo estable para login.
- Se agrego normalizacion obligatoria en mayusculas y un indice unico sobre `employee_code`.

### Impacto tecnico

- El login debe buscar por `employee_code`, no por nombre.
- La base evita IDs duplicados y obliga formato normalizado como `EMP-001`.

## Cambios en `work_reports`

- Se mantuvo la tabla, los estados y las columnas definidas por contrato.
- Se endurecio el modelo para que un reporte valido siempre tenga:
  - `check_in_at` obligatorio
  - `check_in_lat`, `check_in_lng`, `check_in_accuracy` obligatorios
- Se agrego check para que `work_date` coincida con la fecha UTC de `check_in_at`.
- Se mantuvo la regla `check_out_at >= check_in_at`.
- Se agregaron validaciones de rango para coordenadas y accuracy.
- Se agregaron validaciones para que los datos de check-out sean completos: o vienen los 3 campos o no viene ninguno.
- Se agrego una regla fuerte de consistencia entre:
  - `status`
  - `null_report`
  - `task_text`
  - `check_out_*`
  - `total_minutes`

### Regla por estado

- `open`
  - no admite `check_out_at`
  - no admite geolocalizacion de egreso
  - no admite `total_minutes`
  - exige `null_report = false`
  - exige `task_text = null`
- `closed`
  - exige `check_out_at`
  - exige geolocalizacion de egreso completa
  - exige `total_minutes`
  - exige `null_report = false`
  - exige `task_text` no vacio
- `nullified`
  - exige `check_out_at`
  - exige geolocalizacion de egreso completa
  - exige `total_minutes`
  - exige `null_report = true`
  - exige `task_text` vacio o `null`

### Indices y unicidad

- Se agrego indice unico `(employee_id, work_date)` para permitir una sola jornada por empleado por dia.
- Se mantuvo y consolido la regla de una sola jornada abierta por empleado con un indice unico parcial:
  - `where status = 'open'`
- Se agregaron indices de lectura para consultas esperadas:
  - `(employee_id, work_date desc)`
  - `(work_date)`

### Trigger

- Se creo la funcion `public.set_updated_at()`.
- Se creo trigger `set_work_reports_updated_at` para refrescar `updated_at` en cada `update`.

## Cambios en `report_mail_logs`

- Se mantuvo la tabla y sus columnas.
- Se agregaron checks para:
  - rango valido `from_date <= to_date`
  - `recipient_email` no vacio
  - `subject` no vacio
  - forma minima de email con presencia de `@`
- Se agregaron indices para consultas administrativas:
  - `(sent_at desc)`
  - `(from_date, to_date)`
  - `(sent_by, sent_at desc)`

## Seed inicial

En `supabase/seed.sql` se dejaron datos coherentes y reutilizables:

- 1 admin:
  - `Administrador General`
- 3 empleados:
  - `Juan Perez`
  - `Maria Gomez`
  - `Luciano Fernandez`
- IDs operativos:
  - `ADM-001`
  - `EMP-001`
  - `EMP-002`
  - `EMP-003`
- `hourly_rate` distinto para cada empleado
- `password_hash` generado con `crypt(..., gen_salt('bf', 10))`
- `dni_hash` generado con `digest(..., 'sha256')`

### Datos funcionales incluidos

- 1 reporte `closed`
- 1 reporte `nullified`
- 1 reporte `open`
- 2 registros en `report_mail_logs`

Esto deja cubiertos los casos minimos para probar:

- login
- jornada abierta
- jornada cerrada con tareas
- reporte nulo
- auditoria de envio de mails

## Tipos compartidos

Se ajusto `types/database.ts` para reflejar el schema real de `work_reports`:

- `check_in_at` paso a obligatorio
- `check_in_lat` paso a obligatorio
- `check_in_lng` paso a obligatorio
- `check_in_accuracy` paso a obligatorio

No se cambiaron nombres de tablas, columnas, rutas ni estados globales.

## Documentacion global actualizada

Se dejaron explicitadas estas decisiones en la documentacion compartida:

- `employees.employee_code` es unico y se usa para login
- `work_reports` permite una sola jornada por empleado por `work_date`
- `work_date` representa la fecha de ingreso

## Verificacion realizada

- Se revisaron los archivos SQL y de tipos luego de los cambios.
- `npm run typecheck` ejecuto correctamente.

## Pendiente fuera de este cambio

- Aplicar `supabase/migrations/0000_initial_schema.sql` sobre la instancia real.
- Correr `supabase/seed.sql` sobre esa base.
- Validar contra Supabase real inserts validos e inserts invalidos para confirmar cada constraint en ejecucion.
