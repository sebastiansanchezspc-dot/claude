# Renueva Automotriz 🚗

App de gestión para automotoras: stock de autos, ventas, comisiones, caja y gastos.

**Stack:** React + Vite + TailwindCSS · Supabase (PostgreSQL + Auth + RLS) · Deploy en Vercel.

Mobile-first (max 430px), dark mode, 10 temas de color intercambiables, tab bar inferior,
sheets desde abajo para formularios, toasts arriba al centro.

## 1. Requisitos

- Node.js 18+
- Una cuenta de [Supabase](https://supabase.com) (plan gratuito sirve)
- Una cuenta de [Vercel](https://vercel.com) para el deploy

## 2. Setup del proyecto Supabase

1. Crea un proyecto nuevo en https://app.supabase.com.
2. Ve a **Project Settings → API** y copia:
   - `Project URL` → será `VITE_SUPABASE_URL`
   - `anon public key` → será `VITE_SUPABASE_ANON_KEY`
3. Ve a **SQL Editor**, pega el contenido completo de
   [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql) y ejecútalo.
   Esto crea las 6 tablas (`profiles`, `vendedores`, `autos`, `ventas`, `gastos`, `temas`),
   activa Row Level Security, define las políticas por rol y el trigger que crea un `profile`
   automáticamente cuando alguien se registra en `auth.users` (con rol por defecto `vendedor`).
4. (Alternativa con CLI): si prefieres usar el CLI de Supabase:
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref TU_PROJECT_REF
   supabase db push
   ```

### Crear el primer usuario admin

1. En **Authentication → Users**, crea un usuario manualmente (email + password) o pide que
   alguien se registre desde la app (no hay pantalla de registro pública: usa "Invite" desde
   el dashboard de Supabase o el Auth API).
2. Se creará automáticamente su fila en `profiles` con `rol = 'vendedor'`.
3. En **Table Editor → profiles**, cambia manualmente su `rol` a `admin`.
4. Desde ahí, ese admin puede cambiar el rol de otros usuarios desde **Ajustes → Usuarios**
   dentro de la app.

> **Nota sobre invitar usuarios:** invitar por email (`auth.admin.inviteUserByEmail`) requiere
> el `service_role key`, que **nunca** debe exponerse en el frontend. La pantalla de Ajustes
> deja el botón listo, pero para que funcione en producción crea una
> [Edge Function de Supabase](https://supabase.com/docs/guides/functions) que reciba
> `{ email, nombre, rol }`, use el `service_role key` como variable de entorno del lado del
> servidor, llame a `supabase.auth.admin.inviteUserByEmail(...)` y actualice el `rol` en
> `profiles`. Mientras tanto, el camino más simple es crear los usuarios manualmente desde el
> dashboard de Supabase y ajustar su rol en `profiles`.

> **Nota sobre el vínculo vendedor ↔ usuario:** las políticas RLS de `ventas` para el rol
> `vendedor` matchean por `nombre` entre `profiles` y `vendedores`. Para producción real se
> recomienda agregar una columna `profile_id uuid` en `vendedores` y usarla en las políticas
> en vez del nombre, para evitar colisiones si dos vendedores comparten nombre.

## 3. Correr el proyecto en local

```bash
cd renueva-automotriz
npm install
cp .env.local.example .env.local
# Edita .env.local y pega tu VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

Abre http://localhost:5173 — inicia sesión con el usuario que creaste en Supabase.

Otros comandos:

```bash
npm run build     # build de producción a /dist
npm run preview   # sirve el build localmente
```

## 4. Deploy en Vercel

1. Sube este proyecto a un repositorio de GitHub/GitLab/Bitbucket.
2. En [vercel.com](https://vercel.com), **Add New → Project** e importa el repo.
3. Vercel detecta Vite automáticamente (`Framework Preset: Vite`). Si no, configura:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. En **Environment Variables**, agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. El archivo [`vercel.json`](vercel.json) ya incluye el rewrite necesario para que
   las rutas de React Router (`/stock`, `/ventas`, etc.) funcionen al recargar la página.
6. En cada push a la rama principal, Vercel vuelve a desplegar automáticamente.

## 5. Estructura del proyecto

```
src/
  lib/            supabase.js, themes.js, format.js
  hooks/          useAuth.jsx, useTheme.jsx
  components/
    ui/           Sheet, Toast, PBtn, FMoney, FSel, Pip, Empty, PagosBlock
    TabBar.jsx, Header.jsx
  pages/          Dashboard, Stock, Ventas, Caja, Equipo, Gastos, Ajustes, Login
  App.jsx         Router + protección de rutas por rol
supabase/
  migrations/001_schema.sql   tablas + RLS + triggers
```

## 6. Roles

| Rol       | Stock         | Ventas                  | Caja | Equipo | Gastos | Ajustes |
|-----------|---------------|--------------------------|------|--------|--------|---------|
| admin     | leer + editar | leer todas + editar      | ✅   | ✅     | ✅     | ✅      |
| vendedor  | leer          | leer/crear/editar propias| ❌   | ❌     | ❌     | tema propio |
| readonly  | solo leer     | solo leer                | ❌   | ❌     | ❌     | tema propio |

El tab bar inferior solo muestra las secciones a las que el rol tiene acceso. `Gastos` es
accesible desde el header de `Caja` (solo admin). `Ajustes` es accesible desde el ícono ⚙️
del header, para todos los roles (con la gestión de usuarios visible solo para admin).

## 7. Temas de color

10 temas intercambiables, guardados por usuario en la tabla `temas` (con fallback a
`localStorage` mientras carga la sesión): azul, grafito, dorado, esmeralda, volcán, lavanda,
magenta, cobre, hielo, carbón. Se eligen desde **Ajustes** con preview visual real de cada
paleta.

## 8. Formato de dinero

Todos los inputs de dinero (`FMoney`) muestran `$` + puntos de miles en tiempo real mientras
se escribe (formato `es-CL`), por ejemplo al escribir `12000000` se ve `$12.000.000`. Los
bloques de pagos múltiples (`PagosBlock`) validan que la suma de los pagos calce exacto con
el monto objetivo (costo de compra o precio de venta) antes de permitir guardar.
