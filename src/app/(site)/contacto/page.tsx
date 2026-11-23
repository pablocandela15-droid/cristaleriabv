import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { ContactBooking } from "@/components/contact/contact-booking";
import { ContactForm } from "@/components/forms/contact-form";
import { Reveal } from "@/components/motion/reveal";
import { addressLine, mapsLink, whatsappLink } from "@/content/site";
import { obtenerWeb } from "@/lib/web/datos";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await obtenerWeb();
  const phone = site.phones[0] ? `${site.phones[0].display}, ` : "";
  return {
    title: "Contacto y visita técnica",
    description: `Contacta con ${site.name}: ${phone}${site.email}. ${addressLine(site)}. Reserva tu visita técnica online.`,
    alternates: { canonical: "/contacto" },
  };
}

export default async function ContactoPage() {
  const { site } = await obtenerWeb();
  const fullAddress = addressLine(site);
  const { lat, lon } = site.address;
  const bbox = [lon - 0.008, lat - 0.004, lon + 0.008, lat + 0.004].join(",");
  const whatsappPhone = site.phones.find((p) => p.tel.replace(/\D/g, "") === site.whatsapp)?.display ?? site.phones[0]?.display;
  return (
    <>
      <PageHeader
        eyebrow="Contacto"
        title={["Estamos aquí para", { em: "ayudarte" }]}
        intro="Llámanos, escríbenos o reserva directamente la visita técnica. Te respondemos en horario de oficina."
        crumbs={[{ href: "/contacto", label: "Contacto" }]}
      />

      {/* Móvil: teléfonos en dos columnas; WhatsApp y email a todo el ancho. */}
      <section className="pb-14 sm:pb-16">
        <div className="container-site grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {site.phones.map((p) => (
            <a key={p.tel} href={`tel:${p.tel}`} className="group rounded-2xl border border-navy-900/10 bg-cream-50 p-4 transition-colors hover:border-navy-900/30 sm:p-5">
              <Phone aria-hidden className="size-5 text-gold-600" />
              <p className="mt-3 text-sm text-ink-soft">{p.label || "Teléfono"}</p>
              <p className="whitespace-nowrap font-heading text-lg font-medium text-navy-900 sm:text-xl">{p.display}</p>
            </a>
          ))}
          <a
            href={whatsappLink("Hola, quería hacer una consulta.", site.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-whatsapp/30 min-[380px]:col-span-2 lg:col-span-1 bg-whatsapp/5 p-4 transition-colors hover:border-whatsapp/60 sm:p-5"
          >
            <MessageCircle aria-hidden className="size-5 text-whatsapp" />
            <p className="mt-3 text-sm text-ink-soft">WhatsApp</p>
            <p className="whitespace-nowrap font-heading text-lg font-medium text-navy-900 sm:text-xl">{whatsappPhone}</p>
          </a>
          <a
            href={`mailto:${site.email}`}
            className="rounded-2xl border border-navy-900/10 bg-cream-50 p-4 transition-colors hover:border-navy-900/30 min-[380px]:col-span-2 sm:p-5 lg:col-span-1"
          >
            <Mail aria-hidden className="size-5 text-gold-600" />
            <p className="mt-3 text-sm text-ink-soft">Email</p>
            <p className="break-all font-medium text-navy-900">{site.email}</p>
          </a>
        </div>
      </section>

      <section id="reservar" className="scroll-mt-24 pb-20 sm:pb-24">
        <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <Reveal>
              <span className="eyebrow">Visita técnica</span>
              <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-medium leading-tight">Reserva la toma de medidas</h2>
              <p className="mt-4 text-lg text-ink-soft">
                Gratis en Crevillente. Fuera, 10 € por cada 10 km de desplazamiento desde nuestras instalaciones. Te llamamos
                para confirmar el día y la hora.
              </p>
            </Reveal>
            <div className="mt-8 space-y-4 text-[15px]">
              <p className="flex items-start gap-3">
                <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-gold-600" />
                <span>
                  <strong className="block font-medium text-navy-900">Dirección</strong>
                  {fullAddress}
                </span>
              </p>
              <p className="flex items-start gap-3">
                <Clock aria-hidden className="mt-0.5 size-5 shrink-0 text-gold-600" />
                <span>
                  <strong className="block font-medium text-navy-900">Horario</strong>
                  {site.hours.map((h) => (
                    <span key={h.days} className="block">
                      {h.days}: {h.time}
                    </span>
                  ))}
                </span>
              </p>
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-navy-900/10">
              <iframe
                title={`Mapa: ${fullAddress}`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
                className="h-72 w-full"
                loading="lazy"
              />
              <a
                href={mapsLink(site)}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-cream-50 px-4 py-3 text-sm font-medium text-navy-900 underline-offset-4 hover:underline"
              >
                Cómo llegar (Google Maps)
              </a>
            </div>
          </div>
          <ContactBooking />
        </div>
      </section>

      <section className="pb-16 sm:pb-24 lg:pb-28">
        <div className="container-site">
          <div className="grid gap-10 rounded-[28px] bg-navy-900 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="eyebrow text-gold-300">Escríbenos</span>
              <h2 className="mt-3 text-[clamp(2rem,3.6vw,2.75rem)] font-medium leading-tight text-cream-100">Envíanos un mensaje</h2>
              <p className="mt-3 text-cream-100/70">Para dudas, encargos especiales o cualquier consulta.</p>
            </div>
            <ContactForm dark />
          </div>
        </div>
      </section>
    </>
  );
}
