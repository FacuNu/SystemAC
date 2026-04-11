# REPORTE HORARIO â€” DocumentaciÃ³n operativa para desarrollo por terminales

## 1. Objetivo del proyecto

**REPORTE HORARIO** es una aplicaciÃ³n web interna para registrar jornadas laborales de empleados mediante un flujo simple de **Ingreso** y **Egreso**, capturando ademÃ¡s las **tareas realizadas** y la **geolocalizaciÃ³n** al momento de marcar.

El sistema debe permitir:

- AutenticaciÃ³n de empleados y administradores.
- Registro de ingreso con fecha/hora automÃ¡tica.
- Registro de egreso con fecha/hora automÃ¡tica y detalle de tareas.
- Captura de geolocalizaciÃ³n al momento de marcar ingreso y egreso.
- GestiÃ³n administrativa de reportes mensuales.
- ExportaciÃ³n de informaciÃ³n a **XLSX**.
- CÃ¡lculo de horas trabajadas.
- VisualizaciÃ³n de sueldos estimados segÃºn valor hora.
- EnvÃ­o de reportes por email.

---

## 2. Stack definido

### Frontend / Backend web
- **Next.js** con **App Router**
- **TypeScript**
- **Tailwind CSS**
- Deploy en **Vercel**

### Base de datos
- **Supabase Postgres**

### Seguridad y backend
- AutenticaciÃ³n propia desde backend de la app.
- Sesiones seguras con cookie `httpOnly`.
- Rutas protegidas por rol.
- Operaciones administrativas sÃ³lo desde backend.

### Funcionalidades auxiliares
- GeneraciÃ³n de Excel con librerÃ­a de XLSX.
- EnvÃ­o de correo desde backend usando SMTP o proveedor transactional.

---

## 3. Decisiones de negocio ya cerradas

Estas decisiones deben asumirse como definitivas salvo que el responsable funcional las cambie explÃ­citamente.

### 3.1 Login
- El usuario ingresa con:
  - **ID de empleado:** codigo interno
  - **ContraseÃ±a inicial:** DNI
- TÃ©cnicamente no se debe guardar el DNI en texto plano como contraseÃ±a.
- Se debe guardar `password_hash`.
- RecomendaciÃ³n de seguridad: el DNI funciona como clave inicial o administrativa, no como contraseÃ±a real permanente.

### 3.2 GeolocalizaciÃ³n
- Se debe capturar la geolocalizaciÃ³n al marcar ingreso y egreso.
- En entorno web, la geolocalizaciÃ³n **requiere permiso del navegador**.
- No se puede obtener la ubicaciÃ³n de forma completamente invisible para el usuario.
- El sistema debe mostrar mensaje claro si la geolocalizaciÃ³n falla o es rechazada.

### 3.3 Reporte nulo
- Si al hacer egreso no se cargan tareas y el usuario confirma continuar, el reporte se guarda como:
  - `null_report = true`
  - `status = 'nullified'`
- Un reporte nulo:
  - **no cuenta como dÃ­a trabajado vÃ¡lido**
  - **no suma horas para sueldo**

### 3.4 Jornadas abiertas
- Un empleado **no puede tener mÃ¡s de una jornada abierta** al mismo tiempo.
- Si ya existe una jornada con `status = 'open'`, no se puede volver a marcar ingreso.

### 3.5 Sueldos
- El mÃ³dulo â€œSueldosâ€ se calcularÃ¡ como:
  - `horas_totales * valor_hora`
- El `valor_hora` se toma desde la tabla de empleados.

### 3.6 Decisiones SQL globales
- `employees.employee_code` debe ser unico.
- `employees.employee_code` debe guardarse normalizado en mayusculas.
- Auth debe identificar al usuario por `employee_code`, no por nombre.
- A nivel DB se debe permitir **una sola jornada por empleado por `work_date`** para evitar duplicados cerrados o nulos del mismo dÃƒÂ­a.

---

