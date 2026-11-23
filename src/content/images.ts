import credits from "../../public/images/credits.json";
import type { ServiceSlug } from "@/content/services";

/**
 * Fotografías de la web, leídas de public/images/credits.json (ruta, autor,
 * licencia y texto alternativo). Ahora son fotos de stock libres de derechos
 * (Pexels/Unsplash). Para usar fotos reales: sustituye el archivo manteniendo
 * el nombre, o añade la entrada nueva en credits.json.
 */
export type Photo = { src: string; alt: string };

type Credit = { file: string; alt: string };
const list = credits as Credit[];

const toPhoto = (c: Credit): Photo => ({ src: `/images/${c.file}`, alt: c.alt });

function photo(file: string): Photo {
  const c = list.find((x) => x.file === file);
  if (!c) throw new Error(`Foto no encontrada en credits.json: ${file}`);
  return toPhoto(c);
}

const inFolder = (folder: string) => list.filter((c) => c.file.startsWith(`${folder}/`)).map(toPhoto);

/** Huecos de foto que el panel puede cambiar (bloque `imagenes` de `web_contenido`). */
export const imageSlots = ["hero", "heroHouse", "about", "aboutHands", "contact"] as const;
export type ImageSlot = (typeof imageSlots)[number];

export const photos = {
  hero: photo("hero/bano-mampara-cristal-luminoso.jpg"),
  heroHouse: photo("hero/casa-mediterranea-ventanales.jpg"),
  about: photo("about/manos-cortando-cristal.jpg"),
  aboutHands: photo("about/manos-cortando-vidrio-guantes.jpg"),
  contact: photo("contact/interior-luminoso-cristal.jpg"),
  process: inFolder("process").sort((a, b) => a.src.localeCompare(b.src)),
};

const slugs: ServiceSlug[] = ["mamparas", "espejos", "cerramientos", "aluminio", "barandillas", "armarios", "domino", "otros"];

export const servicePhotos = Object.fromEntries(
  slugs.map((slug) => {
    const all = inFolder(`services/${slug}`);
    const cover = all.find((p) => p.src.endsWith("/cover.jpg")) ?? all[0];
    return [slug, { cover, gallery: all.filter((p) => p !== cover) }];
  }),
) as Record<ServiceSlug, { cover: Photo; gallery: Photo[] }>;
