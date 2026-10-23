# Cómo editar promociones, banners y textos del sitio

Todo se edita en el admin de Shopify, en **Contenido → Metaobjetos**. No hace falta tocar código ni publicar nada: el sitio toma los cambios solo en **5 minutos como máximo**.

## Vigencia

Cada promoción y banner tiene una **vigencia**:

- **Se renueva cada mes** (la normal): nunca se oculta. La leyenda "Vigente hasta el…" muestra sola el último día del mes en curso (31/10, 30/11, 31/12…). Cuando Samaco cambia las condiciones, se editan los datos y listo.
- **Termina en una fecha**: para promos especiales (Hot Sale, aniversario). Se completa la **Fecha de fin** y el sitio la oculta sola al día siguiente.

En los textos se puede escribir `{vigencia}` y el sitio pone la fecha que corresponde. Ejemplo: "Vigente hasta el {vigencia} o hasta agotar stock."

Para sacar algo del sitio sin borrarlo, destildá **Mostrar en el sitio**.

## Promoción de pago

Es cada tarjeta del carrusel "Medios de pago" de la home y cada bloque de `/financiacion`.

| Campo | Qué es |
|---|---|
| **Titular** | Lo grande. Ej: "Hasta 12 cuotas sin interés". |
| **Medios incluidos** | Ej: "Visa, Mastercard y Naranja Visa". |
| **Dónde aplica** | Online y en sucursales / Solo online / Solo en sucursales. |
| **Tarjetas / bancos (logos)** | Uno por línea. Los que tienen logo: BNA+, Visa, Mastercard, Naranja X, Naranja X Visa, Cabal, Cencosud, Montemar, American Express, Transferencia bancaria, Tarjeta de débito, Tarjeta de crédito. |
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

## Si algo sale mal

Si una sección queda vacía en Shopify, por ejemplo si se borran todas las promociones, o si Shopify no responde, el sitio muestra el contenido de respaldo que está en el código. Nunca queda una sección rota.

La estructura (los campos) se crea con `node scripts/contenido-setup.mjs`. Ese script no pisa nada que ya esté cargado.
