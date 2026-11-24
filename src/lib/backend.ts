import { registrarPeticion } from "@/lib/actividad";

/**
 * Acceso a Supabase con la clave pública (lectura del contenido de la web y
 * edge functions). Si las variables de entorno no están configuradas,
 * `isBackendConfigured` es false: la web usa los valores del código y cada
 * formulario su alternativa (WhatsApp o respuestas locales).
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isBackendConfigured = Boolean(supabaseUrl && supabaseKey);

/**
 * Formularios antiguos de la web (edge functions `contact`, `book-appointment` y
 * `chat`). No existen en el proyecto de Supabase del panel, así que quedan
 * apagados aunque estén las variables de Supabase: solo se activan con
 * NEXT_PUBLIC_FORMULARIOS_SUPABASE=1. Apagados, el contacto y la reserva van por
 * WhatsApp y el asistente responde en local con las preguntas frecuentes.
 */
export const formulariosSupabase = isBackendConfigured && process.env.NEXT_PUBLIC_FORMULARIOS_SUPABASE === "1";

/**
 * Cabeceras para llamar a Supabase con la clave pública. Las claves nuevas
 * (`sb_publishable_…`) van solo en `apikey`; si se envían también como Bearer,
 * la plataforma intenta leerlas como JWT y rechaza la petición. Las claves
 * antiguas (`anon`, que son JWT y empiezan por "eyJ") sí admiten Bearer.
 */
export function publicHeaders(): Record<string, string> {
  const h: Record<string, string> = { apikey: supabaseKey };
  if (supabaseKey.startsWith("eyJ")) h.Authorization = `Bearer ${supabaseKey}`;
  return h;
}

export class BackendError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

/**
 * Llama a una edge function y devuelve su JSON. Lanza BackendError si falla.
 * Apunta la llamada (endpoint, código y duración; nunca el contenido) para Logs del panel.
 */
export async function callFunction<T>(name: string, body: unknown, signal?: AbortSignal): Promise<T> {
  if (!isBackendConfigured) throw new BackendError("Backend no configurado");
  const inicio = Date.now();
  let res: Response;
  try {
    res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...publicHeaders() },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    const motivo = e instanceof DOMException && e.name === "TimeoutError" ? "tiempo agotado" : e instanceof DOMException && e.name === "AbortError" ? "cancelada" : "sin conexión";
    if (motivo !== "cancelada") registrarPeticion(name, 0, Date.now() - inicio, motivo);
    throw e;
  }
  registrarPeticion(name, res.status, Date.now() - inicio);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new BackendError((data as { error?: string }).error ?? "No se pudo completar la solicitud", res.status);
  }
  return data as T;
}
