# Supabase · backend antiguo de la web (no se aplica)

**La base de datos de la web vive en el repo del panel, `admin-cristaleriabv`.** Allí están las migraciones (`supabase/migrations/`), su vuelta atrás (`supabase/rollbacks/`), el bucket público de fotos `web-fotos` y la edge function `web-solicitud-presupuesto`. Se aplican desde ese repo al aceptar una release del panel; esta carpeta **no se aplica** a ningún proyecto.

## Qué lee y envía la web

Con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (proyecto del panel, clave pública):

| Qué | Petición |
| --- | --- |
| Tarifas y catálogo de la calculadora | `GET /rest/v1/web_tarifas?select=config,catalogo&id=eq.1` |
| Negocio, servicios, FAQ e imágenes | `GET /rest/v1/web_contenido?select=clave,valor` |
| Fotos de los trabajos (un álbum por tipo y «books») | `GET /rest/v1/web_albumes?select=…,fotos:web_fotos(…)&publicado=eq.true&order=orden.asc&fotos.order=orden.asc` |
| Fotos destacadas (portada) | `GET /rest/v1/web_fotos?select=…,album:web_albumes(slug,titulo,servicio)&destacada=eq.true&order=orden.asc` |
| Fotos | `https://<proyecto>.supabase.co/storage/v1/object/public/web-fotos/<ruta>` |
| Solicitud de presupuesto | `POST /functions/v1/web-solicitud-presupuesto` → `{ numero }` |

Las lecturas se hacen en el servidor de Next.js y se revalidan cada 60 s (`src/lib/web/datos.ts`). Si una tabla aún no existe (404) o Supabase falla, la web usa los valores del código.

## Qué hay en esta carpeta

El backend con el que nació la web, que nunca se llegó a aplicar:

- `migrations/20261118120000_init.sql`: tablas `pricing`, `appointments`, `contact_messages`, `chat_sessions`, `chat_messages`, `admins` y `request_log`. Ya no las usa nada (el antiguo panel `/admin` se ha quitado; `/admin` redirige al panel nuevo).
- `functions/contact`, `functions/book-appointment` y `functions/chat` (OpenAI): la web solo las llama con `NEXT_PUBLIC_FORMULARIOS_SUPABASE=1`. Por defecto el contacto y la reserva van por WhatsApp y el asistente responde en local con las preguntas frecuentes.
- `functions/_shared/knowledge.ts`: conocimiento del asistente, generado con `npm run knowledge`.

Si algún día se quisieran recuperar esas funciones, habría que llevar sus tablas y funciones al repo del panel (que es el dueño del esquema), desplegarlas allí con `verify_jwt = false` y sus secretos (`OPENAI_API_KEY`, `ALLOWED_ORIGINS`, `RATE_LIMIT_SALT`), y poner `NEXT_PUBLIC_FORMULARIOS_SUPABASE=1` en Vercel.