### 3.6 Decisiones SQL globales
- `employees.employee_code` debe ser unico.
- `employees.employee_code` debe guardarse normalizado en mayusculas.
- Auth debe identificar al usuario por `employee_code`, no por nombre.
- A nivel DB se debe permitir **una sola jornada por empleado por `work_date`** para evitar duplicados cerrados o nulos del mismo dia.

## 4. Alcance funcional

## 4.1 Empleado

### Login
Pantalla con:
- campo ID de empleado
- campo contraseÃ±a
- botÃ³n ingresar

### Panel principal
Debe mostrar dos botones:
- **Ingreso**
- **Egreso**

### Flujo de Ingreso
Al presionar â€œIngresoâ€:
1. Obtener fecha y hora actual.
2. Solicitar geolocalizaciÃ³n.
3. Mostrar resumen con:
   - fecha
   - hora
   - ubicaciÃ³n obtenida
4. Mostrar botÃ³n **Marcar**.
5. Al confirmar:
   - crear una jornada nueva en `work_reports`
   - dejar `status = 'open'`

### Flujo de Egreso
Al presionar â€œEgresoâ€:
1. Buscar la jornada abierta del empleado.
2. Obtener fecha y hora actual.
3. Solicitar geolocalizaciÃ³n.
4. Mostrar formulario con textarea para tareas realizadas.
5. Si intenta enviar vacÃ­o:
   - mostrar confirmaciÃ³n:
     - â€œTu reporte quedarÃ¡ nulo y no se contemplarÃ¡ el dÃ­a trabajado. Â¿Desea continuar?â€
6. Si confirma vacÃ­o:
   - guardar `null_report = true`
   - `status = 'nullified'`
7. Si carga tareas:
   - guardar `task_text`
   - `status = 'closed'`
8. Al enviar:
   - registrar egreso
   - registrar ubicaciÃ³n de egreso
   - calcular `total_minutes`

---

## 4.2 Admin

### Panel admin
Debe incluir como mÃ­nimo:
- botÃ³n o acceso a **Generar reporte mensual**
- botÃ³n o acceso a **Sueldos**
- botÃ³n o acceso a **Enviar reporte por mail**

### Generar reporte mensual
Pantalla con:
- fecha desde
- fecha hasta
- botÃ³n generar

Estado actual implementado:
- la pantalla `/admin/reportes` ya permite seleccionar rango y descargar el archivo
- la generaciÃ³n del workbook se resuelve server-side
- la descarga se realiza desde `POST /api/admin/monthly-xlsx`

Debe generar un archivo **XLSX** con al menos dos hojas:

#### Hoja 1: Detalle
Columnas mÃ­nimas:
- empleado
- fecha
- ingreso
- egreso
- horas trabajadas
- tareas
- lat/lng ingreso
- lat/lng egreso
- accuracy ingreso/egreso
- null_report
- estado

#### Hoja 2: Resumen
Columnas mÃ­nimas:
- empleado
- total horas vÃ¡lidas
- cantidad de dÃ­as vÃ¡lidos
- cantidad de reportes nulos
- valor hora
- sueldo estimado

Comportamiento actual implementado:
- la hoja `Detalle` incluye empleado, fecha, ingreso, egreso, horas trabajadas, tareas, lat/lng de ingreso y egreso, accuracy de ingreso y egreso, `null_report` y estado
- la hoja `Resumen` incluye empleado, horas vÃ¡lidas, dÃ­as vÃ¡lidos, reportes nulos, valor hora y sueldo estimado
- los reportes nulos se exportan en `Detalle`, pero no se suman en `Resumen`

### Sueldos
Debe mostrar listado por empleado con:
- nombre y apellido
- horas totales del perÃ­odo
- valor hora
- sueldo estimado
- botÃ³n **Ver detalle**

Estado actual implementado:
- `/admin/sueldos` ya lista empleados del perÃ­odo seleccionado
- el resumen se calcula server-side agrupando reportes por empleado
- el perÃ­odo se toma desde `fromDate` y `toDate` en query string, con default al mes actual

