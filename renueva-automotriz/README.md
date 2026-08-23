# Renueva Automotriz 🚗

App de gestión de ventas multi-rubro: stock, ventas, comisiones, caja y gastos.
Soporta 3 rubros activables independientemente: **Automotriz** 🚗, **Inmobiliaria** 🏠 y
**Retail general** 🛍️. Cada rubro tiene sus propios campos (ej: patente en Automotriz,
dirección en Inmobiliaria, SKU/talla en Retail) y Retail además maneja **stock por
cantidad** (múltiples unidades por producto), mientras Automotriz e Inmobiliaria manejan
**ítem único** (1 auto o 1 propiedad = 1 venta).

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
3. Ve a **SQL Editor**, pega y ejecuta en orden:
   1. [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql) — crea las
      6 tablas base (`profiles`, `vendedores`, `autos`, `ventas`, `gastos`, `temas`), activa
      Row Level Security, define las políticas por rol y el trigger que crea un `profile`
      automáticamente cuando alguien se registra en `auth.users` (rol por defecto `vendedor`).
   2. [`supabase/migrations/002_multirubro.sql`](supabase/migrations/002_multirubro.sql) —
      generaliza `autos` a una tabla `items` multi-rubro (con `rubro`, `atributos jsonb`,
      `sku`, `stock_cantidad`) y crea `negocio_config` (qué rubros están activos). Si es un
      proyecto nuevo, igual ejecuta ambos en orden: 001 primero, 002 después.
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
  lib/            supabase.js, themes.js, format.js, rubros.js
  hooks/          useAuth.jsx, useTheme.jsx, useNegocio.jsx
  components/
    ui/           Sheet, Toast, PBtn, FMoney, FSel, Pip, Empty, PagosBlock
    TabBar.jsx, Header.jsx
  pages/          Dashboard, Stock, Ventas, Caja, Equipo, Gastos, Ajustes, Login
  App.jsx         Router + protección de rutas por rol
supabase/
  migrations/001_schema.sql       tablas base + RLS + triggers
  migrations/002_multirubro.sql   autos -> items multi-rubro + negocio_config
```

## 6. Rubros (verticales de negocio)

Los rubros activos se eligen en **Ajustes → Rubros activos** (solo admin) y se guardan en
`negocio_config.rubros_activos`. Cuando hay más de un rubro activo, Stock muestra pestañas
para filtrar y el formulario de ingreso pide primero elegir el rubro del ítem.

| Rubro | Ítem se llama | Código | Campos propios | Modo de stock |
|---|---|---|---|---|
| 🚗 Automotriz | Auto | Patente | Marca, modelo, año, km, color, tipo | Ítem único (1 auto = 1 venta) |
| 🏠 Inmobiliaria | Propiedad | Rol de avalúo | Operación (venta/arriendo), tipo, dirección, comuna, m², dormitorios, baños | Ítem único |
| 🛍️ Retail general | Producto | SKU | Marca, categoría, talla/variante | Por cantidad (stock se descuenta en cada venta) |

La definición de campos por rubro vive en [`src/lib/rubros.js`](src/lib/rubros.js) — para
agregar un rubro nuevo (ej. Maquinaria, Náutica) solo hay que agregar una entrada ahí con su
lista de `campos`, sin tocar el esquema de base de datos (los campos propios del rubro se
guardan en la columna `atributos jsonb` de `items`).

**Cómo funciona el costo unitario:** al ingresar un ítem de Retail con cantidad > 1, el costo
total ingresado se divide en `costo_unitario = costo / cantidad`. Cada venta descuenta la
cantidad vendida del `stock_cantidad` y calcula su ganancia usando ese costo unitario. En
Automotriz/Inmobiliaria la cantidad siempre es 1, así que `costo_unitario = costo`.

## 7. Roles

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
