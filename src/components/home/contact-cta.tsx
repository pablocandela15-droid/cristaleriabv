import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/forms/contact-form";
import { obtenerWeb } from "@/lib/web/datos";

export async function ContactCta() {
  const { photos } = await obtenerWeb();
  return (
    <section id="contacto" className="scroll-mt-24 pb-16 sm:pb-24 lg:pb-28">
      <div className="container-site">
        <Reveal>
          <div className="grid overflow-hidden rounded-[28px] bg-navy-900 shadow-[0_40px_80px_-40px_rgb(6_26_46/0.7)] lg:grid-cols-[1fr_1.05fr]">
            <div className="relative min-h-72 p-3 lg:min-h-full">
              <div className="relative h-full min-h-72 overflow-hidden rounded-[20px]">
                <Image src={photos.contact.src} alt={photos.contact.alt} fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
              </div>
            </div>
            <div className="p-6 sm:p-10">
              <span className="eyebrow text-gold-300">Empieza tu proyecto</span>
              <h2 className="mt-3 text-[clamp(2rem,3.6vw,2.75rem)] font-medium leading-[1.08] text-cream-100">
                ¿Hablamos de tu <em className="font-serif font-normal italic text-gold-300">proyecto</em>?
              </h2>
              <p className="mt-3 text-cream-100/70">Cuéntanos qué necesitas y te respondemos con una propuesta sin compromiso.</p>
              <div className="mt-8">
                <ContactForm dark />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
