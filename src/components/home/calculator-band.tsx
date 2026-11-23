"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NumberTicker } from "@/components/motion/number-ticker";
import { Reveal } from "@/components/motion/reveal";
import { ServiceIcon } from "@/components/site/service-icon";
import { useWeb } from "@/components/site/web-provider";
import type { ServiceSlug } from "@/content/services";
import type { CategoryId } from "@/lib/pricing/categories";
import { usePricing } from "@/lib/pricing/use-pricing";
import { cn } from "@/lib/utils";

/** Ejemplos con medidas habituales para mostrar el orden de precio de cada servicio. */
const examples: { id: CategoryId; label: string; values: Record<string, unknown> }[] = [
  { id: "mamparas", label: "Mampara frontal de 120 cm", values: { ancho: 120 } },
  { id: "espejos", label: "Espejo de baño de 100 × 80 cm", values: { ancho: 100, alto: 80 } },
  { id: "cerramientos", label: "Cerramiento de 300 × 250 cm", values: { ancho: 300, alto: 250 } },
  { id: "aluminio", label: "Ventana corredera de 150 × 120 cm", values: { ancho: 150, alto: 120 } },
  { id: "barandillas", label: "Barandilla de 4 m de cristal", values: { longitud: 400 } },
  { id: "armarios", label: "Armario de 150 cm, 2 puertas", values: {} },
];

/**
 * Banda de la home que adelanta la calculadora con ejemplos de precio, con las
 * tarifas vigentes (las del panel si las hay). Solo salen las categorías visibles.
 */
export function CalculatorBand() {
  const { services } = useWeb();
  const { precios, categorias } = usePricing();
  const visible = examples.filter((e) => categorias[e.id].activo);
  const [selected, setSelected] = useState<CategoryId>("mamparas");
  const ex = visible.find((e) => e.id === selected) ?? visible[0];
  if (!ex) return null;
  const active = ex.id;
  const def = categorias[active];
  const total = def.quote({ ...def.defaults, ...ex.values } as never, precios).total;

  return (
    <section className="relative overflow-hidden bg-navy-950 py-16 text-cream-100 sm:py-24 lg:py-28">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-0 size-[40rem] rounded-full bg-navy-700/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 size-[28rem] rounded-full bg-gold-400/10 blur-3xl" />
      <div className="container-site relative grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Reveal>
            <span className="eyebrow text-gold-300">Calculadora online</span>
            <h2 className="mt-4 max-w-[15ch] text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.06] text-cream-100">
              Conoce tu precio antes de llamarnos
            </h2>
            <p className="mt-6 max-w-lg text-lg text-cream-100/75">
              Elige el servicio, introduce tus medidas y obtén un presupuesto orientativo al instante. Después, envíanoslo por
              WhatsApp o reserva la visita técnica en un clic.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Ejemplos de precio">
              {visible.map((e) => (
                <button
                  key={e.id}
                  role="tab"
                  aria-selected={e.id === active}
                  onClick={() => setSelected(e.id)}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-all",
                    e.id === active
                      ? "border-cream-200 bg-cream-200 text-navy-900"
                      : "border-cream-200/25 text-cream-100/85 hover:border-cream-200/60",
                  )}
                >
                  <ServiceIcon slug={categorias[e.id].service as ServiceSlug} className="size-4" />
                  {services.find((s) => s.slug === categorias[e.id].service)?.name ?? categorias[e.id].name}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1} y={30}>
          <div className="glass-dark relative overflow-hidden rounded-[28px] p-7 sm:p-9">
            <div aria-hidden className="glass-shine animate-shine opacity-40" />
            <p className="text-xs uppercase tracking-[0.16em] text-cream-200/75">Ejemplo orientativo</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-3 font-heading text-xl text-cream-100 sm:text-2xl"
              >
                {ex.label}
              </motion.p>
            </AnimatePresence>
            <p className="mt-6 font-heading text-6xl font-medium text-cream-200 sm:text-7xl">
              <span className="mr-2 align-middle text-lg font-normal text-cream-100/60">desde</span>
              <NumberTicker value={total} live />
              <span className="ml-1 text-4xl">€</span>
            </p>
            <p className="mt-4 text-sm text-cream-100/60">
              Con las opciones básicas. El precio final depende de los acabados y se confirma tras la visita técnica.
            </p>
            <Link
              href={`/presupuesto?servicio=${active}`}
              className="group mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-cream-200 px-5 font-medium text-navy-900 shadow-layered transition-colors hover:bg-cream-300"
            >
              Calcular el mío
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
