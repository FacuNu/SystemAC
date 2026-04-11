# Implementacion tecnica del modulo de autenticacion

## Resumen

Se completo el modulo de autenticacion de `REPORTE HORARIO` sobre la base existente del repo, respetando los contratos y helpers definidos en `documentacion.md` y `handoff-paralelo.md`.

El alcance implementado cubre:

- `/login`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `lib/auth.ts`
- `lib/session.ts`
- `middleware.ts`
- proteccion por sesion y rol para `/panel` y `/admin`

## Objetivo tecnico alcanzado

La autenticacion ahora:

- valida credenciales contra la tabla `employees`
- compara `password_hash` con bcrypt usando `bcryptjs`
- crea una sesion server-side serializada en cookie `httpOnly`
- usa la cookie `rh_session`
- redirige por rol a `/panel` o `/admin`
- evita exponer secretos o logica sensible al cliente
- mantiene el contrato JSON base de exito y error del handoff

## Arquitectura implementada

### 1. Capa de auth

Archivo principal: `lib/auth.ts`

Se implementaron los helpers requeridos:

- `login(credentials)`
- `logout()`
- `getCurrentUser()`
- `requireAuth()`
- `requireRole()`

#### `login(credentials)`

Responsabilidades:

- validar el body con `loginRequestSchema`
- consultar `employees` por `employee_code`
- exigir que el usuario exista y este activo
- comparar la contraseña ingresada con `password_hash`
- construir el `SessionUser`
- definir `redirectTo` segun rol
- generar el token de sesion firmado

Resultado:

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

#### `logout()`

Se dejo como helper simple de cierre semantico. La invalidacion efectiva de la sesion ocurre al limpiar la cookie en el route handler.

#### `getCurrentUser()`

Lee la cookie actual desde server, verifica firma y expiracion, y devuelve `SessionUser | null`.

#### `requireAuth()` y `requireRole()`

Estas funciones centralizan la proteccion server-side:

- `requireAuth()` falla si no hay sesion valida
- `requireRole(role)` falla si el rol no coincide

Ambas lanzan `ApiError` con `status` y `code`, para que las rutas y layouts resuelvan redirect o respuesta JSON consistente.

### 2. Capa de sesion

Archivo principal: `lib/session.ts`

Se implemento una sesion stateless firmada con HMAC SHA-256 usando Web Crypto. No se agrego una tabla de sesiones, por lo que la sesion queda contenida en la cookie firmada.

#### Payload de sesion

La cookie contiene un payload serializado con:

- `id`
- `fullName`
- `employeeCode`
- `role`
- `iat`
- `exp`
- `v`

El payload se codifica en base64url y luego se firma. El token final queda en formato:

```txt
base64url(payload).firma
```

#### Seguridad aplicada

