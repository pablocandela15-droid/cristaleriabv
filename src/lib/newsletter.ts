import { BackendError, callFunction, isBackendConfigured, publicHeaders, supabaseUrl } from "@/lib/backend";
import { registrarAltaNewsletter, registrarPeticion } from "@/lib/actividad";

/**
 * Newsletter de la cristalería (funciones `newsletter-alta` y `newsletter-baja` del panel, repo admin-cristaleriabv;
 * ver su docs/NEWSLETTER.md). Doble opt-in: apuntarse deja el alta pendiente y manda un correo con el enlace a
 * /newsletter/confirmada; solo al pulsar «Confirmar mi suscripción» en esa página empieza a recibir correos. Cada
 * correo lleva su enlace a /newsletter/baja. Sin las variables de Supabase no hay newsletter: las dos páginas dicen
 * que no está disponible y la privacidad no la menciona. El bloque del pie y la casilla del presupuesto, además, solo
 * salen cuando el panel dice que se puede apuntar alguien (leerNewsletterActiva en src/lib/web/datos.ts).
 */
export const newsletterDisponible = isBackendConfigured;

/**
 * Texto exacto de cada casilla: se guarda con el alta como prueba del consentimiento (TEXTOS_CONSENTIMIENTO de
 * supabase/functions/newsletter-alta/alta.ts en el panel). Si cambia aquí, cambiarlo también allí.
 */
export const CASILLA_PIE = {
  antes: "Quiero recibir por correo las novedades y ofertas de Cristalería Baix Vinalopó. He leído la ",
  enlace: "política de privacidad",
  despues: " y sé que puedo darme de baja cuando quiera.",
} as const;
export const CASILLA_PRESUPUESTO =
  "Quiero recibir también por correo las novedades y ofertas de Cristalería Baix Vinalopó (puedo darme de baja cuando quiera).";

export type OrigenAlta = "web_formulario" | "web_presupuesto";

/** Token de los enlaces de confirmar y de baja: 64 caracteres hexadecimales aleatorios (uno por persona). */
export const TOKEN_RE = /^[0-9a-f]{64}$/;
/** El enlace de las pruebas y de la vista previa del panel: no es de nadie. */
export const TOKEN_PRUEBA = "prueba";

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

/** Valida el email del bloque de suscripción (la función lo vuelve a comprobar). */
export function errorEmail(email: string): string | undefined {
  const e = email.trim();
  if (!e) return "Escribe tu correo electrónico";
  return e.length <= 254 && EMAIL_RE.test(e) ? undefined : "Escribe un correo electrónico válido";
}

export type ResultadoAlta = { ok: true; mensaje: string } | { ok: false; error: string; status: number };

const MENSAJE_OK = "¡Casi está! Te hemos enviado un correo: pulsa el enlace para confirmar la suscripción.";

/** Apuntarse: queda pendiente hasta confirmar desde el correo. */
export async function suscribir(d: { email: string; nombre?: string; origen: OrigenAlta; website: string }): Promise<ResultadoAlta> {
  if (d.website) return { ok: true, mensaje: MENSAJE_OK };
  if (!newsletterDisponible) return { ok: false, error: "La suscripción no está disponible ahora mismo.", status: 0 };
  try {
    const r = await callFunction<{ ok?: boolean; mensaje?: string }>(
      "newsletter-alta",
      {
        accion: "alta",
        email: d.email.trim().slice(0, 254),
        nombre: d.nombre?.trim().slice(0, 80) || undefined,
        consentimiento: true,
        origen: d.origen,
        website: d.website,
      },
      AbortSignal.timeout(15000),
    );
    registrarAltaNewsletter({ ok: true }, d.origen);
    return { ok: true, mensaje: typeof r?.mensaje === "string" && r.mensaje ? r.mensaje : MENSAJE_OK };
  } catch (e) {
    const status = e instanceof BackendError ? (e.status ?? 0) : 0;
    registrarAltaNewsletter({ ok: false, status }, d.origen);
    if (status === 429) return { ok: false, error: "Has hecho varios intentos seguidos. Espera un poco y vuelve a probar.", status };
    if ((status === 400 || status === 503) && e instanceof BackendError && e.message) return { ok: false, error: e.message, status };
    return { ok: false, error: "No hemos podido apuntarte ahora mismo. Inténtalo de nuevo en unos minutos.", status };
  }
}

export type EstadoConfirmacion = "confirmada" | "ya_confirmada" | "caducado" | "invalido" | "error";

/** Confirmar la suscripción con el token del correo (solo al pulsar el botón de la página). */
export async function confirmar(t: string): Promise<{ estado: EstadoConfirmacion; email: string | null }> {
  if (!TOKEN_RE.test(t)) return { estado: "invalido", email: null };
  try {
    const r = await callFunction<{ estado?: string; email?: string | null }>("newsletter-alta", { accion: "confirmar", t }, AbortSignal.timeout(15000));
    const estado = (["confirmada", "ya_confirmada", "caducado", "invalido"] as const).find((x) => x === r?.estado) ?? "error";
    return { estado, email: typeof r?.email === "string" ? r.email : null };
  } catch {
    return { estado: "error", email: null };
  }
}

export type EstadoBaja = "confirmar" | "baja_hecha" | "ya_estaba" | "invalido" | "prueba" | "error";

/**
 * Baja con el token del correo: `consultar` no cambia nada (lo que enseña la página al abrirse); `darDeBaja` es el
 * botón «Darme de baja».
 */
async function llamarBaja(t: string, metodo: "GET" | "POST"): Promise<{ estado: EstadoBaja; email: string | null }> {
  if (t === TOKEN_PRUEBA) return { estado: "prueba", email: null };
  if (!TOKEN_RE.test(t)) return { estado: "invalido", email: null };
  if (!newsletterDisponible) return { estado: "error", email: null };
  const inicio = Date.now();
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/newsletter-baja?t=${t}&formato=json`, {
      method: metodo,
      headers: publicHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    registrarPeticion("newsletter-baja", res.status, Date.now() - inicio, undefined, metodo);
    const r = (await res.json().catch(() => ({}))) as { estado?: string; email?: string | null };
    const estado = (["confirmar", "baja_hecha", "ya_estaba", "invalido", "prueba"] as const).find((x) => x === r.estado) ?? "error";
    return { estado: res.ok || estado === "invalido" ? estado : "error", email: typeof r.email === "string" ? r.email : null };
  } catch {
    registrarPeticion("newsletter-baja", 0, Date.now() - inicio, "sin conexión", metodo);
    return { estado: "error", email: null };
  }
}

export const consultarBaja = (t: string) => llamarBaja(t, "GET");
export const darDeBaja = (t: string) => llamarBaja(t, "POST");
