# Cristalería Baix Vinalopó · web

Web corporativa con calculadora de presupuestos, solicitud de presupuesto, reserva de visita técnica y asistente virtual. Los textos, fotos, «books» de trabajos, precios y opciones de la calculadora se editan desde el **panel de administración** (repo [`admin-cristaleriabv`](https://admin-cristaleriabv.vercel.app)); `/admin` redirige allí.

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
| «Books» de trabajos (/trabajos y galería de cada servicio) | `web_albumes` + `web_fotos` | `src/content/works.ts` |
| Trabajos de la portada | `web_fotos` con `destacada` | `featuredWorks` en `src/content/works.ts` |
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
- Reglas de fotos: con al menos un álbum publicado con fotos, /trabajos muestra los «books»; si no, la galería del código. La galería de cada servicio usa las fotos de los álbumes con ese `servicio` (si no hay, la del código) y la portada, las fotos `destacada` (si no hay, las del código).

## Funcionalidades

- **Calculadora** (`/presupuesto`), en 4 pasos: servicio → configuración (8 categorías, mampara a medida y modelos estándar) → visita y entrega → resumen. Envío por WhatsApp, reserva de visita e impresión/PDF. Precio en directo y desglose. Las categorías, campos y opciones ocultos en el panel no salen; las opciones nuevas se cobran con su precio de `web_tarifas.config`.
- **Solicitud de presupuesto:** con Supabase configurado, el resumen de la calculadora ofrece «Solicitar presupuesto» (nombre, teléfono, email opcional, población, comentarios, consentimiento y campo trampa). Se envía a la edge function `web-solicitud-presupuesto` del panel, que crea el presupuesto en estado «solicitud» y devuelve su número (P-2026-0001), que se muestra al cliente. Si falla, se ofrece enviarlo por WhatsApp.
- **Desplazamiento:** distancias por carretera desde C/ Pío XII, 5 (OpenStreetMap), geolocalización opcional que no sale del navegador, o km a mano.
- **Reserva de visita técnica y contacto:** abren WhatsApp con los datos ya escritos. Las edge functions antiguas `book-appointment` y `contact` (carpeta `supabase/` de este repo) solo se usan con `NEXT_PUBLIC_FORMULARIOS_SUPABASE=1`.
- **Asistente virtual:** responde en local con las preguntas frecuentes (las del panel si las hay). Con `NEXT_PUBLIC_FORMULARIOS_SUPABASE=1` usa la edge function antigua `chat` (OpenAI).
- **Panel:** `/admin` redirige a https://admin-cristaleriabv.vercel.app (repo `admin-cristaleriabv`).
- **SEO:** metadatos por página, `sitemap.xml`, `robots.txt` y datos estructurados `HomeAndConstructionBusiness` (con los datos del panel).

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública (canonical, sitemap, Open Graph) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase del panel (`https://gorekooabfhqudeshtgq.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (`sb_publishable_…`) del mismo proyecto |
| `NEXT_PUBLIC_FORMULARIOS_SUPABASE` | `1` solo si existen las edge functions antiguas `contact`, `book-appointment` y `chat`. Por defecto apagado |

Sin las variables de Supabase la web es exactamente la del código: contacto y reserva por WhatsApp, asistente con respuestas locales, tarifas de `config.ts` y sin «Solicitar presupuesto» (solo WhatsApp). Al ser `NEXT_PUBLIC_*`, se fijan al compilar: después de cambiarlas en Vercel hay que volver a desplegar.

**En producción** (proyecto `cristaleriabv` de Vercel) están puestas desde el 24/11/2026 `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (producción, preview y desarrollo); `NEXT_PUBLIC_FORMULARIOS_SUPABASE` no está puesta. La base de datos y la función `web-solicitud-presupuesto` llegaron con la v1.2.x del panel.

## Supabase

La base de datos, las migraciones, el bucket de fotos y la edge function `web-solicitud-presupuesto` viven en el repo del panel, **`admin-cristaleriabv`**. La carpeta `supabase/` de este repo es el backend antiguo de la web y **no se aplica**; ver [`supabase/README.md`](supabase/README.md).
