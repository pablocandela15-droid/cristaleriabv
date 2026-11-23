/**
 * Filas que la web lee de Supabase (REST con la clave pública). El esquema vive
 * en el repo del panel (admin-cristaleriabv, migración
 * 20261123100000_web_y_presupuestos.sql); aquí solo los campos que se piden.
 */
import type { FilaTarifas } from "@/lib/pricing/tarifas";

export type { FilaTarifas };

/** `web_contenido`: una fila por bloque editable. */
export type ClaveContenido = "negocio" | "servicios" | "faq" | "imagenes";
export type FilaContenido = { clave: string; valor: unknown };

/** Foto de `web_fotos` tal como llega embebida en un álbum o en la lista de destacadas. */
export type FilaFoto = {
  id: string;
  ruta: string;
  titulo?: string | null;
  alt?: string | null;
  ancho?: number | null;
  alto?: number | null;
  orden?: number | null;
  destacada?: boolean | null;
};

/** `web_albumes` («books») con sus fotos publicadas. */
export type FilaAlbum = {
  id: string;
  slug: string;
  titulo: string;
  descripcion?: string | null;
  servicio?: string | null;
  portada_foto_id?: string | null;
  orden?: number | null;
  fotos?: FilaFoto[] | null;
};

/** Foto destacada (portada) con su álbum, si tiene. */
export type FilaDestacada = FilaFoto & {
  album?: { slug: string; titulo: string; servicio?: string | null } | null;
};

/** Lo que devuelve Supabase (o null si no hay backend, la tabla no existe o falla). */
export type DatosRemotos = {
  contenido: FilaContenido[] | null;
  albumes: FilaAlbum[] | null;
  destacadas: FilaDestacada[] | null;
};
