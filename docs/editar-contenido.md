# Cómo editar promociones, banners y textos del sitio

Todo se edita en el admin de Shopify, en **Contenido → Metaobjetos**. No hace falta tocar código ni publicar nada: el sitio toma los cambios solo en **5 minutos como máximo**.

## Vigencia

Cada promoción y banner tiene una **vigencia**:

- **Se renueva cada mes** (la normal): nunca se oculta. La leyenda "Vigente hasta el…" muestra sola el último día del mes en curso (31/10, 30/11, 31/12…). Cuando Samaco cambia las condiciones, se editan los datos y listo.
- **Termina en una fecha**: para promos especiales (Hot Sale, aniversario). Se completa la **Fecha de fin** y el sitio la oculta sola al día siguiente.
- **Mostrar desde**: para dejar cargadas las promos del mes que viene. No se ven hasta ese día. Para el cambio de mes: a las del mes actual se les pone "Termina en una fecha" con el último día, y las nuevas se cargan con "Mostrar desde" el día 1.

En los textos se puede escribir `{vigencia}` y el sitio pone la fecha que corresponde. Ejemplo: "Vigente hasta el {vigencia} o hasta agotar stock."

Para sacar algo del sitio sin borrarlo, destildá **Mostrar en el sitio**.

## Promoción de pago

Es cada tarjeta del carrusel "Medios de pago" de la home y cada bloque de `/financiacion`.

| Campo | Qué es |
|---|---|
| **Titular** | Lo grande. Ej: "Hasta 12 cuotas sin interés". |
| **Medios incluidos** | Ej: "Visa, Mastercard y Naranja Visa". |
| **Dónde aplica** | Online y en sucursales / Solo online / Solo en sucursales. |
| **Tarjetas / bancos (logos)** | Uno por línea. Los que tienen logo: BNA+, Banco Nación, Visa, Mastercard, Naranja X, Naranja X Visa, Cabal, Cencosud, Montemar, American Express, Transferencia bancaria, Tarjeta de débito, Tarjeta de crédito. |
| **Planes** | Las opciones con cuotas y descuento. Se usan en la tabla y en el simulador. Cada plan es un "Plan de cuotas" (ver abajo). |
| **Aclaraciones** | Letra chica. Una por línea. |
| **Color** | Acento de la tarjeta: Azul, Verde, Violeta, Naranja o Rojo. |
| **Orden** | El número más chico aparece primero. |

**Plan de cuotas**: texto ("6 cuotas sin interés"), tipo (Contado / Cuotas sin interés / Cuotas fijas), cantidad de cuotas y % de descuento (opcional).

> Para cambiar una promo del mes: abrir la promoción, cambiar el titular y los planes, y guardar.
> Para una promo nueva: "Agregar entrada" en *Promoción de pago*.

## Banner de la home

Es cada slide del banner grande de arriba de la home.

| Campo | Qué es |
|---|---|
| **Etiqueta** | El cartelito de arriba ("Todos los días", "15% OFF"). |
| **Título** | Con Enter se corta la línea. |
| **Texto** | Admite `{vigencia}`. |
| **Texto del botón** y **El botón lleva a** | Financiación, Sucursales, Calculadora, Círculo de Profesionales, Catálogo o Inicio. |
| **Imagen de fondo** | Horizontal, mínimo 1600 px de ancho. Si se deja vacía, el sitio usa una imagen por defecto. |
| **Color de la etiqueta** | Azul o Naranja. |
| **Orden** | El número más chico aparece primero. |

## Textos del sitio (una sola entrada)

| Campo | Qué es |
|---|---|
| **Promo destacada** | La tarjeta oscura del carrusel y la cabecera de `/financiacion`: titular, texto, logos, dónde aplica, vigencia y si se muestra. |
| **Cinta superior: mensajes** | Los mensajes que corren arriba de todo, uno por línea. Las promos, WhatsApp, sucursales y el Círculo se agregan solos. |
| **Leyenda legal de promociones** | El texto al pie de `/financiacion`. Admite `{vigencia}`. |

## Cambio de mes: procedimiento

**Si las condiciones no cambian, no hay que hacer nada.** Las promos con "Se renueva cada mes" siguen solas y la leyenda pasa al último día del mes nuevo.

Cuando Samaco manda una grilla nueva, hay tres caminos.

### A. Cambiar el día 1 (cambios chicos: un porcentaje, una tarjeta)

1. El día que empieza la promo nueva, entrar a **Contenido → Metaobjetos → Promoción de pago**.
2. Abrir la promo y cambiar lo necesario: titular, medios incluidos, tarjetas o aclaraciones.
3. Si cambian cuotas o descuentos, abrir sus **Planes** desde la misma promo y editarlos.
4. Guardar. En 5 minutos se ve en el sitio.
5. Revisar si algún **Banner de la home** menciona lo que cambió y actualizarlo.

### B. Dejarlo programado unos días antes (cambio de grilla completo)

1. **Cerrar el mes actual.** En cada promo y banner que cambia, poner **Vigencia: "Termina en una fecha"** y **Fecha de fin** = el último día del mes.
2. **Cargar el mes nuevo.** En cada promo, usar el menú **⋯ → Duplicar**. En la copia:
   - **Mostrar desde** = el día 1 del mes siguiente.
   - **Vigencia** = "Se renueva cada mes".
   - Cambiar titular, medios, tarjetas y aclaraciones.
   - ⚠️ La copia usa **los mismos planes** que la original: si los editás, también cambia la promo vieja. Si cambian cuotas o descuentos, sacá los planes de la copia y agregá planes nuevos con **"Agregar plan de cuotas"**.
3. **Promos que no existían:** **Agregar entrada**, con **Mostrar desde** = día 1.
4. **Banners:** lo mismo que con las promos (cerrar el viejo y duplicar con "Mostrar desde").
5. **Control:** antes del día 1 el sitio tiene que seguir mostrando el mes actual. El día 1 a la mañana, entrar a `/financiacion` y revisar.
6. **El mes siguiente:** las entradas vencidas ya no se ven. Se pueden borrar para que la lista quede limpia.

### C. Mandar la grilla a Pinta

Mandar la foto o el PDF de la grilla. Pinta la deja cargada y programada, y avisa las dudas que haya en la grilla (fechas, filas repetidas, canales).

**Checklist de cada grilla:** canal (presencial / web / ambos) · cuotas y % de descuento de cada plan · tarjetas incluidas (¿entró o salió alguna?) · mínimos de compra · fecha de vigencia · si cambió algo, los textos de los banners.

## Si algo sale mal

Si una sección queda vacía en Shopify, por ejemplo si se borran todas las promociones, o si Shopify no responde, el sitio muestra el contenido de respaldo que está en el código. Nunca queda una sección rota.

La estructura (los campos) se crea con `node scripts/contenido-setup.mjs`. Ese script no pisa nada que ya esté cargado.