### Ver detalle
Debe mostrar, para un empleado y perÃ­odo:
- fecha
- ingreso
- egreso
- horas trabajadas
- tareas
- estado del reporte
- reporte nulo sÃ­/no
- total acumulado

Estado actual implementado:
- `/admin/sueldos/[employeeId]` ya muestra jornadas del perÃ­odo
- el acumulado excluye reportes nulos
- si el empleado no existe o no es de rol `employee`, la ruta responde `notFound()`

### EnvÃ­o por mail
Debe permitir:
- ingresar fecha desde/hasta
- ingresar email destino manualmente
- editar asunto
- editar mensaje
- enviar correo con XLSX adjunto
- registrar el envÃ­o en base

---

## 5. Arquitectura sugerida

```text
app/
  login/page.tsx
  panel/page.tsx
  panel/ingreso/page.tsx
  panel/egreso/page.tsx
  admin/page.tsx
  admin/reportes/page.tsx
  admin/sueldos/page.tsx
  admin/sueldos/[employeeId]/page.tsx
  api/auth/login/route.ts
  api/auth/logout/route.ts
  api/reports/check-in/route.ts
  api/reports/check-out/route.ts
  api/admin/monthly-xlsx/route.ts
  api/admin/send-report-email/route.ts

components/
  ui/
  auth/
  employee/
  admin/

lib/
  auth.ts
  db.ts
  session.ts
  geo.ts
  validations.ts
  excel.ts
  mail.ts
  salary.ts
  reports.ts

supabase/
  migrations/
  seed.sql
```

---

## 6. Modelo de datos

## 6.1 Tabla `employees`

Campos propuestos:
- `id` uuid pk
- `full_name` text not null
- `employee_code` text unique not null
- `password_hash` text not null
- `dni_hash` text nullable
- `role` text check in ('admin','employee')
- `hourly_rate` numeric(12,2) nullable
- `is_active` boolean default true
- `created_at` timestamptz default now()

## 6.2 Tabla `work_reports`

Campos propuestos:
- `id` uuid pk
- `employee_id` uuid fk -> employees(id)
- `work_date` date not null
- `check_in_at` timestamptz nullable
- `check_out_at` timestamptz nullable
- `check_in_lat` numeric nullable
- `check_in_lng` numeric nullable
- `check_in_accuracy` numeric nullable
- `check_out_lat` numeric nullable
- `check_out_lng` numeric nullable
- `check_out_accuracy` numeric nullable
- `task_text` text nullable
- `null_report` boolean default false
- `total_minutes` integer nullable
- `status` text check in ('open','closed','nullified')
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

## 6.3 Tabla `report_mail_logs`

Campos propuestos:
- `id` uuid pk
- `from_date` date not null
- `to_date` date not null
- `recipient_email` text not null
- `subject` text not null
- `sent_at` timestamptz default now()
- `sent_by` uuid fk -> employees(id)

---

## 7. Reglas de validaciÃ³n backend

Estas validaciones deben existir aunque tambiÃ©n haya validaciÃ³n visual en frontend.

### Login
- ID de empleado obligatorio.
- ContraseÃ±a obligatoria.
- El usuario debe existir y estar activo.
- La contraseÃ±a debe validar contra `password_hash`.

### Check-in
- Debe existir sesiÃ³n vÃ¡lida.
- Debe ser rol `employee`.
- No debe existir jornada abierta previa.
- Debe registrarse fecha/hora de check-in.
- Debe registrarse geolocalizaciÃ³n si la polÃ­tica final la deja obligatoria.

### Check-out
- Debe existir sesiÃ³n vÃ¡lida.
- Debe ser rol `employee`.
- Debe existir una jornada abierta.
- El check-out no puede ser anterior al check-in.
- Si no hay tareas:
  - sÃ³lo se permite cerrar como nulo mediante confirmaciÃ³n explÃ­cita.
- Si hay tareas:
  - se guarda como jornada cerrada normal.
- Debe calcularse `total_minutes`.

