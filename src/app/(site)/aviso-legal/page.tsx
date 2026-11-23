import type { Metadata } from "next";
import { LegalPage, Pending } from "@/components/site/legal-page";
import { addressLine } from "@/content/site";
import { obtenerWeb } from "@/lib/web/datos";

export const metadata: Metadata = { title: "Aviso legal", robots: { index: false }, alternates: { canonical: "/aviso-legal" } };

export default async function AvisoLegalPage() {
  const { site } = await obtenerWeb();
  return (
    <LegalPage title="Aviso legal" href="/aviso-legal" updated="noviembre de 2026">
      <h2>1. Datos identificativos</h2>
      <p>
        En cumplimiento de la Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información y de comercio
        electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:
      </p>
      <ul>
        <li>
          Titular: <Pending>[NOMBRE O RAZÓN SOCIAL]</Pending> («{site.name}»)
        </li>
        <li>
          NIF/CIF: <Pending>[NIF/CIF]</Pending>
        </li>
        <li>Domicilio: {addressLine(site)}</li>
        <li>Teléfono: {site.phones[0]?.display}</li>
        <li>Email: {site.email}</li>
        <li>
          Datos registrales (si es sociedad): <Pending>[Registro Mercantil, tomo, folio, hoja]</Pending>
        </li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        Este sitio web informa sobre los servicios de cristalería, mamparas, espejos, cerramientos, carpintería de aluminio y
        trabajos relacionados que presta el titular, y permite solicitar presupuestos orientativos, visitas técnicas y
        contacto.
      </p>

      <h2>3. Presupuestos orientativos</h2>
      <p>
        Los precios que muestra la calculadora son orientativos y no constituyen una oferta vinculante. El precio definitivo se
        confirma por escrito tras la visita técnica y la toma de medidas.
      </p>

      <h2>4. Condiciones de uso</h2>
      <p>
        El usuario se compromete a hacer un uso adecuado de los contenidos y a no emplearlos para actividades ilícitas o
        contrarias a la buena fe. El titular podrá modificar sin previo aviso la información contenida en el sitio web.
      </p>

      <h2>5. Propiedad intelectual e industrial</h2>
      <p>
        Los textos, logotipos, diseño y código de este sitio web son titularidad del titular o se usan con licencia. Las
        fotografías de ambiente proceden de bancos de imágenes con licencia de uso libre (Pexels y Unsplash). Queda prohibida la
        reproducción total o parcial de los contenidos propios sin autorización.
      </p>

      <h2>6. Responsabilidad</h2>
      <p>
        El titular no se hace responsable de los daños derivados de interrupciones del servicio, errores de terceros o del uso
        indebido de la información publicada. Los enlaces a sitios de terceros (WhatsApp, Google Maps, OpenStreetMap) se
        ofrecen solo a título informativo.
      </p>

      <h2>7. Legislación aplicable</h2>
      <p>
        Las relaciones entre el titular y los usuarios se rigen por la normativa española. Para cualquier controversia, las
        partes se someterán a los juzgados y tribunales que correspondan conforme a la ley.
      </p>
    </LegalPage>
  );
}
