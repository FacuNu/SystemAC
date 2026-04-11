# Implementacion tecnica del flujo empleado

## Alcance implementado

Se completo el flujo de empleado para REPORTE HORARIO sobre la estructura existente:

- `/panel`
- `/panel/ingreso`
- `/panel/egreso`
- `POST /api/reports/check-in`
- `POST /api/reports/check-out`
- `lib/reports.ts`
- `lib/validations.ts`

La implementacion mantiene los contratos de `contracts/reports.ts` y `contracts/shared.ts` sin cambios.

## Backend

### `lib/reports.ts`

Se implemento la logica principal de reportes:

- `createCheckInReport(payload)`
  - exige sesion valida con `requireRole("employee")`
  - valida el request con `checkInRequestSchema`
  - consulta si el empleado ya tiene una jornada abierta
  - registra una nueva fila en `work_reports`
  - persiste:
    - `work_date`
    - `check_in_at`
    - `check_in_lat`
    - `check_in_lng`
    - `check_in_accuracy`
    - `status = 'open'`
  - devuelve el reporte mapeado al contrato `ReportSummary`

- `closeCheckOutReport(payload)`
  - exige sesion valida con `requireRole("employee")`
  - valida el request con `checkOutRequestSchema`
  - busca la jornada abierta del empleado
  - calcula `total_minutes`
  - si `taskText` queda vacio:
    - exige `confirmNullReport = true`
    - guarda `null_report = true`
    - guarda `status = 'nullified'`
    - guarda `task_text = null`
  - si `taskText` tiene contenido:
    - guarda `task_text`
    - guarda `null_report = false`
    - guarda `status = 'closed'`
  - en ambos casos persiste:
    - `check_out_at`
    - `check_out_lat`
    - `check_out_lng`
    - `check_out_accuracy`
    - `total_minutes`

- `getOpenReportByEmployee(employeeId)`
  - devuelve la jornada abierta actual o `null`

- `getReportsByDateRange(fromDate, toDate)`
- `getEmployeeReportsByDateRange(employeeId, fromDate, toDate)`
  - quedaron implementados con consultas reales para no dejar el modulo incompleto

### Manejo de errores

Se usan `ApiError` y `buildErrorResponse()` para responder en formato consistente.

Conflictos cubiertos:

- ingreso con jornada abierta
- egreso sin jornada abierta
- intento de cierre sin confirmar reporte nulo
- conflicto por unicidad o estado en DB

## Validaciones

### `lib/validations.ts`

Se agregaron helpers de dominio:

- `normalizeTaskText()`
  - trimmea el texto de tareas
  - convierte vacio a `null`

- `ensureNullReportConfirmation()`
  - obliga confirmacion explicita cuando no hay tareas

- `calculateWorkedMinutes()`
  - calcula minutos entre ingreso y egreso
  - rechaza egreso anterior al ingreso

Estas validaciones complementan las validaciones visuales del frontend y refuerzan la regla critica en backend.

## API

### `POST /api/reports/check-in`

Implementado en:

- `app/api/reports/check-in/route.ts`

Comportamiento:

- parsea el body con `checkInRequestSchema`
- delega en `createCheckInReport()`
- responde con shape exacto de `CheckInResponse`

### `POST /api/reports/check-out`

Implementado en:

- `app/api/reports/check-out/route.ts`

Comportamiento:

- parsea el body con `checkOutRequestSchema`
- delega en `closeCheckOutReport()`
- responde con shape exacto de `CheckOutResponse`
- devuelve mensaje distinto cuando el cierre queda `nullified`

## Frontend

## `/panel`

Implementado en:

- `app/panel/page.tsx`

Comportamiento:

- obtiene el usuario actual y la jornada abierta real
- muestra accesos claros a ingreso y egreso
- muestra estado actual del empleado
- muestra resumen de la jornada abierta si existe
- orienta al siguiente paso correcto segun el estado

## `/panel/ingreso`

Implementado en:

- `app/panel/ingreso/page.tsx`
- `app/panel/check-in-form.tsx`

Comportamiento:

- si ya hay jornada abierta, bloquea el flujo y redirige conceptualmente a egreso
- si no hay jornada abierta:
  - solicita geolocalizacion
  - muestra resumen previo
  - envia `location` y `clientTimestamp` a `/api/reports/check-in`
  - muestra error, carga y confirmacion de exito

## `/panel/egreso`

Implementado en:

- `app/panel/egreso/page.tsx`
- `app/panel/check-out-form.tsx`

Comportamiento:

- si no hay jornada abierta, bloquea el flujo y deriva conceptualmente a ingreso
- si hay jornada abierta:
  - muestra resumen de la jornada en curso
  - solicita geolocalizacion
  - pide tareas realizadas
  - si tareas vacias:
    - muestra confirmacion explicita
    - solo envia con `confirmNullReport = true`
  - si tareas presentes:
    - envia cierre normal
  - muestra error, carga y confirmacion de exito

## Geolocalizacion

Se centralizo la logica cliente en:

- `app/panel/report-utils.ts`

Incluye:

- formateo de fecha/hora
- formateo de ubicacion
- pedido de geolocalizacion con `navigator.geolocation`
- manejo de errores claros para:
  - permiso denegado
  - posicion no disponible
  - timeout
  - navegador sin soporte

## Decisiones tecnicas

- Se mantuvieron exactamente los estados:
  - `open`
  - `closed`
  - `nullified`

- No se tocaron auth ni middleware fuera del consumo de helpers ya existentes:
  - `requireRole("employee")`
  - `getOpenReportByEmployee()`

- Se mantuvo el uso del contrato actual del repo basado en `employeeCode` para sesion/auth.

- La persistencia usa timestamp de servidor como fuente de verdad para guardar en DB.
  - `clientTimestamp` se sigue enviando porque forma parte del contrato actual de request.

## Archivos agregados o completados

- `app/panel/page.tsx`
- `app/panel/ingreso/page.tsx`
- `app/panel/egreso/page.tsx`
- `app/panel/check-in-form.tsx`
- `app/panel/check-out-form.tsx`
- `app/panel/report-utils.ts`
- `app/api/reports/check-in/route.ts`
- `app/api/reports/check-out/route.ts`
- `lib/reports.ts`
- `lib/validations.ts`

## Verificacion realizada

Se ejecuto:

- `npm run typecheck`
- `npm run build`

Ambos comandos terminaron correctamente.