### ExportaciÃ³n admin
- Debe existir sesiÃ³n vÃ¡lida.
- Debe ser rol `admin`.
- Las fechas desde/hasta deben ser vÃ¡lidas.
- El rango no debe invertirse.
- La ruta `POST /api/admin/monthly-xlsx` valida el request con `monthlyXlsxRequestSchema`.
- La respuesta exitosa actual es binaria con headers `Content-Type` de XLSX y `Content-Disposition` para descarga.

### EnvÃ­o mail admin
- Debe existir sesiÃ³n vÃ¡lida.
- Debe ser rol `admin`.
- El email destino debe ser vÃ¡lido.
- El archivo adjunto debe generarse correctamente antes de enviar.

---

## 8. Criterios de UX

- UI simple, limpia y responsive.
- Mensajes de error claros.
- Estados de carga visibles.
- Confirmaciones explÃ­citas para acciones sensibles.
- No permitir acciones inconsistentes.
- Mostrar en empleado confirmaciÃ³n de operaciÃ³n exitosa.
- Mostrar en admin resumen claro del perÃ­odo consultado.

---

## 9. Criterios no funcionales

- CÃ³digo mantenible y modular.
- Nada de secretos expuestos al cliente.
- SeparaciÃ³n clara entre cliente y servidor.
- Preparado para deploy en Vercel.
- Preparado para variables de entorno.
- Backend y consultas defensivas.
- Manejo de errores consistente.

---

## 10. Contrato de mÃ³dulos

Esta secciÃ³n es clave para que cada terminal pueda trabajar aislada sin romper el resto.

## 10.1 Auth
Responsabilidad:
- login
- logout
- lectura de sesiÃ³n
- protecciÃ³n de rutas
- helpers por rol

Debe exponer:
- `login(credentials)`
- `logout()`
- `getCurrentUser()`
- `requireAuth()`
- `requireRole('admin' | 'employee')`

## 10.2 Reports
Responsabilidad:
- abrir jornada
- cerrar jornada
- validar jornada abierta
- calcular minutos trabajados
- devolver reportes por perÃ­odo

Debe exponer:
- `createCheckInReport()`
- `closeCheckOutReport()`
- `getOpenReportByEmployee()`
- `getReportsByDateRange()`
- `getEmployeeReportsByDateRange()`

## 10.3 Excel
Responsabilidad:
- transformar reportes en archivo XLSX
- generar hoja detalle
- generar hoja resumen

Debe exponer:
- `buildMonthlyWorkbook(data)`
- `serializeWorkbookToBuffer(workbook)`

## 10.4 Salary
Responsabilidad:
- calcular horas vÃ¡lidas
- excluir reportes nulos
- calcular sueldo estimado

Debe exponer:
- `calculateWorkedHours()`
- `calculateEstimatedSalary()`
- `buildSalarySummary()`

## 10.5 Mail
Responsabilidad:
- enviar email con adjunto
- registrar auditorÃ­a del envÃ­o

Debe exponer:
- `sendMonthlyReportEmail()`

---

## 11. AsignaciÃ³n sugerida por terminales

La siguiente divisiÃ³n permite trabajo paralelo con mÃ­nimo acoplamiento.

# TERMINAL 1 â€” Base del proyecto y estructura comÃºn

## Alcance
- Inicializar proyecto Next.js App Router + TypeScript + Tailwind.
- Definir estructura de carpetas.
- Crear layout base.
- Crear navegaciÃ³n bÃ¡sica para login, panel y admin.
- Preparar middleware de protecciÃ³n.
- Preparar utilidades generales.

## Entregables
- Proyecto compilando.
- Layout global.
- Componentes UI base.
- README tÃ©cnico.
- `.env.example`.

## Dependencias
- Ninguna.

## Bloqueos para otros
- Debe dejar la estructura estable para que el resto se monte encima.

## Definition of Done
- `npm run build` sin errores.
- Rutas bÃ¡sicas creadas.
- Layout responsive funcionando.

