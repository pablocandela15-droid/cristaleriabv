import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { AvisoEstado } from "@/components/newsletter/aviso-estado";
import { ConfirmarSuscripcion } from "@/components/newsletter/confirmar-suscripcion";

// El enlace lleva un token personal (?t=): fuera de buscadores y sin mandarlo como referente a otras webs.
export const metadata: Metadata = {
  title: "Confirma tu suscripción",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  alternates: { canonical: "/newsletter/confirmada" },
};

/** Página del enlace del correo de confirmación de la newsletter (doble opt-in). */
export default function NewsletterConfirmadaPage() {
  return (
    <>
      <PageHeader eyebrow="Newsletter" title={["Confirma tu", { em: "suscripción" }]} crumbs={[{ href: "/newsletter/confirmada", label: "Newsletter" }]} />
      <section className="pb-16 sm:pb-24 lg:pb-28">
        <div className="container-site">
          <Suspense fallback={<AvisoEstado tono="cargando" titulo="Comprobando el enlace…" />}>
            <ConfirmarSuscripcion />
          </Suspense>
        </div>
      </section>
    </>
  );
}
