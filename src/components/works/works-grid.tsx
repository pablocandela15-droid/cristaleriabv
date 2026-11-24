"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useWeb } from "@/components/site/web-provider";
import type { ServiceSlug } from "@/content/services";
import type { Work } from "@/content/works";
import { cn } from "@/lib/utils";
import { registrar } from "@/lib/actividad";

function useServiceName() {
  const { services } = useWeb();
  return (slug: ServiceSlug | null) => (slug ? (services.find((s) => s.slug === slug)?.name ?? slug) : "");
}

/** Tarjeta de un trabajo: foto que se amplía al pulsar, etiqueta y enlace al servicio. */
export function WorkCard({ work, badge, onZoom }: { work: Work; badge?: string; onZoom: () => void }) {
  const nameOf = useServiceName();
  const label = badge ?? nameOf(work.category);
  return (
    <article className="group overflow-hidden rounded-[20px] border border-navy-900/8 bg-cream-50 shadow-[0_20px_40px_-30px_rgb(6_26_46/0.5)]">
      <button
        type="button"
        onClick={onZoom}
        className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden"
        aria-label={`Ampliar: ${work.title}`}
      >
        <Image
          src={work.photo.src}
          alt={work.photo.alt}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-glass group-hover:scale-105"
        />
        {label && <span className="glass absolute left-3 top-3 rounded-md px-2 py-1 text-xs font-medium text-navy-950">{label}</span>}
        <span className="glass absolute right-3 top-3 grid size-9 place-items-center rounded-full text-navy-950 opacity-0 transition-opacity group-hover:opacity-100">
          <Expand aria-hidden className="size-4" />
        </span>
      </button>
      <div className="flex items-center justify-between gap-4 p-4">
        <h3 className="font-heading text-lg font-medium leading-snug">{work.title}</h3>
        {work.category && (
          <Link
            href={`/servicios/${work.category}`}
            aria-label={`Ver servicio de ${nameOf(work.category)}`}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-navy-900/10 bg-white text-navy-900 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

/** Rejilla animada de trabajos (entra y sale al filtrar). */
export function WorkList({
  works,
  cols = 3,
  badge,
  onZoom,
}: {
  works: Work[];
  cols?: 2 | 3;
  badge?: string;
  onZoom: (index: number) => void;
}) {
  return (
    <LayoutGroup>
      <motion.ul layout className={cn("grid gap-5 sm:grid-cols-2", cols === 3 && "lg:grid-cols-3")}>
        <AnimatePresence mode="popLayout">
          {works.map((w, i) => (
            <motion.li
              key={w.photo.src}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <WorkCard work={w} badge={badge} onZoom={() => onZoom(i)} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </LayoutGroup>
  );
}

/** Ampliación de una foto, con flechas (y teclado ← →) para pasar a la anterior o la siguiente. */
export function WorkLightbox({
  works,
  index,
  onIndex,
  caption,
}: {
  works: Work[];
  index: number | null;
  onIndex: (index: number | null) => void;
  caption?: string;
}) {
  const nameOf = useServiceName();
  const zoom = index != null ? works[index] : undefined;
  const many = works.length > 1;
  const go = (delta: number) => index != null && onIndex((index + delta + works.length) % works.length);

  // Actividad para Logs del panel: qué trabajos (book o servicio) se miran, sin nada del visitante.
  const anterior = useRef<number | null>(null);
  useEffect(() => {
    const previo = anterior.current;
    anterior.current = index;
    if (index === previo) return;
    const trabajo = index != null ? works[index] : previo != null ? works[previo] : undefined;
    const objetivo = caption ?? trabajo?.category ?? undefined;
    const accion =
      index == null ? "cerrar" : previo == null ? "abrir" : index === (previo + 1) % works.length ? "siguiente" : "anterior";
    registrar("media", { accion, objetivo, props: { medio: "foto", posicion: index != null ? index + 1 : undefined } });
  }, [index, works, caption]);

  useEffect(() => {
    if (index == null || !many) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % works.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + works.length) % works.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, many, works.length, onIndex]);

  return (
    <Dialog open={Boolean(zoom)} onOpenChange={(o) => !o && onIndex(null)}>
      <DialogContent className="overflow-hidden border-none bg-navy-950 p-0 sm:max-w-5xl">
        <DialogTitle className="sr-only">{zoom?.title}</DialogTitle>
        {zoom && (
          <figure>
            <div className="relative aspect-[3/2] w-full">
              <Image src={zoom.photo.src} alt={zoom.photo.alt} fill sizes="(min-width: 1024px) 1024px, 100vw" className="object-contain" />
              {many && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Foto anterior"
                    className="glass absolute left-3 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-navy-950 transition-transform hover:scale-105"
                  >
                    <ChevronLeft aria-hidden className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Foto siguiente"
                    className="glass absolute right-3 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-navy-950 transition-transform hover:scale-105"
                  >
                    <ChevronRight aria-hidden className="size-5" />
                  </button>
                </>
              )}
            </div>
            <figcaption className="flex items-center justify-between gap-4 px-5 py-4 text-cream-100">
              <span className="font-heading text-lg">{zoom.title}</span>
              <span className="shrink-0 text-sm text-cream-100/60">
                {caption ?? nameOf(zoom.category)}
                {many && index != null && ` · ${index + 1}/${works.length}`}
              </span>
            </figcaption>
          </figure>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Galería de trabajos con filtro por categoría y ampliación de imagen. */
export function WorksGrid({
  works,
  filter = true,
  initial = "todos",
  cols = 3,
}: {
  works: Work[];
  filter?: boolean;
  initial?: ServiceSlug | "todos";
  cols?: 2 | 3;
}) {
  const { services } = useWeb();
  const nameOf = useServiceName();
  const [active, setActive] = useState<ServiceSlug | "todos">(initial);
  const [zoom, setZoom] = useState<number | null>(null);
  const shown = active === "todos" ? works : works.filter((w) => w.category === active);

  return (
    <div>
      {filter && (
        <div role="tablist" aria-label="Filtrar trabajos" className="mb-8 flex flex-wrap gap-2">
          {(["todos", ...services.map((s) => s.slug)] as const).map((slug) => (
            <button
              key={slug}
              role="tab"
              aria-selected={active === slug}
              onClick={() => setActive(slug)}
              className={cn(
                "min-h-11 cursor-pointer rounded-full border px-4 text-sm transition-colors",
                active === slug ? "border-navy-900 bg-navy-900 text-cream-100" : "border-navy-900/15 bg-cream-50 text-navy-900 hover:border-navy-900/40",
              )}
            >
              {slug === "todos" ? "Todos" : nameOf(slug)}
            </button>
          ))}
        </div>
      )}

      <WorkList works={shown} cols={cols} onZoom={setZoom} />
      <WorkLightbox works={shown} index={zoom} onIndex={setZoom} />
    </div>
  );
}
