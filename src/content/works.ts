import { servicePhotos, type Photo } from "@/content/images";
import { services, type ServiceSlug } from "@/content/services";

/**
 * Galería de trabajos por defecto (fotos de stock de referencia). Con Supabase,
 * los «books» de fotos del panel (`web_albumes` / `web_fotos`) la sustituyen en
 * /trabajos, en la galería de cada servicio y en la portada (fotos destacadas).
 * `category` es null para fotos de álbumes sin servicio asociado.
 */
export type Work = { title: string; category: ServiceSlug | null; photo: Photo };

const titles: Record<string, string> = {
  "mamparas/cover.jpg": "Mampara de ducha con tirador negro",
  "mamparas/mampara-marmol-banera.jpg": "Mampara sin perfiles en baño de mármol",
  "mamparas/mampara-perfil-negro.jpg": "Mampara con perfilería negra",
  "espejos/cover.jpg": "Pared de espejo en recibidor",
  "espejos/espejo-bano-lavabos.jpg": "Espejo panorámico de baño",
  "espejos/espejo-recibidor-blanco.jpg": "Espejo de recibidor a medida",
  "cerramientos/cover.jpg": "Cerramiento acristalado con techo de cristal",
  "cerramientos/galeria-acristalada-luminosa.jpg": "Galería acristalada",
  "cerramientos/cerramiento-jardin-exterior.jpg": "Porche acristalado",
  "aluminio/cover.jpg": "Corredera de aluminio de gran formato",
  "aluminio/corredera-dormitorio-jardin.jpg": "Corredera negra de suelo a techo",
  "aluminio/ventanales-casa-piedra.jpg": "Ventanales correderos de aluminio",
  "barandillas/cover.jpg": "Barandilla de vidrio en escalera",
  "barandillas/escalera-interior-barandilla-vidrio.jpg": "Escalera interior con barandilla de vidrio",
  "barandillas/balcones-barandilla-cristal.jpg": "Balcones con barandilla de cristal",
  "armarios/cover.jpg": "Vestidor con puertas de cristal",
  "armarios/vestidor-puertas-espejo.jpg": "Vestidor con puertas de espejo",
  "armarios/armario-puertas-cristal-pasillo.jpg": "Armario con puertas de vidrio mate",
  "domino/cover.jpg": "Tabique de vidrio con perfil negro",
  "domino/cocina-tabique-acero-vidrio.jpg": "Correderas de vidrio junto a la cocina",
  "domino/puerta-vidrio-estriado-verde.jpg": "Puerta con vidrio estriado",
  "otros/cover.jpg": "Cristal cortado a medida",
  "otros/piezas-vidrio-cortadas.jpg": "Piezas de vidrio a medida",
  "otros/mesa-comedor-cristal.jpg": "Tablero de cristal para mesa",
};

const titleFor = (src: string) => titles[src.replace("/images/services/", "")] ?? "Trabajo de cristalería";

export const works: Work[] = services.flatMap((s) => {
  const p = servicePhotos[s.slug];
  return [p.cover, ...p.gallery].map((photo) => ({ title: titleFor(photo.src), category: s.slug, photo }));
});

/** Selección para la home (una por categoría principal). */
export const featuredWorks: Work[] = (["mamparas", "cerramientos", "barandillas", "armarios"] as ServiceSlug[]).map(
  (slug) => works.find((w) => w.category === slug && !w.photo.src.endsWith("cover.jpg"))!,
);
