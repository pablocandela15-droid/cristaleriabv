/**
 * Configuración de la actividad de la web (Logs del panel). Se activa sola
 * cuando está NEXT_PUBLIC_SUPABASE_URL (el mismo proyecto de Supabase que el
 * panel); sin ella no se registra nada ni se añade ningún listener.
 * NEXT_PUBLIC_ACTIVIDAD_WEB=off la apaga aunque esté la variable.
 */
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");

export const ENDPOINT = supabaseUrl ? `${supabaseUrl}/functions/v1/registrar-actividad-web` : "";

export const ACTIVIDAD_ACTIVA = Boolean(ENDPOINT) && process.env.NEXT_PUBLIC_ACTIVIDAD_WEB !== "off";

/** Versión (commit) y despliegue de Vercel con los que se construyó la web (next.config.ts › env). */
export const VERSION = process.env.ACTIVIDAD_VERSION ?? "";
export const DESPLIEGUE = process.env.ACTIVIDAD_DESPLIEGUE ?? "";
