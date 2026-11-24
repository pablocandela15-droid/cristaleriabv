import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Pending } from "@/components/site/legal-page";
import { addressLine } from "@/content/site";
import { newsletterDisponible } from "@/lib/newsletter";
import { obtenerWeb } from "@/lib/web/datos";

export const metadata: Metadata = { title: "Política de privacidad", robots: { index: false }, alternates: { canonical: "/privacidad" } };

export default async function PrivacidadPage() {
  const { site } = await obtenerWeb();
  return (
    <LegalPage title="Política de privacidad" href="/privacidad" updated="noviembre de 2026">
      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>
          Responsable: <Pending>[NOMBRE O RAZÓN SOCIAL]</Pending> («{site.name}»)
        </li>
        <li>
          NIF/CIF: <Pending>[NIF/CIF]</Pending>
        </li>
        <li>Dirección: {addressLine(site)}</li>
        <li>Email: {site.email}</li>
        <li>Teléfono: {site.phones[0]?.display}</li>
      </ul>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li>Formulario de contacto: nombre, teléfono, email, servicio y mensaje.</li>
        <li>
          Reserva de visita técnica: nombre, teléfono, email (opcional), dirección o población de la obra, fecha y franja
          preferidas, comentarios y, en su caso, el presupuesto orientativo calculado.
        </li>
        <li>
          Asistente virtual: el texto de las preguntas que escribes. No pidas ni facilites datos sensibles en el chat.
        </li>
        <li>
          Calculadora: los datos de medidas y opciones se procesan en tu navegador y solo nos llegan si decides enviarlos.
        </li>
        <li>
          Geolocalización: solo si pulsas «Usar mi ubicación», tu navegador calcula la distancia a nuestro taller; la ubicación
          no se envía ni se guarda.
        </li>
        <li>
          Estadísticas de uso (sin cookies): páginas vistas, tiempo y scroll, uso de la calculadora (el servicio y el precio
          orientativo), pulsaciones en llamar, WhatsApp o el mapa, envío de formularios (sin su contenido), errores técnicos y datos
          del navegador (tipo de dispositivo, navegador y sistema). No guardamos tu IP ni nada en tu navegador, y cada visita lleva
          un identificador aleatorio que no se relaciona con otras. Con «No rastrear» o Global Privacy Control solo se registran los
          errores técnicos. Más detalle en la <Link href="/cookies">política de cookies</Link>.
        </li>
        {newsletterDisponible && (
          <li>
            Newsletter (solo si te suscribes): tu email y, si lo das al pedir presupuesto, tu nombre; cuándo y cómo aceptaste
            recibirla (el texto de la casilla) y cuándo la confirmaste desde el correo; y, de cada envío, si se entregó, si se abrió o
            se pulsó un enlace, y si rebotó o se marcó como correo no deseado.
          </li>
        )}
      </ul>

      <h2>3. Finalidad y base legal</h2>
      <ul>
        <li>Responder a tus consultas y gestionar presupuestos y visitas técnicas (consentimiento y medidas precontractuales).</li>
        <li>Mejorar las respuestas del asistente virtual (interés legítimo), sin elaborar perfiles.</li>
        <li>
          Saber cómo se usa la web y detectar sus errores para mejorarla (interés legítimo), con estadísticas agregadas y sin
          elaborar perfiles.
        </li>
        {newsletterDisponible && (
          <li>
            Enviarte por correo novedades, ofertas y consejos de la cristalería si te suscribes (consentimiento, que puedes retirar
            cuando quieras). La suscripción solo se activa cuando la confirmas desde el enlace que te enviamos por correo.
          </li>
        )}
      </ul>

      <h2>4. Conservación</h2>
      <p>
        Conservamos los datos el tiempo necesario para atender tu solicitud y, después, durante los plazos legales aplicables.
        Las conversaciones del asistente se eliminan pasados <Pending>[12]</Pending> meses. Las estadísticas de uso se borran a
        los 90 días y los errores técnicos, a los 180.
      </p>
      {newsletterDisponible && (
        <p>
          Newsletter: mientras sigas suscrito. Si no confirmas el alta, la borramos a los 30 días. Si te das de baja, dejamos de
          escribirte y solo conservamos lo necesario para acreditar tu consentimiento y tu baja mientras puedan exigirse
          responsabilidades; si nos pides que borremos tus datos, únicamente guardamos una huella cifrada de tu email (no permite
          recuperarlo) para no volver a escribirte. Los datos de entrega y apertura de los correos se borran a los 13 meses.
        </p>
      )}

      <h2>5. Destinatarios y encargados</h2>
      <p>No cedemos tus datos a terceros salvo obligación legal. Utilizamos proveedores que actúan como encargados del tratamiento:</p>
      <ul>
        <li>Supabase (base de datos y funciones), con servidores en la Unión Europea.</li>
        <li>Vercel (alojamiento web y estadísticas de visitas sin cookies, Vercel Web Analytics).</li>
        <li>OpenAI (generación de respuestas del asistente virtual), con las garantías del Marco de Privacidad de Datos UE-EE. UU.</li>
        {newsletterDisponible && (
          <li>
            Resend (envío de los correos de la newsletter). Si los datos salen del Espacio Económico Europeo, con las garantías del
            RGPD (<Pending>[cláusulas contractuales tipo / Marco de Privacidad de Datos UE-EE. UU.]</Pending>).
          </li>
        )}
        <li>Si eliges enviar tu solicitud por WhatsApp, se aplica la política de privacidad de WhatsApp (Meta).</li>
      </ul>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a{" "}
        {site.email} o a la dirección postal indicada, adjuntando copia de tu documento de identidad. Si consideras que no hemos
        atendido correctamente tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).
      </p>
      {newsletterDisponible && (
        <p>
          Para dejar de recibir la newsletter, pulsa «Darme de baja» en el enlace que va al pie de cada correo (o el botón «Cancelar
          suscripción» de tu programa de correo), o escríbenos a {site.email}. La baja es inmediata.
        </p>
      )}
    </LegalPage>
  );
}
