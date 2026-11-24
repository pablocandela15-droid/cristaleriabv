import { Images } from "lucide-react";
import { TextReveal } from "@/components/motion/text-reveal";
import { Reveal } from "@/components/motion/reveal";
import { CtaLink } from "@/components/site/cta";
import { WorksGrid } from "@/components/works/works-grid";
import { featuredWorks, type Work } from "@/content/works";

/**
 * «Espacios que se llenan de luz» en la portada: las fotos ★ del panel o, si no hay, la primera de cada tipo de
 * trabajo (ver `seleccionPortada` en src/lib/web/mezclar.ts); sin fotos del panel, la selección del código.
 */
export function WorksPreview({ works = featuredWorks }: { works?: Work[] }) {
  return (
    <section className="py-16 sm:py-24 lg:py-28">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center">Trabajos</span>
          <TextReveal
            parts={["Espacios que", { em: "se llenan" }, "de luz"]}
            className="mt-4 text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.06]"
          />
          <Reveal delay={0.15} className="mt-8 flex justify-center">
            <CtaLink href="/trabajos" icon={<Images />}>
              Ver todos los trabajos
            </CtaLink>
          </Reveal>
        </div>
        <Reveal className="mt-14">
          <WorksGrid works={works} filter={false} cols={2} />
        </Reveal>
      </div>
    </section>
  );
}
