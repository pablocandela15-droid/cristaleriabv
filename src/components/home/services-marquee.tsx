import Link from "next/link";
import { Marquee } from "@/components/motion/marquee";
import { ServiceIcon } from "@/components/site/service-icon";
import { obtenerWeb } from "@/lib/web/datos";

export async function ServicesMarquee() {
  const { services } = await obtenerWeb();
  return (
    <section aria-label="Nuestros servicios" className="border-y border-navy-900/10 bg-cream-50/60 py-5">
      <Marquee duration={45} gap="3rem">
        {services.map((s) => (
          <Link
            key={s.slug}
            href={`/servicios/${s.slug}`}
            className="flex items-center gap-3 whitespace-nowrap font-heading text-2xl text-navy-900/80 transition-colors hover:text-navy-900 sm:text-3xl"
          >
            <ServiceIcon slug={s.slug} className="size-6 text-gold-600" />
            {s.name}
          </Link>
        ))}
      </Marquee>
    </section>
  );
}
