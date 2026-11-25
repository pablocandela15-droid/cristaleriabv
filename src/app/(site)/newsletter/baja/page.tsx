import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { AvisoEstado } from "@/components/newsletter/aviso-estado";
import { DarseDeBaja } from "@/components/newsletter/darse-de-baja";

// El enlace lleva un token personal (?t=): fuera de buscadores y sin mandarlo como referente a otras webs.
export const metadata: Metadata = {
  title: "Darse de baja de la newsletter",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  alternates: { canonical: "/newsletter/baja" },
};

/** Página del enlace de baja de cada correo de la newsletter. */
export default function NewsletterBajaPage() {
  return (
    <>
      <PageHeader eyebrow="Newsletter" title={["Darse de", { em: "baja" }]} crumbs={[{ href: "/newsletter/baja", label: "Newsletter" }]} />
      <section className="pb-16 sm:pb-24 lg:pb-28">
        <div className="container-site">
          <Suspense fallback={<AvisoEstado tono="cargando" titulo="Comprobando el enlace…" />}>
            <DarseDeBaja />
          </Suspense>
        </div>
      </section>
    </>
  );
}
