import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { newsletterDisponible } from "@/lib/newsletter";

export const metadata: Metadata = { title: "Política de cookies", robots: { index: false }, alternates: { canonical: "/cookies" } };

export default function CookiesPage() {
  return (
    <LegalPage title="Política de cookies" href="/cookies" updated="noviembre de 2026">
      <h2>1. ¿Usamos cookies?</h2>
      <p>
        Esta web <strong>no utiliza cookies de análisis, publicidad ni seguimiento</strong>, y para medir no guarda nada en tu
        navegador. Por eso no mostramos un banner de consentimiento.
      </p>

      <h2>2. Cookies técnicas</h2>
      <p>
        Solo se usan cookies técnicas imprescindibles en la zona de administración (/admin) para mantener la sesión iniciada del
        personal autorizado. Están exentas de consentimiento según el artículo 22.2 de la LSSI-CE.
      </p>

      <h2>3. Estadísticas de uso sin cookies</h2>
      <p>Para saber cuánta gente visita la web y mejorarla usamos dos herramientas que no instalan cookies ni te identifican:</p>
      <ul>
        <li>
          <strong>Vercel Web Analytics</strong> (nuestro proveedor de alojamiento): cuenta las páginas vistas, la página de la que
          vienes, el país, el tipo de dispositivo y el navegador, de forma agregada y sin cookies.
        </li>
        <li>
          <strong>Medición propia</strong>: qué páginas se ven, cuánto tiempo y hasta dónde, si se usa la calculadora (el servicio y el
          precio orientativo, nunca las medidas), si se pulsa llamar, WhatsApp o el mapa, si se envían los formularios (sin su
          contenido) y los errores técnicos de la web. Cada visita lleva un identificador aleatorio que solo vive mientras tienes la
          página abierta: no se guarda en tu navegador, no se relaciona con otras visitas y no guardamos tu dirección IP. Se conserva
          un máximo de 90 días (180 días los errores técnicos).
        </li>
      </ul>
      <p>
        Si tu navegador tiene activada la opción <strong>«No rastrear»</strong> (Do Not Track) o <strong>Global Privacy Control</strong>,
        la medición propia no registra lo que haces: solo los errores técnicos de la web, sin relacionarlos con tu visita.
      </p>

      <h2>4. Servicios de terceros</h2>
      <ul>
        <li>El mapa de la página de contacto se carga desde OpenStreetMap, que no instala cookies de seguimiento.</li>
        <li>
          Los enlaces a WhatsApp y Google Maps abren servicios externos que aplican sus propias políticas de cookies cuando los
          visitas.
        </li>
        {newsletterDisponible && (
          <li>
            Los correos de la newsletter (solo si te suscribes) pueden llevar una imagen mínima y enlaces que pasan por nuestro
            proveedor de envío, Resend, para saber si se entregan, se abren o se pulsa un enlace. Es parte del correo, no de esta web,
            y no instala cookies en tu navegador.
          </li>
        )}
      </ul>

      <h2>5. Cambios</h2>
      <p>
        Si en el futuro incorporamos herramientas de analítica con cookies u otras cookies no técnicas, actualizaremos esta política y
        solicitaremos tu consentimiento antes de instalarlas.
      </p>
    </LegalPage>
  );
}
