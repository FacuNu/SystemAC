# Handoff Tecnico Para Trabajo Paralelo

Este anexo complementa `documentacion.md` y fija las interfaces tecnicas que deben respetar las terminales a partir de la Fase 0 ya creada.

## Estado actual de la base

La base inicial del proyecto ya dejo creados estos puntos:

- Proyecto Next.js App Router + TypeScript + Tailwind inicializado.
- Rutas placeholder ya creadas para:
  - `/login`
  - `/panel`
  - `/panel/ingreso`
  - `/panel/egreso`
  - `/admin`
  - `/admin/reportes`
  - `/admin/sueldos`
  - `/admin/sueldos/[employeeId]`
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/reports/check-in`
  - `/api/reports/check-out`
  - `/api/admin/monthly-xlsx`
  - `/api/admin/send-report-email`
- Layout global, componentes UI base y middleware placeholder creados.
- Tipos compartidos y contratos API iniciales creados.
- SQL inicial de schema creado en `supabase/migrations/0000_initial_schema.sql`.

Estado actualizado del modulo admin:
- `/admin` implementado como panel de acceso.
- `/admin/reportes` implementado con formulario de rango y descarga XLSX.
- `/admin/sueldos` implementado con resumen salarial por empleado.
- `/admin/sueldos/[employeeId]` implementado con detalle de jornadas y total acumulado.
- `POST /api/admin/monthly-xlsx` implementado con generacion real de workbook.
- `lib/excel.ts` y `lib/salary.ts` implementados.

## Archivos comunes que no deben romperse

Estas rutas ya existen y deben extenderse sin cambiar nombres globales:

- `lib/db.ts`
- `lib/auth.ts`
- `lib/reports.ts`
- `lib/salary.ts`
- `lib/excel.ts`
- `lib/mail.ts`
- `lib/session.ts`
- `contracts/auth.ts`
- `contracts/reports.ts`
- `contracts/admin.ts`
- `contracts/shared.ts`
- `types/domain.ts`
- `types/database.ts`
- `middleware.ts`

## Contratos de API esperados

Si una terminal necesita agregar campos, debe hacerlo sin romper compatibilidad con estos shapes base.

### Auth

`POST /api/auth/login`

Request:
```json
{
  "employeeCode": "EMP-001",
  "password": "12345678"
}
```

Response:
```json
{
  "ok": true,
  "message": "Login correcto.",
  "redirectTo": "/panel",
  "user": {
    "id": "uuid",
    "fullName": "Juan Perez",
    "employeeCode": "EMP-001",
    "role": "employee"
  }
}
```

`POST /api/auth/logout`

Response:
```json
{
  "ok": true,
  "message": "Sesion cerrada."
}
```

### Reports

Notas de persistencia que quedan fijadas desde la capa SQL:

- `employees.employee_code` es el identificador operativo para login.
- `employees.employee_code` debe guardarse normalizado en mayusculas y ser unico.
- `work_reports` admite una sola jornada abierta por empleado y una sola jornada total por empleado por `work_date`.
- `work_date` representa la fecha de ingreso de la jornada.

`POST /api/reports/check-in`

Request:
```json
{
  "location": {
    "lat": -34.6037,
    "lng": -58.3816,
    "accuracy": 12.5
  },
  "clientTimestamp": "2026-04-09T12:00:00.000Z"
}
```

`POST /api/reports/check-out`

Request:
```json
{
  "location": {
    "lat": -34.6037,
    "lng": -58.3816,
    "accuracy": 10.1
  },
  "taskText": "Detalle de tareas",
  "confirmNullReport": false,
  "clientTimestamp": "2026-04-09T18:00:00.000Z"
}
```

Response base en ambos casos:
```json
{
  "ok": true,
  "message": "Operacion realizada.",
  "report": {
    "id": "uuid",
    "employeeId": "uuid",
    "workDate": "2026-04-09",
    "checkInAt": "2026-04-09T12:00:00.000Z",
    "checkOutAt": null,
    "checkInLocation": {
      "lat": -34.6037,
      "lng": -58.3816,
      "accuracy": 12.5
    },
    "checkOutLocation": null,
    "taskText": null,
    "nullReport": false,
    "totalMinutes": null,
    "status": "open"
  }
}
```

### Admin

`POST /api/admin/monthly-xlsx`

Request:
```json
{
  "fromDate": "2026-04-01",
  "toDate": "2026-04-30",
  "format": "xlsx"
}
```

Implementacion actual:
- valida el request con `monthlyXlsxRequestSchema`
- exige `requireRole('admin')`
- responde descarga binaria del archivo XLSX
- nombre de archivo: `reporte-mensual-YYYY-MM-DD_a_YYYY-MM-DD.xlsx`
- hojas generadas: `Detalle` y `Resumen`

`POST /api/admin/send-report-email`

Request:
```json
{
  "fromDate": "2026-04-01",
  "toDate": "2026-04-30",
  "recipientEmail": "admin@empresa.com",
  "subject": "Reporte mensual",
  "message": "Adjunto reporte."
}
```

## Sesion y cookies

La autenticacion debe resolverse con cookie `httpOnly`, `secure` en produccion y `sameSite=lax` como minimo.

Convenciones iniciales:

- Nombre de cookie: `rh_session`
- Helper comun: `lib/session.ts`
- Lectura de usuario actual: `getCurrentUser()`
- Guardas obligatorias:
  - `requireAuth()`
  - `requireRole('admin' | 'employee')`

La terminal de auth puede definir implementacion con JWT firmado o session token persistido, pero debe mantener esos helpers y no exponer secretos al cliente.

## Convencion de errores HTTP

Usar formato JSON consistente:

```json
{
  "ok": false,
  "message": "Descripcion clara del error.",
  "code": "ERROR_CODE"
}
```

Sugerencia de status codes:

- `400` request invalido
- `401` sin sesion valida
- `403` rol insuficiente
- `404` recurso no encontrado cuando aplique
- `409` conflicto de negocio
- `422` validacion semantica
- `500` error interno
- `501` placeholder no implementado

## Ownership sugerido para paralelizar

Para evitar choques, distribuir asi:

### Terminal A

Responsable de datos y persistencia:

- `supabase/migrations/*`
- `supabase/seed.sql`
- ajuste de `types/database.ts` si hace falta
- documentar constraints e indices

### Terminal B

Responsable de auth y sesion:

- `app/login/*`
- `app/api/auth/*`
- `lib/auth.ts`
- `lib/session.ts`
- `middleware.ts`
- componentes puntuales del login si hicieran falta

### Terminal C

Responsable de flujo empleado:

- `app/panel/*`
- `app/api/reports/*`
- `lib/reports.ts`
- `lib/validations.ts`

### Terminal D

Responsable de admin y XLSX:

- `app/admin/reportes/*`
- `app/admin/sueldos/*`
- `app/api/admin/monthly-xlsx/*`
- `lib/excel.ts`
- `lib/salary.ts`

Estado:
- implementado
- el procesamiento pesado de reportes y sueldos quedo del lado server
- se agregaron consultas compatibles en `lib/reports.ts` para empleados por rol y por id

### Terminal E

Responsable de mail:

- `app/api/admin/send-report-email/*`
- UI de envio admin
- `lib/mail.ts`

## Orden real recomendado

Con la base ya creada, el orden recomendado pasa a ser:

1. Terminal A: DB y migraciones
2. Terminal B: Auth y sesiones
3. Terminal C y Terminal D en paralelo cuando A y B esten estables
4. Terminal E al final, o parcialmente en paralelo con D

## Regla para cualquier cambio global

Si una terminal necesita cambiar:

- nombre de tabla
- nombre de columna
- nombre de ruta
- estados de reportes
- contrato base de request/response

debe actualizar:

- `documentacion.md`
- `contracts/*`
- `types/*`

y dejar el cambio explicitado en el mismo commit.

Tambien debe documentar si cambia reglas globales de persistencia como unicidad por dia, normalizacion de `employee_code` o consistencia entre `status`, `null_report` y `task_text`.
