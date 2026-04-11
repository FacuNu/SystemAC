# Cambio De Identificacion Por `employee_code`

Fecha de registro: 2026-04-10

## Objetivo

Se reemplazo la identificacion por nombre completo en login y documentacion por un identificador operativo estable: `employee_code`.

## Decision tomada

- El acceso ya no se realiza por nombre y apellido.
- El usuario se identifica con `employee_code`.
- `employee_code` debe ser unico.
- `employee_code` debe guardarse normalizado en mayusculas.
- `full_name` sigue existiendo como dato descriptivo, no como credencial.

## Cambios aplicados

### Base de datos

- En `employees` se reemplazo `login_name` por `employee_code`.
- Se agrego constraint de no vacio para `employee_code`.
- Se agrego constraint de normalizacion en mayusculas.
- Se agrego indice unico sobre `employee_code`.
- El seed inicial ahora usa:
  - `ADM-001`
  - `EMP-001`
  - `EMP-002`
  - `EMP-003`

### Auth y sesion

- `POST /api/auth/login` ahora recibe `employeeCode` y `password`.
- `lib/auth.ts` consulta `employees.employee_code`.
- El valor de ingreso se normaliza en mayusculas antes de buscar.
- El payload de sesion ahora usa `employeeCode`.
- La UI de `/login` pide "ID de empleado".

### Tipos y contratos

- Se actualizaron `contracts/auth.ts`, `contracts/shared.ts`.
- Se actualizaron `types/domain.ts`, `types/database.ts`.
- `SessionUser` ahora expone `employeeCode`.

### Documentacion actualizada

Se dejo alineado el cambio en:

- `documentacion.md`
- `handoff-paralelo.md`
- `db-reporte-horario.md`
- `auth-implementacion-tecnica.md`

## Impacto para siguientes fases

- Cualquier modulo que autentique o muestre datos de usuario debe usar `employee_code` como identificador operativo.
- No se debe volver a usar nombre completo como clave de login.
- Si una fase futura agrega alta/edicion de empleados, debe validar formato y unicidad de `employee_code`.

## Estado de validacion

- `npm run lint` OK
- `npm run build` OK
- `npm run typecheck` OK
