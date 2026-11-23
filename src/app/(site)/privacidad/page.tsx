import type { Metadata } from "next";
import { LegalPage, Pending } from "@/components/site/legal-page";
import { addressLine } from "@/content/site";
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
      </ul>

      <h2>3. Finalidad y base legal</h2>
      <ul>
        <li>Responder a tus consultas y gestionar presupuestos y visitas técnicas (consentimiento y medidas precontractuales).</li>
        <li>Mejorar las respuestas del asistente virtual (interés legítimo), sin elaborar perfiles.</li>
      </ul>

      <h2>4. Conservación</h2>
      <p>
        Conservamos los datos el tiempo necesario para atender tu solicitud y, después, durante los plazos legales aplicables.
        Las conversaciones del asistente se eliminan pasados <Pending>[12]</Pending> meses.
      </p>

      <h2>5. Destinatarios y encargados</h2>
      <p>No cedemos tus datos a terceros salvo obligación legal. Utilizamos proveedores que actúan como encargados del tratamiento:</p>
      <ul>
        <li>Supabase (base de datos y funciones), con servidores en la Unión Europea.</li>
        <li>Vercel (alojamiento web).</li>
        <li>OpenAI (generación de respuestas del asistente virtual), con las garantías del Marco de Privacidad de Datos UE-EE. UU.</li>
        <li>Si eliges enviar tu solicitud por WhatsApp, se aplica la política de privacidad de WhatsApp (Meta).</li>
      </ul>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a{" "}
        {site.email} o a la dirección postal indicada, adjuntando copia de tu documento de identidad. Si consideras que no hemos
        atendido correctamente tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).
      </p>
    </LegalPage>
  );
}
