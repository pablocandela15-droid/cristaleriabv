/**
 * Lectura del contenido editable desde el panel (Supabase, REST con la clave
 * pública). Solo para el servidor: cada consulta se guarda en caché y se
 * revalida cada minuto (`cacheLife("minutes")`), así los cambios del panel se
 * ven en la web en ~1 minuto sin convertir las páginas en dinámicas.
 *
 * Nunca rompe una página: sin variables de Supabase no se consulta nada, y si
 * la tabla aún no existe (404 de PostgREST), responde con error o tarda más de
 * unos segundos, se devuelve null y la web usa los valores del código.
 */
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { isBackendConfigured, publicHeaders, supabaseUrl } from "@/lib/backend";
import { mezclarWeb, type Web } from "@/lib/web/mezclar";
import type { FilaAlbum, FilaContenido, FilaDestacada, FilaTarifas } from "@/lib/web/tipos";

const TIEMPO_MAXIMO_MS = 5000;

async function leer<T>(consulta: string): Promise<T[] | null> {
  if (!isBackendConfigured) return null;
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/rest/v1/${consulta}`, {
      headers: { ...publicHeaders(), Accept: "application/json" },
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as T[]) : null;
  } catch {
    return null;
  }
}

/** Fila única de `web_tarifas` (precios y catálogo de la calculadora). */
export async function leerTarifas(): Promise<FilaTarifas | null> {
  "use cache";
  // Sin Supabase no hay nada que revalidar: las páginas quedan estáticas como siempre.
  if (isBackendConfigured) cacheLife("minutes");
  else cacheLife("max");
  cacheTag("web_tarifas");
  const filas = await leer<FilaTarifas>("web_tarifas?select=config,catalogo&id=eq.1");
  return filas?.[0] ?? null;
}

/** Bloques de `web_contenido` (negocio, servicios, faq, imagenes). */
export async function leerContenido(): Promise<FilaContenido[] | null> {
  "use cache";
  // Sin Supabase no hay nada que revalidar: las páginas quedan estáticas como siempre.
  if (isBackendConfigured) cacheLife("minutes");
  else cacheLife("max");
  cacheTag("web_contenido");
  return leer<FilaContenido>("web_contenido?select=clave,valor");
}

/** Álbumes publicados con sus fotos. */
export async function leerAlbumes(): Promise<FilaAlbum[] | null> {
  "use cache";
  // Sin Supabase no hay nada que revalidar: las páginas quedan estáticas como siempre.
  if (isBackendConfigured) cacheLife("minutes");
  else cacheLife("max");
  cacheTag("web_fotos");
  return leer<FilaAlbum>(
    "web_albumes?select=id,slug,titulo,descripcion,servicio,portada_foto_id,orden,fotos:web_fotos(id,ruta,titulo,alt,ancho,alto,orden,destacada)&publicado=eq.true&order=orden.asc&fotos.order=orden.asc",
  );
}

/** Fotos destacadas para la portada. */
export async function leerDestacadas(): Promise<FilaDestacada[] | null> {
  "use cache";
  // Sin Supabase no hay nada que revalidar: las páginas quedan estáticas como siempre.
  if (isBackendConfigured) cacheLife("minutes");
  else cacheLife("max");
  cacheTag("web_fotos");
  return leer<FilaDestacada>(
    "web_fotos?select=id,ruta,titulo,alt,ancho,alto,album:web_albumes(slug,titulo,servicio)&destacada=eq.true&order=orden.asc",
  );
}

/** Contenido de la web ya mezclado sobre los valores de src/content/* (una vez por petición). */
export const obtenerWeb = cache(async (): Promise<Web> => {
  const [contenido, albumes, destacadas] = await Promise.all([leerContenido(), leerAlbumes(), leerDestacadas()]);
  return mezclarWeb({ contenido, albumes, destacadas });
});