## Prompt sugerido
```txt
Quiero que crees la base de una aplicaciÃ³n web llamada â€œREPORTE HORARIOâ€ con Next.js App Router, TypeScript y Tailwind. Debe incluir estructura profesional, layout global, navegaciÃ³n base, middleware inicial, componentes UI reutilizables y README tÃ©cnico. Debe quedar preparada para integrar Supabase, autenticaciÃ³n propia y rutas administrativas. No generes mocks frÃ¡giles. Quiero cÃ³digo mantenible, limpio y listo para producciÃ³n.
```

---

# TERMINAL 2 â€” Base de datos, migraciones y reglas SQL

## Alcance
- DiseÃ±ar tablas.
- Crear migraciones.
- Crear Ã­ndices.
- Crear restricciones.
- Crear seed inicial.
- Evaluar RLS/policies.
- Resolver la regla â€œuna sola jornada abierta por empleadoâ€.

## Entregables
- SQL de migraciones.
- Seed inicial.
- DocumentaciÃ³n de constraints.

## Dependencias
- Ninguna.

## Bloqueos para otros
- Auth y Reports dependen de nombres de tabla y columnas estables.

## Definition of Done
- Migraciones ejecutables en Supabase.
- Seed funcional.
- Regla de jornada abierta protegida a nivel DB o aplicaciÃ³n con apoyo de Ã­ndice/constraint.

## Prompt sugerido
```txt
Implementa la capa de base de datos para la app â€œREPORTE HORARIOâ€ usando Supabase Postgres. Necesito migraciones completas para employees, work_reports y report_mail_logs, con Ã­ndices, constraints, seed inicial, timestamps y reglas de consistencia. Debe contemplar que un empleado no pueda tener mÃ¡s de una jornada abierta y que se pueda calcular total_minutes al cerrar la jornada. Deja el SQL limpio, comentado y listo para aplicar.
```

---

# TERMINAL 3 â€” AutenticaciÃ³n y sesiones

## Alcance
- Pantalla login.
- Login backend.
- ValidaciÃ³n de credenciales.
- Cookies de sesiÃ³n seguras.
- ProtecciÃ³n de rutas.
- Helpers de auth.

## Entregables
- `/login`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- middleware o guardas por rol

## Dependencias
- Terminal 1: estructura base
- Terminal 2: tabla `employees`

## Definition of Done
- Un employee entra a `/panel`.
- Un admin entra a `/admin`.
- Rutas protegidas correctamente.
- Cookie httpOnly creada.

## Prompt sugerido
```txt
Implementa el mÃ³dulo de autenticaciÃ³n para la app â€œREPORTE HORARIOâ€. Debe haber login con ID de empleado y contraseÃ±a, validaciÃ³n contra la tabla employees, password hash con bcrypt, creaciÃ³n de sesiÃ³n segura con cookie httpOnly y redirecciÃ³n por rol a /panel o /admin. TambiÃ©n necesito logout, helpers de auth y protecciÃ³n de rutas. No expongas secretos ni lÃ³gica sensible al cliente.
```

---

# TERMINAL 4 â€” Flujo empleado: ingreso y egreso

## Alcance
- Pantalla `/panel`.
- Botones Ingreso y Egreso.
- GeolocalizaciÃ³n frontend.
- Flujo visual de check-in.
- Flujo visual de check-out.
- Validaciones.
- IntegraciÃ³n con backend.

## Entregables
- `/panel`
- `/panel/ingreso`
- `/panel/egreso`
- `POST /api/reports/check-in`
- `POST /api/reports/check-out`

## Dependencias
- Terminal 1: estructura base
- Terminal 2: tabla `work_reports`
- Terminal 3: sesiÃ³n y auth

## Definition of Done
- No puede marcar ingreso con jornada abierta.
- No puede marcar egreso sin jornada abierta.
- Puede cerrar con tareas.
- Puede confirmar reporte nulo si no escribe tareas.
- Se capturan timestamps y geolocalizaciÃ³n.

