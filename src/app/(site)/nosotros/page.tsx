import type { Metadata } from "next";
import Image from "next/image";
import { Award, Check, Gem, MapPin, Smile } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { NumberTicker } from "@/components/motion/number-ticker";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { ContactCta } from "@/components/home/contact-cta";
import { site as defaultSite } from "@/content/site";
import { obtenerWeb } from "@/lib/web/datos";
import { team } from "@/content/team";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description: `${defaultSite.name}: más de 30 años de experiencia en cristalería, mamparas, espejos y cerramientos en el Baix Vinalopó. Conoce al equipo.`,
  alternates: { canonical: "/nosotros" },
};

const why = [
  "Presupuestos transparentes y sin sorpresas",
  "Asesoramiento gratuito y visita técnica gratis en Crevillente",
  "Garantía en todos nuestros trabajos",
  "Plazos de entrega cumplidos",
];

const pillars = [
  { icon: Award, title: "Más de 30 años", text: "De experiencia en el sector de la cristalería." },
  { icon: MapPin, title: "Baix Vinalopó", text: "Servicio local con conocimiento de la zona." },
  { icon: Gem, title: "Calidad garantizada", text: "Materiales premium y acabados profesionales." },
  { icon: Smile, title: "Clientes satisfechos", text: "Miles de proyectos completados con éxito." },
];

const initials = (name: string) =>
  name
    .replace(/[«»"]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

export default async function NosotrosPage() {
  const { site, photos } = await obtenerWeb();
  return (
    <>
      <PageHeader
        eyebrow="Sobre nosotros"
        title={["Especialistas en cristalería con una", { em: "trayectoria" }, "consolidada"]}
        intro="Somos un equipo de cristaleros del Baix Vinalopó con taller propio en Crevillente."
        crumbs={[{ href: "/nosotros", label: "Nosotros" }]}
      />

      <section className="pb-16 sm:pb-24 lg:pb-28">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal y={30} className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[26px] shadow-[0_40px_80px_-40px_rgb(6_26_46/0.55)]">
              <Image src={photos.aboutHands.src} alt={photos.aboutHands.alt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-6 right-4 rounded-2xl border border-gold-400/50 bg-navy-900 p-5 text-cream-100 shadow-layered sm:right-8">
              <p className="font-heading text-5xl font-medium text-cream-200">
                +<NumberTicker value={site.yearsExperience} />
              </p>
              <p className="text-sm text-cream-100/75">años de oficio</p>
            </div>
          </Reveal>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <Reveal>
              <p>
                En {site.name} llevamos más de tres décadas ofreciendo soluciones integrales en cristalería, mamparas, espejos y
                cerramientos de aluminio.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p>
                Nuestro compromiso con la calidad y el servicio personalizado nos ha convertido en la referencia en la zona.
                Trabajamos con los mejores materiales del mercado y contamos con un equipo de profesionales altamente
                cualificados.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p>
                Desde el asesoramiento inicial hasta la instalación final, acompañamos a nuestros clientes en cada paso del
                proceso, garantizando resultados excepcionales y una experiencia sin preocupaciones.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="rounded-2xl border border-navy-900/10 bg-cream-50 p-6">
                <h2 className="text-2xl font-medium">¿Por qué elegirnos?</h2>
                <ul className="mt-4 space-y-2.5 text-[16px] text-ink">
                  {why.map((w) => (
                    <li key={w} className="flex items-start gap-3">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-gold-600" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-navy-950 py-20 text-cream-100 sm:py-24">
        <div className="container-site">
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <RevealItem key={p.title}>
                <div className="glass-dark h-full rounded-2xl p-6">
                  <p.icon aria-hidden className="size-6 text-gold-300" />
                  <h3 className="mt-4 font-heading text-xl font-medium text-cream-100">{p.title}</h3>
                  <p className="mt-2 text-[15px] text-cream-100/70">{p.text}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="py-16 sm:py-24 lg:py-28">
        <div className="container-site">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow justify-center">Nuestro equipo</span>
            <TextReveal
              parts={["Las manos detrás de", { em: "cada" }, "trabajo"]}
              className="mt-4 text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.06]"
            />
            <p className="mt-4 text-lg text-ink-soft">Profesionales comprometidos con la excelencia en cada trabajo.</p>
          </div>
          <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
            {team.map((m) => (
              <RevealItem key={m.name}>
                <article className="group h-full rounded-2xl border border-navy-900/10 bg-cream-50 p-6 transition-shadow hover:shadow-[0_24px_50px_-30px_rgb(6_26_46/0.5)]">
                  <div className="flex items-center gap-4">
                    <span className="relative grid size-16 place-items-center overflow-hidden rounded-2xl bg-navy-900 font-heading text-2xl font-medium text-cream-200">
                      {initials(m.name)}
                      <span aria-hidden className="glass-shine -translate-x-[120%] transition-transform duration-700 group-hover:translate-x-[320%]" />
                    </span>
                    <div>
                      <h3 className="font-heading text-xl font-medium">{m.name}</h3>
                      <p className="text-sm font-medium text-gold-600">{m.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{m.bio}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <ContactCta />
    </>
  );
}
