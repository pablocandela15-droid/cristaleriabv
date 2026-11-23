/**
 * Datos del negocio. Son los valores por defecto: con Supabase configurado, el
 * bloque `negocio` de `web_contenido` (editable desde el panel) se mezcla por
 * encima (ver src/lib/web/mezclar.ts). Cualquier cambio aquí se refleja en toda
 * la web mientras el panel no lo sobrescriba.
 */
export type Phone = { label: string; display: string; tel: string };
export type Hours = { days: string; time: string };
export type Address = {
  street: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  lat: number;
  lon: number;
};

export type Site = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  yearsExperience: number;
  url: string;
  phones: Phone[];
  /** Número que recibe las solicitudes por WhatsApp (formato internacional sin +). */
  whatsapp: string;
  email: string;
  address: Address;
  hours: Hours[];
  serviceArea: string;
};

export const site: Site = {
  name: "Cristalería Baix Vinalopó",
  shortName: "Cristalería BV",
  tagline: "Especialistas en cristalería y aluminio",
  description:
    "Especialistas en cristalería, mamparas, espejos, cerramientos y aluminio en el Baix Vinalopó. Más de 30 años de experiencia. Calcula tu presupuesto orientativo online.",
  yearsExperience: 30,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  phones: [
    { label: "Oficina", display: "650 06 63 23", tel: "+34650066323" },
    { label: "Jose Antonio", display: "649 99 40 07", tel: "+34649994007" },
  ],
  whatsapp: "34650066323",
  email: "info@cristaleriabaixvinalopo.es",

  address: {
    street: "C/ Pío XII, 5",
    postalCode: "03330",
    city: "Crevillente",
    province: "Alicante",
    country: "España",
    /** Carrer Pío XII, Crevillent (OpenStreetMap). Origen del cálculo de desplazamiento. */
    lat: 38.24504,
    lon: -0.80694,
  },

  hours: [
    { days: "Lunes a viernes", time: "9:00 – 13:30 y 16:00 – 19:30" },
    { days: "Sábados y domingos", time: "Cerrado" },
  ],

  serviceArea:
    "Baix Vinalopó: Crevillente, Elche, Santa Pola y alrededores. También trabajamos en otras zonas de la provincia de Alicante.",
};

export const mainNav = [
  { href: "/servicios", label: "Servicios" },
  { href: "/presupuesto", label: "Presupuesto" },
  { href: "/trabajos", label: "Trabajos" },
  { href: "/#proceso", label: "Proceso" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;

/** Dirección en una línea: «C/ Pío XII, 5, 03330 Crevillente (Alicante)». */
export const addressLine = (s: Pick<Site, "address"> = site) =>
  `${s.address.street}, ${s.address.postalCode} ${s.address.city} (${s.address.province})`;

export const fullAddress = addressLine(site);

/** Enlace de Google Maps a la dirección. */
export const mapsLink = (s: Pick<Site, "address"> = site) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine(s))}`;

/** Enlace de WhatsApp (al número del negocio, o al que se indique) con el texto ya escrito. */
export function whatsappLink(text?: string, number: string = site.whatsapp) {
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
