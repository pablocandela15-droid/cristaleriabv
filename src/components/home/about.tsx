import Image from "next/image";
import { BookOpen } from "lucide-react";
import { NumberTicker } from "@/components/motion/number-ticker";
import { Reveal } from "@/components/motion/reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { CtaLink } from "@/components/site/cta";
import { obtenerWeb } from "@/lib/web/datos";

export async function About() {
  const { site, photos } = await obtenerWeb();
  return (
    <section className="py-16 sm:py-24 lg:py-28">
      <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <Reveal>
            <span className="eyebrow">Quiénes somos</span>
          </Reveal>
          <TextReveal
            parts={["Tres décadas trabajando el", { em: "vidrio" }, "en el Baix Vinalopó"]}
            className="mt-4 max-w-[16ch] text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.06]"
          />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              En {site.name} llevamos más de tres décadas ofreciendo soluciones integrales en cristalería, mamparas,
              espejos y cerramientos de aluminio. Desde el asesoramiento inicial hasta la instalación final, te
              acompañamos en cada paso con un equipo de profesionales cualificados.
            </p>
          </Reveal>
          <Reveal delay={0.3} className="mt-8">
            <CtaLink href="/nosotros" icon={<BookOpen />}>
              Conoce nuestra historia
            </CtaLink>
          </Reveal>
        </div>

        <Reveal y={40} className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] shadow-[0_30px_60px_-30px_rgb(6_26_46/0.5)]">
            <Image
              src={photos.about.src}
              alt={photos.about.alt}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover transition-transform duration-[1.6s] ease-glass hover:scale-[1.04]"
            />
            <div className="glass absolute left-4 top-4 rounded-xl px-3.5 py-2 text-navy-950">
              <span className="text-xs font-medium uppercase tracking-[0.14em]">Taller propio</span>
              <span className="ml-2 font-heading text-xl font-medium">Crevillente</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gold-400/50 bg-navy-900 p-5 text-cream-100 shadow-layered sm:p-6">
              <p className="font-heading text-5xl font-medium text-cream-200 sm:text-6xl">
                +<NumberTicker value={site.yearsExperience} />
              </p>
              <p className="mt-2 text-sm text-cream-100/80">Años de experiencia</p>
            </div>
            <div className="rounded-2xl border border-gold-400/50 bg-navy-900 p-5 text-cream-100 shadow-layered sm:p-6">
              <p className="font-heading text-5xl font-medium text-cream-200 sm:text-6xl">
                <NumberTicker value={8} />
              </p>
              <p className="mt-2 text-sm text-cream-100/80">Especialidades en vidrio y aluminio</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