## Prompt sugerido
```txt
Implementa el flujo completo del empleado para la app â€œREPORTE HORARIOâ€. La pantalla /panel debe mostrar Ingreso y Egreso. Ingreso crea una jornada abierta con fecha/hora actual y geolocalizaciÃ³n. Egreso busca la jornada abierta, toma fecha/hora y geolocalizaciÃ³n, pide tareas realizadas y permite confirmar reporte nulo si el texto queda vacÃ­o. Necesito UI, route handlers, validaciones de frontend y backend, estados de carga y mensajes claros.
```

---

# TERMINAL 5 â€” Admin: reportes XLSX y mÃ³dulo Sueldos

## Alcance
- Panel admin.
- Pantalla de reportes por perÃ­odo.
- GeneraciÃ³n de XLSX.
- Pantalla de sueldos.
- Detalle por empleado.
- CÃ¡lculo de horas y sueldo estimado.

## Entregables
- `/admin`
- `/admin/reportes`
- `/admin/sueldos`
- `/admin/sueldos/[employeeId]`
- `POST/GET /api/admin/monthly-xlsx` o equivalente

## Dependencias
- Terminal 1: base UI
- Terminal 2: DB
- Terminal 3: auth admin
- Terminal 4: reportes cargados

## Definition of Done
- Exporta XLSX vÃ¡lido.
- Hoja detalle y hoja resumen correctas.
- Excluye reportes nulos del total trabajado.
- Calcula sueldo segÃºn valor hora.

## Prompt sugerido
```txt
Implementa el mÃ³dulo admin para la app â€œREPORTE HORARIOâ€. Necesito un flujo para generar reporte mensual en XLSX con hoja Detalle y hoja Resumen, ademÃ¡s de una secciÃ³n Sueldos que liste empleados con horas totales, valor hora, sueldo estimado y botÃ³n Ver detalle. El detalle debe mostrar jornadas del perÃ­odo, tareas, estado y total acumulado. Todo el procesamiento pesado debe hacerse server-side.
```

---

# TERMINAL 6 â€” EnvÃ­o por mail del reporte

## Alcance
- Formulario de envÃ­o admin.
- GeneraciÃ³n de adjunto XLSX.
- EnvÃ­o por email.
- Registro del envÃ­o en DB.

## Entregables
- pantalla o secciÃ³n de envÃ­o
- `POST /api/admin/send-report-email`
- helper de mail
- persistencia en `report_mail_logs`

## Dependencias
- Terminal 2: `report_mail_logs`
- Terminal 3: auth admin
- Terminal 5: generaciÃ³n de workbook o buffer adjunto

## Definition of Done
- El admin puede cargar destinatario manual.
- Se envÃ­a mail con archivo adjunto.
- Se registra auditorÃ­a del envÃ­o.

## Prompt sugerido
```txt
Implementa el envÃ­o por mail del reporte mensual para la app â€œREPORTE HORARIOâ€. Debe existir un formulario admin con desde, hasta, email destino, asunto y mensaje editable. Al enviar, se genera el XLSX del perÃ­odo, se adjunta al mail, se envÃ­a desde backend y se registra el envÃ­o en report_mail_logs. Quiero validaciÃ³n de email, manejo de errores y cÃ³digo listo para Vercel.
```

---

## 12. Dependencias cruzadas entre terminales

### Orden sugerido
1. Terminal 1 â€” estructura base
2. Terminal 2 â€” DB y migraciones
3. Terminal 3 â€” auth
4. Terminal 4 â€” empleado
5. Terminal 5 â€” admin y xlsx
6. Terminal 6 â€” mail

### Interfaces a respetar
Para reducir roces, todos deben respetar estos nombres salvo decisiÃ³n global:

#### Tabla empleados
- `employees`

#### Tabla reportes
- `work_reports`

#### Tabla logs mail
- `report_mail_logs`

#### Estados de reportes
- `open`
- `closed`
- `nullified`

