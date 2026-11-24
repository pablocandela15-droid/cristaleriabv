import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import localFont from "next/font/local";
import { mapsLink, type Site } from "@/content/site";
import { leerTarifas, obtenerWeb } from "@/lib/web/datos";
import { Analytics } from "@vercel/analytics/next";
import { WebProvider } from "@/components/site/web-provider";
import { Providers } from "./providers";
import "./globals.css";

const cabinet = localFont({
  variable: "--font-cabinet",
  display: "swap",
  src: [
    { path: "../fonts/CabinetGrotesk-400.woff2", weight: "400" },
    { path: "../fonts/CabinetGrotesk-500.woff2", weight: "500" },
    { path: "../fonts/CabinetGrotesk-700.woff2", weight: "700" },
    { path: "../fonts/CabinetGrotesk-800.woff2", weight: "800" },
  ],
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { site, photos } = await obtenerWeb();
  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} | Cristaleros en Crevillente y el Baix Vinalopó`,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    keywords: [
      "cristalería",
      "mamparas",
      "espejos",
      "cerramientos",
      "aluminio",
      "barandillas de vidrio",
      "Crevillente",
      "Baix Vinalopó",
      "Elche",
      "cristaleros",
    ],
    openGraph: {
      type: "website",
      locale: "es_ES",
      siteName: site.name,
      title: `${site.name} | Expertos en vidrio y aluminio`,
      description: site.description,
      images: [{ url: photos.hero.src, alt: photos.hero.alt }],
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a2a48",
};

/** Datos estructurados del negocio (con los datos de contacto editables desde el panel). */
function businessJsonLd(site: Site) {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.phones[0]?.tel,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressRegion: site.address.province,
      addressCountry: "ES",
    },
    geo: { "@type": "GeoCoordinates", latitude: site.address.lat, longitude: site.address.lon },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "13:30" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "16:00", closes: "19:30" },
    ],
    areaServed: "Baix Vinalopó, Alicante",
    hasMap: mapsLink(site),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [{ site, services, faqs }, tarifas] = await Promise.all([obtenerWeb(), leerTarifas()]);
  return (
    // data-scroll-behavior="smooth": el scroll suave solo se usa dentro de la página;
    // al cambiar de página Next.js lo desactiva y la nueva página empieza arriba.
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${cabinet.variable} ${instrument.variable} ${fraunces.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd(site)).replace(/</g, "\\u003c") }}
        />
        <WebProvider value={{ site, services, faqs, tarifas }}>
          <Providers>{children}</Providers>
        </WebProvider>
        {/* Vercel Web Analytics (visitas sin cookies) para Tráfico web: solo en Vercel, donde existe /_vercel/insights. */}
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
