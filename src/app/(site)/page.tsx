import { Hero } from "@/components/home/hero";
import { ServicesMarquee } from "@/components/home/services-marquee";
import { About } from "@/components/home/about";
import { ServicesGrid } from "@/components/home/services-grid";
import { Process } from "@/components/home/process";
import { CalculatorBand } from "@/components/home/calculator-band";
import { WorksPreview } from "@/components/home/works-preview";
import { FaqSection } from "@/components/home/faq-section";
import { ContactCta } from "@/components/home/contact-cta";
import { obtenerWeb } from "@/lib/web/datos";
import { faqsPorIndice } from "@/lib/web/mezclar";

export default async function HomePage() {
  const web = await obtenerWeb();
  /** Las 5 preguntas frecuentes de la home: visita, plazos, presupuesto, garantía y pago. */
  const homeFaqs = faqsPorIndice(web.faqs, [9, 0, 5, 3, 8], 5);
  return (
    <>
      <Hero />
      <ServicesMarquee />
      <About />
      <ServicesGrid />
      <Process />
      <CalculatorBand />
      <WorksPreview works={web.featured} />
      <FaqSection items={homeFaqs} />
      <ContactCta />
    </>
  );
}