#### Rutas esperadas
- `/login`
- `/panel`
- `/admin`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/reports/check-in`
- `/api/reports/check-out`
- `/api/admin/monthly-xlsx`
- `/api/admin/send-report-email`

---

## 13. Casos borde que deben contemplarse

### Login
- ID inexistente
- contraseÃ±a incorrecta
- usuario inactivo

### Ingreso
- ya existe jornada abierta
- geolocalizaciÃ³n denegada
- fallo de red

### Egreso
- no existe jornada abierta
- egreso antes del ingreso
- tareas vacÃ­as con confirmaciÃ³n nula
- fallo de red

### Admin reportes
- rango vacÃ­o
- rango invertido
- sin datos para el perÃ­odo

### Mail
- email invÃ¡lido
- falla al generar xlsx
- falla de proveedor de correo

---

## 14. Datos de prueba sugeridos

### Admin
- full_name: `Administrador General`
- employee_code: `ADM-001`
- role: `admin`

### Empleados
- `Juan PÃ©rez`
- `MarÃ­a GÃ³mez`
- `Luciano FernÃ¡ndez`
- IDs sugeridos:
  - `EMP-001`
  - `EMP-002`
  - `EMP-003`

Todos con:
- contraseÃ±a inicial basada en DNI para entorno de prueba
- `hourly_rate` distinto para validar mÃ³dulo sueldos

---

## 15. Variables de entorno esperadas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
SESSION_SECRET=
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
```

### Regla crÃ­tica
- `SUPABASE_SERVICE_ROLE_KEY` nunca debe usarse en cliente.
- Secretos sÃ³lo del lado server.

---

## 16. Recomendaciones de implementaciÃ³n

- Centralizar acceso a DB en `lib/db.ts`.
- Centralizar auth en `lib/auth.ts`.
- Centralizar cÃ¡lculo de sueldos en `lib/salary.ts`.
- No duplicar reglas de negocio en varios lugares sin necesidad.
- Backend siempre debe validar aunque frontend tambiÃ©n lo haga.
- GeneraciÃ³n XLSX y envÃ­o mail sÃ³lo en server.

Estado actual del mÃ³dulo admin:
- `lib/salary.ts` implementa `calculateWorkedHours()`, `calculateEstimatedSalary()` y `buildSalarySummary()`
- `lib/excel.ts` implementa `buildMonthlyWorkbook()` y `serializeWorkbookToBuffer()`
- `lib/reports.ts` suma helpers server-side para consultar empleados por rol y por id, sin romper las funciones existentes
- `/admin`, `/admin/reportes`, `/admin/sueldos` y `/admin/sueldos/[employeeId]` ya dejaron de ser placeholder
- `POST /api/admin/monthly-xlsx` ya genera y devuelve el XLSX real

---

## 17. Criterio de aceptaciÃ³n final del proyecto

El proyecto se considera funcional cuando se cumple todo esto:

1. Un empleado puede loguearse correctamente.
2. Un empleado puede marcar ingreso.
3. Un empleado puede marcar egreso con tareas.
4. Un empleado puede cerrar como reporte nulo si confirma sin tareas.
5. La app guarda ingreso, egreso, tareas y geolocalizaciÃ³n.
6. El admin puede consultar un perÃ­odo y generar un XLSX.
7. El admin puede ver horas trabajadas y sueldo estimado por empleado.
8. El admin puede ver detalle por empleado.
9. El admin puede enviar el reporte por mail con adjunto.
10. El sistema protege correctamente rutas por sesiÃ³n y rol.

---

## 18. Nota para cualquier terminal que tome una parte

Antes de tocar cÃ³digo:
- leer este documento completo
- respetar nombres de tablas, estados y rutas
- no cambiar decisiones globales sin avisar
- si falta una definiciÃ³n, extender sin romper compatibilidad
- priorizar cÃ³digo legible y mantenible sobre atajos

Este proyecto estÃ¡ pensado para construirse por partes, pero todas las partes deben converger en una sola aplicaciÃ³n coherente.

