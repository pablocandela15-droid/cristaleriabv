"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { WorkLightbox, WorkList } from "@/components/works/works-grid";
import { useWeb } from "@/components/site/web-provider";
import type { AlbumWeb } from "@/lib/web/mezclar";
import { cn } from "@/lib/utils";

const fotos = (n: number) => `${n} ${n === 1 ? "foto" : "fotos"}`;

/**
 * «Books» de fotos del panel: filtro por álbum y, en «Todos», un bloque por
 * álbum con su título y descripción. Cada foto se amplía y se puede pasar a la
 * siguiente del mismo álbum.
 */
export function AlbumsGallery({ albums }: { albums: AlbumWeb[] }) {
  const { services } = useWeb();
  const [active, setActive] = useState<string>("todos");
  const [zoom, setZoom] = useState<{ album: string; index: number } | null>(null);
  const shown = active === "todos" ? albums : albums.filter((a) => a.id === active);
  const zoomAlbum = albums.find((a) => a.id === zoom?.album);

  return (
    <div>
      {albums.length > 1 && (
        <div role="tablist" aria-label="Filtrar por álbum" className="mb-10 flex flex-wrap gap-2">
          {[{ id: "todos", title: "Todos", cover: null, count: albums.reduce((n, a) => n + a.works.length, 0) }, ...albums.map((a) => ({ id: a.id, title: a.title, cover: a.cover, count: a.works.length }))].map(
            (t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={active === t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border text-sm transition-colors",
                  t.cover ? "py-1 pl-1 pr-4" : "px-4",
                  active === t.id ? "border-navy-900 bg-navy-900 text-cream-100" : "border-navy-900/15 bg-cream-50 text-navy-900 hover:border-navy-900/40",
                )}
              >
                {t.cover && (
                  <span className="relative size-8 shrink-0 overflow-hidden rounded-full">
                    <Image src={t.cover.src} alt="" fill sizes="32px" className="object-cover" />
                  </span>
                )}
                {t.title}
                <span className={cn("text-xs", active === t.id ? "text-cream-100/60" : "text-ink-soft")}>{t.count}</span>
              </button>
            ),
          )}
        </div>
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        {shown.map((album) => {
          const service = album.service ? services.find((s) => s.slug === album.service) : undefined;
          return (
            <motion.section
              key={album.id}
              id={`book-${album.slug}`}
              aria-labelledby={`book-${album.slug}-titulo`}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="scroll-mt-28 [&+&]:mt-16 sm:[&+&]:mt-20"
            >
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <span className="eyebrow">Book · {fotos(album.works.length)}</span>
                  <h2 id={`book-${album.slug}-titulo`} className="mt-3 text-[clamp(1.75rem,3.2vw,2.5rem)] font-medium leading-tight">
                    {album.title}
                  </h2>
                  {album.description && <p className="mt-3 whitespace-pre-line text-ink-soft">{album.description}</p>}
                </div>
                {service && (
                  <Link
                    href={`/servicios/${service.slug}`}
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-navy-900 underline-offset-4 hover:underline"
                  >
                    Ver servicio de {service.name.toLowerCase()} <ArrowUpRight aria-hidden className="size-4" />
                  </Link>
                )}
              </div>
              <WorkList works={album.works} onZoom={(index) => setZoom({ album: album.id, index })} />
            </motion.section>
          );
        })}
      </AnimatePresence>

      <WorkLightbox
        works={zoomAlbum?.works ?? []}
        index={zoomAlbum ? (zoom?.index ?? null) : null}
        onIndex={(index) => setZoom(index == null || !zoomAlbum ? null : { album: zoomAlbum.id, index })}
        caption={zoomAlbum?.title}
      />
    </div>
  );
}
