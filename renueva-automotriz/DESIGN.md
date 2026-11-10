# Sistema de diseño · Renueva (catálogo público)

Basado en `design-systems/awesome-design-md/tesla/DESIGN.md` y adaptado a la marca Renueva.
Rige las pantallas que ve el cliente final: inicio, catálogo, ficha del auto y "Cotizar mi auto"
(`catalogo.html`, `src/catalogo.js`, `src/catalogo.css`).

## 1. Idea central

Una sala de ventas digital: **la foto del auto es el diseño** y la interfaz casi desaparece.
De Tesla se toma la resta radical (sin sombras, sin degradados decorativos, sin bordes en las
tarjetas, un solo color de acción, tipografía contenida, transiciones de 0,33 s).
De Renueva se toma la identidad: **grafito + lima**, el logo de la empresa y la cercanía de un
vendedor con nombre y WhatsApp.

Diferencias deliberadas con Tesla:

| Tesla | Renueva | Por qué |
|---|---|---|
| Lienzo blanco | Lienzo grafito `#0D0E10` | Es el sello de la app y de la marca; las fotos de patio resaltan más sobre oscuro |
| Azul eléctrico `#3E6AE1` | Lima `#C8F03C` (o el color que la empresa elija) | Color de marca; sigue siendo el único color cromático |
| Universal Sans | Instrument Sans 400 / 500 | Fuente de la app; una sola familia, dos pesos |
| Sin velo sobre las fotos | Un velo plano en la portada | Las fotos de los clientes son impredecibles; el texto debe leerse siempre |
| Sin movimiento de transformación | Zoom 1,03 de la foto y presión 0,98 al tocar | La tarjeta debe responder al dedo y al cursor |

## 2. Color

| Rol | Token | Valor |
|---|---|---|
| Lienzo | `--bg` | `#0D0E10` |
| Superficie (paneles, campos) | `--s1` | `#15171A` |
| Superficie elevada (hover, carga) | `--s2` | `#1C1F23` |
| Texto principal | `--ink` | `#F5F2EB` |
| Texto secundario | `--soft` | `#B4B1A9` |
| Texto terciario, placeholders | `--faint` | `#85837D` |
| Líneas divisorias | `--line` | `rgba(255,255,255,.10)` |
| Borde de campos | `--line2` | `rgba(255,255,255,.18)` |
| Acción (único color) | `--acc` | `#C8F03C` por defecto; lo reemplaza el color de la empresa |
| Texto sobre acción | `--acc-ink` | `#141900` (o blanco si el color es oscuro) |

Reglas:
- **Un solo color cromático.** El lima se usa solo en acciones primarias, estados activos y el
  foco del teclado. WhatsApp también va en el color de marca, con su ícono; no se usa verde aparte.
- Sin degradados, brillos ni manchas de color. El único velo permitido es el de la portada.
- Sin sombras. La profundidad sale de las fotos, del velo de las capas y del vidrio esmerilado
  de la cabecera (`rgba(13,14,16,.78)` + desenfoque).
- Sin colores semánticos: "Reservado" y "Próximamente" son etiquetas neutras.

## 3. Tipografía

Una familia: **Instrument Sans**. Dos pesos: 400 (texto) y 500 (títulos, botones, precios).
Sin mayúsculas forzadas, sin espaciado de letras, sin cursivas, sin fuentes monoespaciadas.

| Rol | Tamaño | Peso |
|---|---|---|
| Título de portada | 40 px (30 px en celular) | 500 |
| Título de ficha | 32 px (26 px en celular) | 500 |
| Título de sección | 24 px (22 px en celular) | 500 |
| Precio en ficha | 26 px | 500 |
| Nombre del auto en tarjeta, precio en tarjeta | 17 px | 500 |
| Texto, botones, etiquetas | 14–15 px | 400 / 500 |
| Campos de formulario | 16 px (evita el zoom de iOS) | 400 |

## 4. Forma y espacio

- Radios: **4 px** en botones, campos, chips y etiquetas; **12 px** en fotos y paneles; círculo
  solo en avatar y puntos.
- Base de 8 px. Márgenes laterales iguales: 20 px en celular, 32 px en tablet, 48 px en escritorio;
  ancho máximo 1320 px.
- Objetivos táctiles de 44 px como mínimo.
- Tarjetas sin borde ni fondo: foto arriba, texto abajo, separadas por aire.

## 5. Componentes

- **Botón primario:** fondo `--acc`, 48 px de alto, radio 4, peso 500. Máximo dos botones por pantalla.
- **Botón secundario:** fondo `--ink` sobre fotos; `--s2` sobre el lienzo.
- **Cabecera:** transparente sobre la portada; vidrio esmerilado al bajar. Logo + nombre a la
  izquierda, favoritos y compartir a la derecha.
- **Portada (inicio):** alto de pantalla completo con la foto del auto más reciente a sangre.
  Título y una línea de datos arriba; par de botones abajo ("Ver los autos", "Cotizar mi auto").
  Sin foto disponible, la portada es solo tipografía sobre grafito.
- **Tarjeta de auto:** foto 4:3 con radio 12; nombre, línea de datos (año · km · transmisión),
  precio y cuota. Corazón de favoritos sobre la foto.
- **Ficha:** pantalla completa. Galería grande a la izquierda (arriba en celular), datos a la
  derecha en filas con líneas finas, simulador de cuota, contacto. Barra fija de contacto en celular.
- **Hojas (filtros, favoritos, formularios):** hoja inferior en celular, panel lateral derecho en
  escritorio.
- **Cotizar mi auto:** etiquetas visibles sobre cada campo, fotos en mosaico, un solo botón.

## 6. Movimiento

- Tiempo universal: **0,33 s** con `cubic-bezier(.5,0,0,.75)`; entradas largas (portada, capas)
  con `cubic-bezier(.16,1,.3,1)`.
- **Portada:** entra una sola vez al cargar: la foto aclara y se asienta (escala 1,06 → 1) y el
  texto sube en tres tiempos.
- **Entre pantallas:** la ficha entra desde la derecha en celular y con un fundido en escritorio;
  las hojas suben desde abajo (celular) o entran por la derecha (escritorio).
- **Tarjetas:** con cursor, la foto hace zoom 1,03 dentro de su marco; al tocar, la tarjeta cede a 0,98.
- **Carga:** esqueletos con un barrido suave hasta que llega cada foto; la foto aparece con un fundido.
- Solo se animan `transform` y `opacity` (nada que recalcule el diseño), para que corra fluido en
  celulares de gama media.
- **Nada aparece "al hacer scroll"**: las tarjetas no se desvanecen ni suben al bajar la página.
- Con "reducir movimiento" activado no hay animaciones ni transiciones y nada queda oculto.

## 7. Qué no hacer

- No agregar sombras, degradados, manchas de color ni bordes a las tarjetas.
- No usar un segundo color cromático (ni verde WhatsApp, ni ámbar de aviso).
- No usar mayúsculas forzadas, texto en negrita 700+ ni títulos sobre 40 px.
- No poner el precio como etiqueta de color sobre la foto.
- No usar carruseles automáticos, parallax ni animaciones ligadas al scroll.
- No usar botones tipo píldora ni radios grandes.
