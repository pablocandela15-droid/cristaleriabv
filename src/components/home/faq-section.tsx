"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, Plus } from "lucide-react";
import { TextReveal } from "@/components/motion/text-reveal";
import { Reveal } from "@/components/motion/reveal";
import type { Faq } from "@/content/faq";
import { whatsappLink } from "@/content/site";
import { useWeb } from "@/components/site/web-provider";
import { cn } from "@/lib/utils";

/** Preguntas frecuentes en acordeón (estilo Formis: título a la izquierda, tarjetas a la derecha). */
export function FaqSection({ items, title = true }: { items?: Faq[]; title?: boolean }) {
  const web = useWeb();
  const list = items ?? web.faqs;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 py-16 sm:py-24 lg:py-28">
      <div className="container-site grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        {title && (
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <span className="eyebrow">Preguntas frecuentes</span>
            </Reveal>
            <TextReveal
              parts={["Dudas,", { em: "resueltas." }]}
              className="mt-4 text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.06]"
            />
            <Reveal delay={0.15}>
              <p className="mt-5 max-w-sm text-ink-soft">¿No encuentras tu respuesta? Escríbenos y te contestamos enseguida.</p>
              <a
                href={whatsappLink("Hola, tengo una duda:", web.site.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-11 items-center gap-2 font-medium text-navy-900 underline underline-offset-4"
              >
                <MessageCircle aria-hidden className="size-4 text-whatsapp" /> Preguntar por WhatsApp
              </a>
            </Reveal>
          </div>
        )}

        <div className="space-y-3">
          {list.map((f, i) => {
            const isOpen = open === i;
            const id = `faq-${i}`;
            return (
              <div
                key={f.q}
                className={cn(
                  "rounded-2xl border bg-cream-50 transition-shadow duration-300",
                  isOpen ? "border-navy-900/15 shadow-[0_20px_40px_-28px_rgb(6_26_46/0.45)]" : "border-navy-900/8",
                )}
              >
                <h3 className="font-sans text-base">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${id}-panel`}
                    id={`${id}-button`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[16px] font-medium text-navy-900"
                  >
                    {f.q}
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full border transition-all duration-300",
                        isOpen ? "rotate-45 border-navy-900 bg-navy-900 text-cream-100" : "border-navy-900/25 text-navy-900",
                      )}
                    >
                      <Plus aria-hidden className="size-4" />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`${id}-panel`}
                      role="region"
                      aria-labelledby={`${id}-button`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
