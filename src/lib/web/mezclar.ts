/**
 * Mezcla el contenido editable desde el panel (Supabase) sobre los valores del
 * código (src/content/*). Funciones puras: sin Next ni React, valen en el
 * servidor y en el navegador.
 *
 * Regla general: lo que llegue mal formado o vacío se ignora y se queda el
 * valor del código, así un dato erróneo en el panel nunca rompe una página.
 */
import { site as defaultSite, type Address, type Hours, type Phone, type Site } from "@/content/site";
import { services as defaultServices, type Service, type ServiceSlug } from "@/content/services";
import { faqs as defaultFaqs, type Faq } from "@/content/faq";
import { imageSlots, photos as defaultPhotos, type ImageSlot, type Photo } from "@/content/images";
import { featuredWorks as defaultFeatured, works as defaultWorks, type Work } from "@/content/works";
import { supabaseUrl } from "@/lib/backend";
import type { DatosRemotos, FilaAlbum, FilaContenido, FilaDestacada, FilaFoto } from "@/lib/web/tipos";

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

type Obj = Record<string, unknown>;
const esObjeto = (v: unknown): v is Obj => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const numero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const textos = (v: unknown) => (Array.isArray(v) ? v.map(texto).filter(Boolean) : []);

const SLUGS = defaultServices.map((s) => s.slug);
export const esServicio = (v: unknown): v is ServiceSlug => typeof v === "string" && (SLUGS as string[]).includes(v);

/** Bloque `valor` de una clave de `web_contenido` (o undefined si no está). */
function bloque(contenido: FilaContenido[] | null, clave: string): unknown {
  return contenido?.find((f) => f?.clave === clave)?.valor;
}

/* ------------------------------------------------------------------ */
/* Fotos de Supabase Storage (bucket público `web-fotos`)              */
/* ------------------------------------------------------------------ */

const RUTA_VALIDA = /^[A-Za-z0-9][A-Za-z0-9/_.-]*$/;

