import type { Metadata } from "next";
import { Calculator } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { WorksGrid } from "@/components/works/works-grid";
import { AlbumsGallery } from "@/components/works/albums-gallery";
import { CtaLink } from "@/components/site/cta";
import { works } from "@/content/works";
import { obtenerWeb } from "@/lib/web/datos";

export const metadata: Metadata = {
  title: "Trabajos realizados",
  description: "Galería de mamparas, espejos, cerramientos, aluminio, barandillas y armarios de cristal. Inspírate para tu proyecto.",
  alternates: { canonical: "/trabajos" },
};

export default async function TrabajosPage() {
  // Con al menos un álbum publicado con fotos en el panel, se muestran los «books»; si no, la galería del código.
  const { albums } = await obtenerWeb();
  const books = albums.length > 0;
  return (
    <>
      <PageHeader
        eyebrow="Trabajos"
        title={["Ideas en", { em: "cristal" }, "para cada espacio"]}
        intro={
          books
            ? "Una selección de proyectos para inspirarte. Recorre nuestros books de fotos y amplía cualquier imagen."
            : "Una selección de proyectos para inspirarte. Filtra por tipo de trabajo y amplía cualquier imagen."
        }
        crumbs={[{ href: "/trabajos", label: "Trabajos" }]}
      />
      <section className="pb-16 sm:pb-24 lg:pb-28">
        <div className="container-site">
          {books ? <AlbumsGallery albums={albums} /> : <WorksGrid works={works} />}
          <div className="mt-16 flex flex-col items-center gap-4 rounded-[24px] border border-navy-900/10 bg-cream-50 p-8 text-center sm:p-12">
            <h2 className="text-3xl font-medium">¿Te imaginas algo así en tu casa?</h2>
            <p className="max-w-lg text-ink-soft">Calcula un presupuesto orientativo en dos minutos o cuéntanos tu idea.</p>
            <CtaLink href="/presupuesto" icon={<Calculator />}>
              Calcular presupuesto
            </CtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
