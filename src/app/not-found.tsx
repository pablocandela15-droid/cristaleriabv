import { Calculator, Home } from "lucide-react";
import { CtaLink } from "@/components/site/cta";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { Registrar404 } from "@/components/site/registrar-404";

export default function NotFound() {
  return (
    <>
      <Registrar404 />
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden py-28 sm:py-36">
          <div aria-hidden className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="container-site text-center">
            <p className="font-heading text-[clamp(5rem,16vw,10rem)] font-medium leading-none text-navy-900/10">404</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3rem)] font-medium">Esta página se ha hecho añicos</h1>
            <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
              No encontramos lo que buscas, pero podemos ayudarte con cualquier trabajo de cristal.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <CtaLink href="/" icon={<Home />}>
                Ir al inicio
              </CtaLink>
              <CtaLink href="/presupuesto" variant="outline" icon={<Calculator />}>
                Calcular presupuesto
              </CtaLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
