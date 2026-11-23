import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Calculator, Check, Phone } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { CtaLink } from "@/components/site/cta";
import { ServiceIcon } from "@/components/site/service-icon";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { WorksGrid } from "@/components/works/works-grid";
import { FaqSection } from "@/components/home/faq-section";
import { servicePhotos } from "@/content/images";
import { services } from "@/content/services";
import { categories } from "@/lib/pricing/categories";
import { resolverTarifas } from "@/lib/pricing/tarifas";
import { leerTarifas, obtenerWeb } from "@/lib/web/datos";
import { esServicio, faqsPorIndice, trabajosDeServicio } from "@/lib/web/mezclar";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: PageProps<"/servicios/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { services } = await obtenerWeb();
  const s = services.find((x) => x.slug === slug);
  if (!s) return {};
  return {
    title: s.seoTitle,
    description: s.seoDescription,
    alternates: { canonical: `/servicios/${s.slug}` },
    openGraph: { images: [servicePhotos[s.slug].cover.src] },
  };
}

/** Preguntas frecuentes más útiles para cada servicio. */
const faqFor: Record<string, number[]> = {
  mamparas: [2, 4, 0, 9],
  espejos: [4, 0, 5, 9],
  cerramientos: [1, 0, 7, 9],
  aluminio: [1, 0, 3, 9],
  barandillas: [6, 2, 3, 9],
  armarios: [0, 4, 3, 9],
  domino: [1, 6, 0, 9],
  otros: [1, 6, 5, 8],
};

/**
 * El contenido depende del slug (dato de URL), así que va dentro de <Suspense>:
 * la estructura común se prefetchea al instante y cada servicio, que está
 * prerenderizado con generateStaticParams, entra justo después.
 */
export default function ServicePage(props: PageProps<"/servicios/[slug]">) {
  return (
    <Suspense fallback={<ServiceSkeleton />}>
      <ServiceContent params={props.params} />
    </Suspense>
  );
}

function ServiceSkeleton() {
  return (
    <div className="container-site animate-pulse pb-24 pt-14" aria-hidden>
      <div className="h-4 w-40 rounded bg-navy-900/10" />
      <div className="mt-8 h-4 w-24 rounded bg-gold-400/30" />
      <div className="mt-5 h-14 max-w-xl rounded-xl bg-navy-900/10" />
      <div className="mt-4 h-5 max-w-2xl rounded bg-navy-900/5" />
      <div className="mt-2 h-5 max-w-xl rounded bg-navy-900/5" />
      <div className="mt-12 aspect-[4/3] max-w-3xl rounded-[26px] bg-navy-900/5" />
    </div>
  );
}

async function ServiceContent({ params }: { params: PageProps<"/servicios/[slug]">["params"] }) {
  const { slug } = await params;
  if (!esServicio(slug)) notFound();
  const [web, tarifas] = await Promise.all([obtenerWeb(), leerTarifas()]);
  const { site, services, faqs } = web;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();
  const photos = servicePhotos[service.slug];
  const others = services.filter((s) => s.slug !== service.slug);
  // Si la categoría está oculta en la calculadora, el botón lleva a la calculadora sin preseleccionar.
  const enCalculadora = resolverTarifas(categories, tarifas).categorias[service.slug]?.activo !== false;
  const phone = site.phones[0];

  return (
    <>
      <PageHeader
        eyebrow={service.name}
        title={[service.headline]}
        intro={service.intro}
        crumbs={[
          { href: "/servicios", label: "Servicios" },
          { href: `/servicios/${service.slug}`, label: service.name },
        ]}
      >
        <Reveal delay={0.3} className="mt-8 flex flex-wrap gap-3">
          <CtaLink href={enCalculadora ? `/presupuesto?servicio=${service.slug}` : "/presupuesto"} icon={<Calculator />}>
            Calcular presupuesto
          </CtaLink>
          {phone && (
            <CtaLink href={`tel:${phone.tel}`} variant="outline" icon={<Phone />}>
              Llamar al {phone.display}
            </CtaLink>
          )}
        </Reveal>
      </PageHeader>

      <section className="pb-20 sm:pb-24">
        <div className="container-site grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <Reveal y={30}>
            <div className="group relative aspect-[4/3] overflow-hidden rounded-[22px] shadow-[0_40px_80px_-40px_rgb(6_26_46/0.55)] sm:rounded-[26px]">
              <Image
                src={photos.cover.src}
                alt={photos.cover.alt}
                fill
                priority
                sizes="(min-width: 1024px) 680px, 100vw"
                className="object-cover transition-transform duration-[1.4s] ease-glass group-hover:scale-[1.04]"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="glass-shine animate-shine" />
              </div>
            </div>
          </Reveal>

          <div>
            <h2 className="text-3xl font-medium">Qué incluye</h2>
            <RevealGroup className="mt-6 space-y-3">
              {service.features.map((f) => (
                <RevealItem key={f}>
                  <p className="flex items-start gap-3 rounded-xl border border-navy-900/8 bg-cream-50 p-4 text-[15px] text-ink">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-navy-900 text-cream-200">
                      <Check aria-hidden className="size-3" />
                    </span>
                    {f}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
            <div className="mt-8">
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-ink-soft">Ideal para</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {service.ideas.map((i) => (
                  <li key={i} className="rounded-full border border-navy-900/15 bg-cream-50 px-3.5 py-1.5 text-sm text-navy-900">
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-navy-950 py-20 text-cream-100 sm:py-24">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="eyebrow text-gold-300">Inspiración</span>
              <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-medium text-cream-100">Ideas de {service.name.toLowerCase()}</h2>
            </div>
            <Link href="/trabajos" className="inline-flex min-h-11 items-center gap-2 text-cream-200 underline-offset-4 hover:underline">
              Ver todos los trabajos <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <div className="mt-10 [&_article]:border-cream-200/10 [&_article]:bg-navy-900 [&_h3]:text-cream-100">
            <WorksGrid works={trabajosDeServicio(web, service.slug)} filter={false} />
          </div>
        </div>
      </section>

      <FaqSection items={faqsPorIndice(faqs, faqFor[service.slug] ?? [0, 1, 2, 9])} />

      <section className="pb-16 sm:pb-24 lg:pb-28">
        <div className="container-site">
          <h2 className="text-2xl font-medium sm:text-3xl">Otros servicios</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((s) => (
              <Link
                key={s.slug}
                href={`/servicios/${s.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-navy-900/10 bg-cream-50 p-4 transition-colors hover:border-navy-900/30"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-900 text-cream-200">
                  <ServiceIcon slug={s.slug} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-navy-900">{s.name}</span>
                  <span className="block truncate text-sm text-ink-soft">{s.short}</span>
                </span>
                <ArrowRight aria-hidden className="size-4 text-navy-900 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