/** URL pública de una foto del bucket `web-fotos`, o null si la ruta no es válida. */
export function fotoUrl(ruta: unknown): string | null {
  const r = texto(ruta);
  if (!supabaseUrl || !r || !RUTA_VALIDA.test(r) || r.includes("..")) return null;
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/web-fotos/${r}`;
}

/* ------------------------------------------------------------------ */
/* negocio → site                                                      */
/* ------------------------------------------------------------------ */

function telefonos(v: unknown): Phone[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter(esObjeto)
    .map((p) => {
      const display = texto(p.display);
      const tel = texto(p.tel).replace(/[^\d+]/g, "") || `+34${display.replace(/\D/g, "")}`;
      return { label: texto(p.label), display, tel };
    })
    .filter((p) => p.display && p.tel.replace(/\D/g, "").length >= 6);
  return out.length ? out : undefined;
}

function horarios(v: unknown): Hours[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter(esObjeto).map((h) => ({ days: texto(h.days), time: texto(h.time) })).filter((h) => h.days && h.time);
  return out.length ? out : undefined;
}

function direccion(base: Address, v: unknown): Address {
  if (!esObjeto(v)) return base;
  const out = { ...base };
  for (const k of ["street", "postalCode", "city", "province", "country"] as const) {
    const t = texto(v[k]);
    if (t) out[k] = t;
  }
  const lat = numero(v.lat);
  const lon = numero(v.lon);
  if (lat !== undefined && Math.abs(lat) <= 90) out.lat = lat;
  if (lon !== undefined && Math.abs(lon) <= 180) out.lon = lon;
  return out;
}

/**
 * Mezcla superficial del bloque `negocio` sobre `site` (la dirección, campo a
 * campo). El nombre, el nombre corto y la URL no se editan desde el panel.
 */
export function mezclarSite(v: unknown, base: Site = defaultSite): Site {
  if (!esObjeto(v)) return base;
  const out: Site = { ...base, address: direccion(base.address, v.address) };
  for (const k of ["tagline", "description", "email", "serviceArea"] as const) {
    const t = texto(v[k]);
    if (t) out[k] = t;
  }
  const years = numero(v.yearsExperience);
  if (years !== undefined && years > 0 && years < 200) out.yearsExperience = Math.round(years);
  const whatsapp = texto(v.whatsapp).replace(/\D/g, "");
  if (whatsapp.length >= 8) out.whatsapp = whatsapp;
  out.phones = telefonos(v.phones) ?? base.phones;
  out.hours = horarios(v.hours) ?? base.hours;
  return out;
}

/* ------------------------------------------------------------------ */
/* servicios                                                           */
/* ------------------------------------------------------------------ */

const CAMPOS_TEXTO = ["name", "short", "headline", "intro", "seoTitle", "seoDescription"] as const;
const CAMPOS_LISTA = ["features", "ideas"] as const;

/** `{ [slug]: parcial de Service }` sobre los servicios del código (mismo orden y slugs). */
export function mezclarServicios(v: unknown, base: Service[] = defaultServices): Service[] {
  if (!esObjeto(v)) return base;
  return base.map((s) => {
    const p = v[s.slug];
    if (!esObjeto(p)) return s;
    const out: Service = { ...s };
    for (const k of CAMPOS_TEXTO) {
      const t = texto(p[k]);
      if (t) out[k] = t;
    }
    for (const k of CAMPOS_LISTA) {
      const l = textos(p[k]);
      if (l.length) out[k] = l;
    }
    return out;
  });
}

/* ------------------------------------------------------------------ */
/* faq                                                                 */
/* ------------------------------------------------------------------ */

/** Lista completa de preguntas. Si viene vacía o mal formada, la del código. */
export function mezclarFaq(v: unknown, base: Faq[] = defaultFaqs): Faq[] {
  if (!Array.isArray(v)) return base;
  const out = v
    .filter(esObjeto)
    .map((f) => ({ q: texto(f.q), a: texto(f.a), tags: textos(f.tags) }))
    .filter((f) => f.q && f.a);
  return out.length ? out : base;
}

/** Preguntas por posición (las elegidas para la home o un servicio), sin huecos si la lista es más corta. */
export function faqsPorIndice(lista: Faq[], indices: number[], minimo = 4): Faq[] {
  const elegidas = indices.map((i) => lista[i]).filter((f): f is Faq => Boolean(f));
  return elegidas.length ? elegidas : lista.slice(0, minimo);
}

/* ------------------------------------------------------------------ */
/* imagenes                                                            */
/* ------------------------------------------------------------------ */

export type Photos = Record<ImageSlot, Photo> & { process: Photo[] };

const ALT_GENERICO: Record<ImageSlot, string> = {
  hero: "Trabajo de cristalería",
  heroHouse: "Vivienda con cerramientos y ventanales de cristal",
  about: "Nuestro taller de cristalería",
  aboutHands: "Cristalero trabajando el vidrio en el taller",
  contact: "Espacio luminoso con cristal",
};

/** Una entrada de `imagenes`: ruta del bucket (cadena) u objeto `{ ruta, alt }`. */
function fotoDeEntrada(v: unknown, slot: ImageSlot): Photo | null {
  const ruta = esObjeto(v) ? v.ruta : v;
  const src = fotoUrl(ruta);
  if (!src) return null;
  const alt = (esObjeto(v) && texto(v.alt)) || ALT_GENERICO[slot];
  return { src, alt };
}

export function mezclarImagenes(v: unknown, base: Photos = defaultPhotos): Photos {
  if (!esObjeto(v)) return base;
  const out: Photos = { ...base };
  for (const slot of imageSlots) out[slot] = fotoDeEntrada(v[slot], slot) ?? base[slot];
  return out;
}

/* ------------------------------------------------------------------ */
/* Álbumes («books») y fotos destacadas                                */
/* ------------------------------------------------------------------ */

export type AlbumWeb = {
  id: string;
  slug: string;
  title: string;
  description: string;
  service: ServiceSlug | null;
  cover: Photo;
  works: Work[];
};

const porOrden = <T extends { orden?: number | null }>(a: T, b: T) => (a.orden ?? 0) - (b.orden ?? 0);

function fotoAWork(f: FilaFoto, tituloAlbum: string, servicio: ServiceSlug | null): Work | null {
  const src = fotoUrl(f?.ruta);
  if (!src) return null;
  const title = texto(f.titulo) || tituloAlbum || "Trabajo de cristalería";
  return { title, category: servicio, photo: { src, alt: texto(f.alt) || title } };
}

const esWork = (w: Work | null): w is Work => w !== null;

/** Álbumes publicados con al menos una foto válida, en el orden del panel. */
export function albumesDesdeFilas(filas: FilaAlbum[] | null): AlbumWeb[] {
  if (!Array.isArray(filas)) return [];
  return filas
    .filter((a) => esObjeto(a) && texto(a.slug) && texto(a.titulo))
    .sort(porOrden)
    .map((a) => {
      const title = texto(a.titulo);
      const service = esServicio(a.servicio) ? a.servicio : null;
      const fotos = (Array.isArray(a.fotos) ? [...a.fotos] : []).filter(esObjeto).sort(porOrden);
      const portada = fotos.find((f) => a.portada_foto_id && f.id === a.portada_foto_id);
      const works = fotos.map((f) => fotoAWork(f, title, service)).filter(esWork);
      const cover = (portada && fotoAWork(portada, title, service)?.photo) || works[0]?.photo;
      return { id: String(a.id), slug: texto(a.slug), title, description: texto(a.descripcion), service, cover, works };
    })
    .filter((a): a is AlbumWeb => a.works.length > 0 && Boolean(a.cover));
}

/** Fotos destacadas para la portada (máximo 8). */
export function destacadasDesdeFilas(filas: FilaDestacada[] | null, maximo = 8): Work[] {
  if (!Array.isArray(filas)) return [];
  return filas
    .filter(esObjeto)
    .map((f) => {
      const album = esObjeto(f.album) ? f.album : null;
      return fotoAWork(f, texto(album?.titulo), esServicio(album?.servicio) ? album.servicio : null);
    })
    .filter(esWork)
    .slice(0, maximo);
}

/* ------------------------------------------------------------------ */
/* Todo junto                                                          */
/* ------------------------------------------------------------------ */

/** Datos de la web ya mezclados (serializables: se pueden pasar a componentes de cliente). */
export type Web = {
  site: Site;
  services: Service[];
  faqs: Faq[];
  photos: Photos;
  /** «Books» de Supabase. Vacío = se usa la galería del código. */
  albums: AlbumWeb[];
  /** Selección de la portada: destacadas de Supabase o, si no hay, las del código. */
  featured: Work[];
};

export function mezclarWeb({ contenido, albumes, destacadas }: DatosRemotos): Web {
  const featured = destacadasDesdeFilas(destacadas);
  return {
    site: mezclarSite(bloque(contenido, "negocio")),
    services: mezclarServicios(bloque(contenido, "servicios")),
    faqs: mezclarFaq(bloque(contenido, "faq")),
    photos: mezclarImagenes(bloque(contenido, "imagenes")),
    albums: albumesDesdeFilas(albumes),
    featured: featured.length ? featured : defaultFeatured,
  };
}

/** Web solo con los valores del código (sin Supabase). */
export const webPorDefecto: Web = mezclarWeb({ contenido: null, albumes: null, destacadas: null });

/** Galería de un servicio: fotos de los álbumes con ese servicio o, si no hay, las del código. */
export function trabajosDeServicio(web: Web, slug: ServiceSlug): Work[] {
  const remotos = web.albums.filter((a) => a.service === slug).flatMap((a) => a.works);
  return remotos.length ? remotos : defaultWorks.filter((w) => w.category === slug);
}
