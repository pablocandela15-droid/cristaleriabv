# Cristalería Baix Vinalopó · web

Web corporativa con calculadora de presupuestos, solicitud de presupuesto, reserva de visita técnica y asistente virtual. Los textos, fotos de los trabajos (por tipo), precios y opciones de la calculadora se editan desde el **panel de administración** (repo [`admin-cristaleriabv`](https://admin-cristaleriabv.vercel.app)); `/admin` redirige allí.

- **Diseño:** estructura de la plantilla Formis (fondo crema, tipografía Cabinet Grotesk + Instrument Sans + Fraunces) con los colores del logo (marino `#0A2A48` y crema `#F2E8C8`) y un estilo *Liquid Glass* recomendado por UI UX Pro Max. Sistema de diseño en [`design-system/MASTER.md`](design-system/MASTER.md).
- **Tecnología:** Next.js 16 (App Router, Cache Components), Tailwind CSS 4, shadcn/ui (Base UI), Motion. Contenido editable en Supabase (el del panel; la web solo lee con la clave pública). Alojamiento en Vercel.

## Arrancar en local

```bash
npm install
cp .env.example .env.local   # opcional: sin Supabase usa los valores del código
npm run dev                  # http://localhost:3000
```

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run lint` / `npm run typecheck` | ESLint y TypeScript |
| `npm run knowledge` | Regenera el conocimiento del asistente (`supabase/functions/_shared/knowledge.ts`) |

## Dónde se cambia cada cosa

Con Supabase configurado, lo editable desde el panel se mezcla **por encima** de los valores del código, que quedan como valores por defecto (y son lo que se ve sin Supabase o si una tabla aún no existe). Los cambios del panel se ven en la web en ~1 minuto.

| Qué | Desde el panel (Supabase) | Valor por defecto en el código |
| --- | --- | --- |
| Teléfonos, WhatsApp, email, dirección, horario, eslogan | `web_contenido` → `negocio` | `src/content/site.ts` |
| Servicios (textos y SEO) | `web_contenido` → `servicios` | `src/content/services.ts` |
| Preguntas frecuentes (también las del asistente) | `web_contenido` → `faq` | `src/content/faq.ts` |
| Fotos de portada, «Quiénes somos» y contacto | `web_contenido` → `imagenes` (fotos del bucket `web-fotos`) | `public/images/credits.json` |
| Fotos de los trabajos, por tipo (/trabajos y galería de cada servicio) | `web_albumes` + `web_fotos` | `src/content/works.ts` |
| Trabajos de la portada («Espacios que se llenan de luz») | `web_fotos` con `destacada` (o la primera de cada tipo) | `featuredWorks` en `src/content/works.ts` |
| Tarifas de la calculadora | `web_tarifas.config` | `src/lib/pricing/config.ts` |
| Textos, opciones («formas»…), campos y categorías visibles de la calculadora | `web_tarifas.catalogo` | `src/lib/pricing/categories.ts` |
| Proceso de trabajo | — | `src/content/process.ts` |
| Equipo | — | `src/content/team.ts` |
| Desplazamiento (10 €/10 km, gratis en Crevillente) y poblaciones | — | `src/lib/travel.ts` |
| Textos legales | — (los datos del negocio sí salen del panel) | `src/app/(site)/aviso-legal`, `privacidad`, `cookies` |

`src/lib/pricing/{config,categories,tarifas}.ts` se comparten **tal cual** con el panel (`admin-cristaleriabv/src/lib/web/pricing/`) para que el gestor de presupuestos calcule igual que la web: si cambias uno, copia los tres al otro repo.

### Cómo lee la web el contenido

- `src/lib/web/datos.ts` (servidor): consultas REST a Supabase con la clave pública, en caché con `"use cache"` + `cacheLife("minutes")` (revalidación cada 60 s). Si no hay variables, la tabla no existe (404), hay un error o tarda más de 5 s, devuelve `null`.
- `src/lib/web/mezclar.ts`: mezcla cada bloque sobre `src/content/*` y descarta lo mal formado (nunca rompe una página).
- `src/components/site/web-provider.tsx`: pasa los datos mezclados (negocio, servicios, FAQ y la fila de tarifas) a los componentes de cliente; `usePricing()` (`src/lib/pricing/use-pricing.ts`) devuelve precios y categorías ya resueltos.
- Reglas de fotos (`src/lib/web/mezclar.ts`): en el panel se suben las fotos a cada tipo de trabajo (un álbum por tipo, `trabajos-<servicio>`; también cuentan los álbumes antiguos con ese `servicio`). /trabajos enseña siempre la galería con el filtro por tipo (`trabajosPorTipo`): cada tipo con sus fotos del panel o, si no tiene, las de ejemplo del código, y al final las de los álbumes sin servicio (solo en «Todos»). La galería de cada servicio usa las mismas fotos de su tipo (`trabajosDeServicio`). La portada usa las fotos `destacada` (hasta 8); si no hay, la primera foto del panel de cada tipo completando hasta 4 con las del código, y sin fotos del panel, las del código.

## Funcionalidades

- **Calculadora** (`/presupuesto`), en 4 pasos: servicio → configuración (8 categorías, mampara a medida y modelos estándar) → visita y entrega → resumen. Envío por WhatsApp, reserva de visita e impresión/PDF. Precio en directo y desglose. Las categorías, campos y opciones ocultos en el panel no salen; las opciones nuevas se cobran con su precio de `web_tarifas.config`.
- **Solicitud de presupuesto:** con Supabase configurado, el resumen de la calculadora ofrece «Solicitar presupuesto» (nombre, teléfono, email opcional, población, comentarios, consentimiento y campo trampa). Se envía a la edge function `web-solicitud-presupuesto` del panel, que crea el presupuesto en estado «solicitud» y devuelve su número (P-2026-0001), que se muestra al cliente. Si falla, se ofrece enviarlo por WhatsApp.
- **Newsletter** (doble opt-in, funciones `newsletter-alta` y `newsletter-baja` del panel; ver `docs/NEWSLETTER.md` del panel): bloque «Novedades por correo» arriba del pie (email, casilla de consentimiento sin marcar con enlace a `/privacidad` y campo trampa) y casilla opcional, sin marcar, en «Solicitar presupuesto». Al apuntarse llega un correo con el enlace a `/newsletter/confirmada?t=…`, que pide pulsar «Confirmar mi suscripción» (abrir el enlace no confirma: los antivirus abren los enlaces solos). Cada correo lleva su enlace a `/newsletter/baja?t=…`, que pide pulsar «Darme de baja». El bloque y la casilla solo salen si el panel dice que se puede apuntar alguien (`leerNewsletterActiva` en `src/lib/web/datos.ts`: clave de Resend y remitente puestos; se comprueba cada minuto); sin las variables de Supabase no salen nunca y las dos páginas dicen que no está disponible. El texto de cada casilla es la prueba del consentimiento: si cambia (`src/lib/newsletter.ts`), cambiar también `TEXTOS_CONSENTIMIENTO` en `supabase/functions/newsletter-alta/alta.ts` del panel. Los tokens (`?t=`) no salen de la web: esas páginas no mandan referente y Vercel Web Analytics los quita de la URL.
- **Desplazamiento:** distancias por carretera desde C/ Pío XII, 5 (OpenStreetMap), geolocalización opcional que no sale del navegador, o km a mano.
- **Reserva de visita técnica y contacto:** abren WhatsApp con los datos ya escritos. Las edge functions antiguas `book-appointment` y `contact` (carpeta `supabase/` de este repo) solo se usan con `NEXT_PUBLIC_FORMULARIOS_SUPABASE=1`.
- **Asistente virtual:** responde en local con las preguntas frecuentes (las del panel si las hay). Con `NEXT_PUBLIC_FORMULARIOS_SUPABASE=1` usa la edge function antigua `chat` (OpenAI).
- **Panel:** `/admin` redirige a https://admin-cristaleriabv.vercel.app (repo `admin-cristaleriabv`).
- **Estadísticas sin cookies** (para **Tráfico web** y **Super Admin › Logs** del panel; ver más abajo).
- **SEO:** metadatos por página, `sitemap.xml`, `robots.txt` y datos estructurados `HomeAndConstructionBusiness` (con los datos del panel).

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública (canonical, sitemap, Open Graph) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase del panel (`https://gorekooabfhqudeshtgq.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (`sb_publishable_…`) del mismo proyecto |
| `NEXT_PUBLIC_FORMULARIOS_SUPABASE` | `1` solo si existen las edge functions antiguas `contact`, `book-appointment` y `chat`. Por defecto apagado |
| `NEXT_PUBLIC_ACTIVIDAD_WEB` | `off` apaga la actividad para Logs aunque esté `NEXT_PUBLIC_SUPABASE_URL`. Por defecto encendida |

Sin las variables de Supabase la web es exactamente la del código: contacto y reserva por WhatsApp, asistente con respuestas locales, tarifas de `config.ts` y sin «Solicitar presupuesto» (solo WhatsApp). Al ser `NEXT_PUBLIC_*`, se fijan al compilar: después de cambiarlas en Vercel hay que volver a desplegar.

**En producción** (proyecto `cristaleriabv` de Vercel) están puestas desde el 24/11/2026 `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (producción, preview y desarrollo); `NEXT_PUBLIC_FORMULARIOS_SUPABASE` no está puesta. La base de datos y la función `web-solicitud-presupuesto` llegaron con la v1.2.x del panel.

## Estadísticas sin cookies (Tráfico web y Logs del panel)

La web no usa cookies ni guarda nada en el navegador para medir. Hay dos piezas:

- **Vercel Web Analytics** (`<Analytics />` de `@vercel/analytics` en `src/app/layout.tsx`, solo cuando se compila en Vercel): visitas, páginas, procedencia, país y dispositivo, agregadas y sin cookies. El panel las copia cada noche a **Tráfico web** (función `sync-trafico-web`). Hay que activarlo en Vercel: proyecto `cristaleriabv` › *Analytics* › *Enable*.
- **Actividad propia** (`src/lib/actividad/`): eventos en lotes cada 5 s (y con `sendBeacon` al ocultar o cerrar la página), en `text/plain` y sin cabeceras propias, a la edge function `registrar-actividad-web` del panel (`<NEXT_PUBLIC_SUPABASE_URL>/functions/v1/registrar-actividad-web`). Los ve el super admin en **Super Admin › Logs** (recorridos, errores, incidencias) y, agregados, quien ve **Tráfico web** (comportamiento). Contrato y detalles: `docs/LOGS-WEB.md` del panel.

Qué se manda:

| Evento | Cuándo |
| --- | --- |
| `pagina_vista` / `pagina_salida` / `scroll` / `carga_pagina` | Cada página (también las navegaciones dentro de la web, `src/components/site/actividad-web.tsx`), su tiempo activo, hasta dónde se baja (25/50/75/100 %) y la velocidad de carga |
| `contacto` | Clic en un enlace `tel:`, WhatsApp, `mailto:`, mapa o red social (solo el canal y la zona: nunca el número) |
| `clic` | Llamadas a la acción hacia `/presupuesto` o `/contacto` y elementos con `data-actividad` («Solicitar presupuesto», «Reservar visita técnica»…) |
| `calculadora` | Inicio, servicio elegido, paso, precio calculado (importe orientativo, IVA incluido) y vuelta a empezar. Nunca medidas ni opciones |
| `formulario` | Inicio, error de validación, envío y abandono de los formularios de presupuesto, contacto y visita (solo cuántos campos hay rellenos) |
| `presupuesto_solicitado` / `presupuesto_rechazado` | Respuesta de `web-solicitud-presupuesto` (la conversión) |
| `contacto_enviado` | Formulario de contacto o de visita enviado (por WhatsApp o al servidor) |
| `newsletter_alta` | Alta en la newsletter aceptada (pendiente de confirmar por correo) o rechazada, con su origen (pie o presupuesto). Nunca el email |
| `media` / `chat` | Fotos de trabajos que se abren y se pasan; abrir el asistente, preguntar y responder (nunca el texto) |
| `peticion` / `error_*` | Llamadas a las edge functions (código y duración) y errores: JavaScript, promesas, recursos, peticiones fallidas y 404 |

- Sin `NEXT_PUBLIC_SUPABASE_URL` (o con `NEXT_PUBLIC_ACTIVIDAD_WEB=off`) no se registra nada ni se añade ningún listener: la web es la de siempre.
- Con **«No rastrear»** o **Global Privacy Control** solo se mandan los errores. La sesión es un id aleatorio en memoria (al recargar empieza otra) y no hay id de visitante.
- Se arranca en `src/instrumentation-client.ts` (antes de la hidratación, para ver los errores de la carga). Nunca rompe la web: todo va en `try/catch` y, si la función no responde (por ejemplo, antes de que el panel la publique: 404), deja de intentarlo en esa página.
- **Tráfico interno**: abre la web una vez con `?bv_interno=1` en tu navegador para no contarte en las estadísticas (se guarda solo esa marca, `bv_interno`, en ese navegador); `?bv_interno=0` la quita.
- Las páginas de privacidad y cookies explican todo esto.

## Supabase

La base de datos, las migraciones, el bucket de fotos y la edge function `web-solicitud-presupuesto` viven en el repo del panel, **`admin-cristaleriabv`**. La carpeta `supabase/` de este repo es el backend antiguo de la web y **no se aplica**; ver [`supabase/README.md`](supabase/README.md).
