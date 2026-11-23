import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { ServiceIcon } from "@/components/site/service-icon";
import { servicePhotos } from "@/content/images";
import { obtenerWeb } from "@/lib/web/datos";
import { cn } from "@/lib/utils";

/** Tarjetas de servicio con imagen y barra de vidrio esmerilado (como Formis). */
export async function ServicesGrid({ withHeading = true }: { withHeading?: boolean }) {
  const { services } = await obtenerWeb();
  return (
    <section id="servicios" className="scroll-mt-24 py-16 sm:py-24 lg:py-28">
      <div className="container-site">
        {withHeading && (
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow justify-center">Qué hacemos</span>
            <TextReveal
              parts={["Todo en cristal.", { em: "Un mismo" }, "estándar."]}
              className="mt-4 text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.06]"
            />
            <p className="mt-5 text-lg text-ink-soft">
              Ocho especialidades, un único equipo. Fabricamos a medida en nuestro taller y lo instalamos nosotros.
            </p>
          </div>
        )}

        {/* Móvil: carrusel horizontal deslizable. Tablet/escritorio: cuadrícula. */}
        <p className={cn("flex items-center gap-1.5 text-sm text-ink-soft sm:hidden", withHeading ? "mt-10" : "mt-2")}>
          Desliza para ver los 8 servicios <ArrowRight aria-hidden className="size-4" />
        </p>
        <RevealGroup
          className={cn(
            "-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden",
            withHeading && "sm:mt-14",
          )}
          stagger={0.06}
        >
          {services.map((s, i) => {
            const photo = servicePhotos[s.slug].cover;
            // 4 columnas: fila 1 = 2 grandes, fila 2 = 4 pequeñas, fila 3 = 2 grandes.
            const large = i < 2 || i >= 6;
            return (
              <RevealItem key={s.slug} className={cn("w-[82%] shrink-0 snap-start sm:w-auto", large && "lg:col-span-2")}>
                <Link
                  href={`/servicios/${s.slug}`}
                  className={cn(
                    "group relative block overflow-hidden rounded-[22px] bg-navy-900 shadow-[0_24px_50px_-30px_rgb(6_26_46/0.6)]",
                    large ? "aspect-[4/5] sm:aspect-[4/3] lg:aspect-[16/10]" : "aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]",
                  )}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes={large ? "(min-width: 1024px) 600px, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"}
                    className="object-cover transition-transform duration-[1.2s] ease-glass group-hover:scale-[1.06]"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-950/55 via-transparent to-transparent" />
                  <div className="glass-dark absolute inset-x-3 bottom-3 rounded-2xl p-4 text-cream-100">
                    <div className="flex items-center gap-2.5">
                      <ServiceIcon slug={s.slug} className="size-5 text-cream-200" />
                      <h3 className="font-heading text-xl font-medium text-cream-100">{s.name}</h3>
                    </div>
                    <p className="mt-1 text-sm text-cream-100/75">{s.short}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-cream-200">
                      Ver servicio
                      <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