La cookie `rh_session` se configura con:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` en produccion
- `path: "/"`
- `maxAge` de 12 horas

Esto evita acceso desde JavaScript cliente y reduce superficie de exposicion.

#### Verificacion

La verificacion de sesion controla:

- formato del token
- firma HMAC valida
- version del payload
- expiracion

Si cualquiera de esos puntos falla, la sesion se considera invalida y se trata como ausente.

### 3. Route handlers

#### `POST /api/auth/login`

Archivo: `app/api/auth/login/route.ts`

Flujo:

1. parsea el request JSON con `loginRequestSchema`
2. llama a `login()`
3. arma la respuesta JSON compatible con `contracts/auth.ts`
4. adjunta la cookie `rh_session` al `NextResponse`

#### `POST /api/auth/logout`

Archivo: `app/api/auth/logout/route.ts`

Flujo:

1. llama a `logout()`
2. limpia la cookie `rh_session`
3. responde:

```json
{
  "ok": true,
  "message": "Sesion cerrada."
}
```

### 4. Contrato de errores

Archivo: `lib/api.ts`

Se incorporo una capa comun de errores con `ApiError` y `buildErrorResponse()` para que auth y futuros modulos respondan con el formato del handoff:

```json
{
  "ok": false,
  "message": "Descripcion clara del error.",
  "code": "ERROR_CODE"
}
```

Casos manejados:

- errores de validacion Zod -> `400`
- errores de auth/negocio -> status definido por `ApiError`
- errores inesperados -> `500`

## Proteccion de rutas

### Middleware

Archivo: `middleware.ts`

Se reemplazo el placeholder por una validacion real de sesion.

Reglas aplicadas:

- si un usuario autenticado entra a `/login`, se lo redirige segun rol
- si se accede a `/panel/*` sin sesion, se redirige a `/login`
- si un `admin` intenta entrar a `/panel/*`, se redirige a `/admin`
- si se accede a `/admin/*` sin sesion, se redirige a `/login`
- si un `employee` intenta entrar a `/admin/*`, se redirige a `/panel`

### Proteccion adicional en layouts

Archivos:

- `app/panel/layout.tsx`
- `app/admin/layout.tsx`

Ademas del middleware, se agrego proteccion server-side en layouts para evitar depender solo del edge layer. Esto asegura que el render del arbol de rutas protegido tambien exija sesion y rol correcto.

## Implementacion de `/login`

Archivos:

- `app/login/page.tsx`
- `app/login/login-form.tsx`

Cambios realizados:

- se reemplazo el placeholder por formulario funcional
- el submit usa `fetch("/api/auth/login")`
- se muestran errores inline
- se maneja estado de carga
- no se guarda nada en `localStorage` ni en cliente
- si ya existe sesion valida, la pagina redirige desde server antes de renderizar

## Dependencias agregadas

Se agrego:

- `bcryptjs`

Motivo:

- el proyecto necesitaba validar `password_hash` real sin introducir una implementacion insegura o mock fragile

## Compatibilidad con contratos existentes

Se mantuvo sin cambios:

- nombre de cookie: `rh_session`
- rutas base
- nombres de helpers de auth
- shape base de `POST /api/auth/login`
- shape base de `POST /api/auth/logout`

No fue necesario modificar `contracts/*` ni `types/*` publicos para cumplir esta fase.

## Decisiones tecnicas relevantes

### Por que sesion stateless en cookie firmada

Se eligio una cookie firmada en vez de una tabla de sesiones porque:

- el handoff permitia JWT firmado o session token
- el alcance no exigia persistencia de sesiones en DB
- simplifica el modulo y evita ampliar schema
- funciona bien con middleware y layouts server-side

### Por que no se expone la sesion al cliente

La cookie es `httpOnly`, por lo que:

- el cliente no puede leer ni modificar el token
- no se depende de `localStorage`
- no se exponen secretos ni estructura sensible al frontend

### Por que se protegieron tambien los layouts

El middleware corta el acceso temprano, pero los layouts:

- refuerzan la seguridad del lado server
- aseguran que el render de paginas protegidas valide auth
- dejan un patron reutilizable para futuros modulos API o pages server-side

## Limitaciones y supuestos actuales

La implementacion asume:

- `employees.password_hash` contiene hashes bcrypt validos
- existe `SESSION_SECRET` en entorno
- existe `SUPABASE_SERVICE_ROLE_KEY` en entorno
- la tabla `employees` ya esta disponible segun la migracion actual

No se implemento:

- revocacion de sesiones en DB
- rotacion de sesiones
- cambio de contraseña
- recovery de acceso

Eso no formaba parte del alcance pedido.

## Verificacion realizada

Se valido:

- `npm run typecheck`
- `npm run build`

Ambos comandos finalizaron correctamente despues de la implementacion.

## Archivos tocados

- `lib/auth.ts`
- `lib/session.ts`
- `lib/api.ts`
- `middleware.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/login/page.tsx`
- `app/login/login-form.tsx`
- `app/panel/layout.tsx`
- `app/admin/layout.tsx`
- `package.json`
- `package-lock.json`
