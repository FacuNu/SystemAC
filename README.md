# REPORTE HORARIO

Base del proyecto de REPORTE HORARIO, construida con Next.js App Router, TypeScript y Tailwind CSS.

## Stack

- Next.js App Router
- TypeScript estricto
- Tailwind CSS
- Supabase client listo para integrar
- Contratos compartidos con Zod

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicaciÃ³n quedarÃ¡ disponible en `http://localhost:3000`.

## Scripts

- `npm run dev`: desarrollo local
- `npm run build`: build de producciÃ³n
- `npm run start`: servir build
- `npm run lint`: validaciÃ³n ESLint
- `npm run typecheck`: chequeo TypeScript

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```env
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_URL=
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

## Estructura

```text
app/
  admin/
  api/
  login/
  panel/
components/
  layout/
  ui/
contracts/
lib/
supabase/
  migrations/
types/
```

## Estado actual

- Layout global responsive con navegaciÃ³n base.
- Auth, rutas protegidas y flujo empleado implementados.
- MÃ³dulo admin implementado:
  - `/admin`
  - `/admin/reportes`
  - `/admin/sueldos`
  - `/admin/sueldos/[employeeId]`
  - `POST /api/admin/monthly-xlsx`
- ExportaciÃ³n XLSX con hojas `Detalle` y `Resumen`.
- CÃ¡lculo salarial server-side excluyendo reportes nulos.
- Tipos de dominio y contratos compartidos con Zod.
- Modelo de datos inicial en SQL para Supabase.

## Pendiente

- `POST /api/admin/send-report-email` y el flujo de correo administrativo.
- Ajustes de seed y datos productivos.
- Pruebas de integraciÃ³n sobre entorno con Supabase real.
