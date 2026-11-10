# Sistema de diseño · Gestix / Renueva

Rige **toda** la aplicación: las pantallas internas (panel, stock, ventas, caja, equipo, fichas,
ajustes) y lo que ve el cliente final (catálogo público, ficha del auto, "Cotizar mi auto").

Referencias: `design-systems/awesome-design-md/apple/DESIGN.md` (material, tipografía, cápsulas) y
`.../tesla/DESIGN.md` (foto primero, un solo color de acción), adaptadas a la marca.

Archivos: `src/glass.css` (capa de vidrio de la app, sobre `src/styles.css`) y `src/catalogo.css`.

## 1. Idea central

**Vidrio sobre luz.** La interfaz es un material translúcido, al estilo de Apple, flotando sobre un
fondo oscuro con luz ambiental del color de la marca. Lo que importa (la foto del auto, la cifra
del mes) va grande y limpio; todo lo demás es vidrio que se aparta.

Tres capas, siempre en este orden:

1. **Fondo:** casi negro, con dos o tres luces suaves (el color de acción arriba a la derecha, una
   luz fría a la izquierda). Es fijo: no se mueve ni se anima.
2. **Vidrio:** tarjetas, paneles y controles con relleno translúcido y un filo de luz arriba.
3. **Contenido:** texto, cifras, fotos y el color de acción.

## 2. El material

| Uso | Receta |
|---|---|
| Tarjeta / panel (dentro del scroll) | `linear-gradient(180deg, rgba(255,255,255,.085), rgba(255,255,255,.035))`, borde `rgba(255,255,255,.09)`, filo `inset 0 1px 0 rgba(255,255,255,.13)`. **Sin** `backdrop-filter`. |
| Barra inferior, cabecera, avisos | Relleno translúcido oscuro + `backdrop-filter: blur(26px) saturate(1.8)` + filo de luz. |
| Botones redondos y chips sobre fotos | `rgba(255,255,255,.10)` (o grafito al 45–55 % sobre fotos) + `blur(14–20px)`. |
| Hojas y formularios | Opacas por defecto; translúcidas con `blur(34px)` solo en iOS y en computador. |

Regla de rendimiento: **el desenfoque real va solo en lo fijo y chico.** Las tarjetas de una lista
simulan el vidrio con transparencia y filo de luz, sin desenfoque, para que el scroll corra fluido
en celulares de gama media. Con "reducir transparencia" todo pasa a superficies opacas.

## 3. Color

| Rol | Token | Valor |
|---|---|---|
| Fondo | `--bg` | `#08090B` (tema Grafito) |
| Luz ambiental fría | `--amb` | `#3D7BFF` |
| Vidrio 1 / 2 / 3 | `--s1` `--s2` `--s3` | blanco al 5,5 % / 9 % / 15 % |
| Superficie opaca (hojas) | `--op1` | `#15171B` |
| Texto | `--fg` / `--ink` | `#F5F5F7` |
| Texto secundario | `--fg2` / `--soft` | `#B9BAC0` |
| Texto terciario | `--fg3` / `--faint` | `#84868E` |
| Líneas | `--line` / `--line2` | blanco al 9 % / 16 % |
| Acción | `--accent` / `--acc` | el color del mundo o de la empresa |

**Un solo color de acción por pantalla.** Va en el botón principal, el estado activo, las cifras
positivas destacadas y el foco. Los botones de acción llevan un degradado mínimo de arriba abajo
(el color aclarado un 16 % → el color) y un filo de luz: es lo que los hace verse "de vidrio".

Colores de acción disponibles (Ajustes → Color de tu mundo), afinados para fondo oscuro:
Lima `#C8F03C` · Menta `#34E0A1` · Cielo `#5AC8FA` · Azul `#4C9BFF` · Lavanda `#B7A6FF` ·
Rosa `#FF7EB6` · Coral `#FF8A6B` · Ámbar `#FFC93C`.

Temas de fondo (Ajustes → Fondo de la app; se guarda en el equipo):

| Tema | Fondo | Luz fría | Para quién |
|---|---|---|---|
| Grafito (por defecto) | `#08090B` | azul `#3D7BFF` | neutro, combina con cualquier color |
| Medianoche | `#060A14` | azul `#4C7DFF` | más frío y profundo |
| Bosque | `#06100D` | verde `#1FBF8F` | cálido, va bien con lima y menta |
| Negro puro | `#000000` | gris `#8E8E93` | pantallas OLED, máximo contraste |

Los colores de estado (verde bien, ámbar atención, rojo problema) se usan solo dentro de la app
para datos del negocio; el catálogo público no usa colores de estado.

## 4. Tipografía

La del sistema: **San Francisco en iPhone y Mac** (`-apple-system`), con Instrument Sans como
respaldo en Android y Windows. Sin fuentes condensadas, sin mayúsculas forzadas ni letras espaciadas
en títulos y etiquetas. La patente y los códigos siguen en monoespaciada: son la pieza insignia.

| Rol | Tamaño | Peso |
|---|---|---|
| Título grande de pantalla | 32 px | 700, espaciado −0,022 em |
| Cifra principal | 38–50 px | 700 |
| Título de portada (catálogo) | 30–40 px | 600 |
| Nombre de ítem, precio | 17 px | 600 |
| Texto y botones | 15–16 px | 400 / 600 |
| Etiquetas | 12 px | 500, color terciario |

## 5. Forma

- **Cápsulas** (radio completo) en botones, chips, selectores y la barra inferior.
- Radio **22–28 px** en tarjetas, paneles y fotos; **14–16 px** en campos y miniaturas.
- Objetivos táctiles de 44 px como mínimo. Márgenes laterales iguales.

## 6. Componentes

- **Barra inferior:** cápsula de vidrio flotante; la pestaña activa es una cápsula de vidrio más
  clara con el ícono en el color de acción.
- **Cabecera:** vidrio esmerilado; botones redondos de vidrio.
- **Tarjeta principal (cifra del mes):** vidrio con la luz del color de acción en una esquina.
- **Botón principal:** cápsula en el color de acción con filo de luz. Uno por pantalla.
- **Botón secundario:** cápsula de vidrio.
- **Catálogo público:** portada con la foto a sangre, tarjetas de auto sin marco (foto, nombre,
  datos, precio), ficha a pantalla completa, hojas de vidrio.

## 7. Movimiento

- Entradas con `cubic-bezier(.16,1,.3,1)`; cambios de estado en 0,2–0,35 s.
- La portada del catálogo entra una sola vez; las pantallas entran desde la derecha y las hojas
  suben desde abajo; al tocar, los elementos ceden (0,97).
- Esqueletos con barrido mientras cargan las fotos.
- Solo se animan `transform` y `opacity`. Nada aparece "al hacer scroll".
- Con "reducir movimiento" no hay animaciones y nada queda oculto.

## 8. Qué no hacer

- No poner `backdrop-filter` en tarjetas de listas ni en elementos que se repiten muchas veces.
- No usar superficies opacas grises donde corresponde vidrio, ni vidrio sin filo de luz.
- No usar un segundo color de acción en la misma pantalla.
- No animar el fondo ni las luces ambientales.
- No usar mayúsculas forzadas, fuentes condensadas ni botones de esquinas rectas.
