"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoaderCircle, MailX } from "lucide-react";
import { AvisoEstado, BOTON_PRINCIPAL } from "@/components/newsletter/aviso-estado";
import { TOKEN_PRUEBA, TOKEN_RE, consultarBaja, darDeBaja, newsletterDisponible, type EstadoBaja } from "@/lib/newsletter";

type Estado = { tipo: "consultando" | "enviando" } | { tipo: "listo"; estado: EstadoBaja; email: string | null };

/**
 * /newsletter/baja?t=<token>: el enlace de baja de cada correo. Al abrirse solo consulta (no da de baja: los
 * programas de correo abren los enlaces solos); la baja es el botón «Darme de baja».
 */
export function DarseDeBaja() {
  const t = (useSearchParams().get("t") ?? "").trim();
  const valido = newsletterDisponible && TOKEN_RE.test(t);
  const [estado, setEstado] = useState<Estado>({ tipo: "consultando" });

  useEffect(() => {
    if (!valido) return;
    let vivo = true;
    consultarBaja(t).then((r) => vivo && setEstado({ tipo: "listo", ...r }));
    return () => {
      vivo = false;
    };
  }, [t, valido]);

  if (t === TOKEN_PRUEBA) {
    return (
      <AvisoEstado tono="info" titulo="Es un enlace de prueba">
        <p>Este enlace sale en las pruebas y en la vista previa de la newsletter: no da de baja a nadie. En los correos de verdad, cada persona tiene el suyo.</p>
      </AvisoEstado>
    );
  }
  if (!newsletterDisponible) {
    return (
      <AvisoEstado tono="info" titulo="No podemos tramitar la baja desde aquí ahora mismo">
        <p>Responde a cualquiera de nuestros correos pidiendo la baja y te la tramitamos.</p>
      </AvisoEstado>
    );
  }
  if (!valido) {
    return (
      <AvisoEstado tono="error" titulo="El enlace no es válido">
        <p>Comprueba que lo has copiado entero desde el correo. También puedes responder a cualquiera de nuestros correos pidiendo la baja.</p>
      </AvisoEstado>
    );
  }
  if (estado.tipo === "consultando") return <AvisoEstado tono="cargando" titulo="Comprobando el enlace…" />;

  const e = estado.tipo === "listo" ? estado.estado : "confirmar";
  const email = estado.tipo === "listo" ? estado.email : null;
  if (e === "baja_hecha" || e === "ya_estaba") {
    return (
      <AvisoEstado tono="ok" titulo={e === "baja_hecha" ? "Te has dado de baja" : "Ya estabas dado de baja"}>
        <p>
          {email ? <>No enviaremos más correos de la newsletter a <strong className="text-navy-900">{email}</strong>.</> : "No te enviaremos más correos de la newsletter."}{" "}
          Si algún día quieres volver, puedes apuntarte otra vez desde el pie de la web.
        </p>
        <p>
          <Link href="/" className="font-medium text-navy-900 underline underline-offset-4">
            Volver a la web
          </Link>
        </p>
      </AvisoEstado>
    );
  }
  if (e === "invalido") {
    return (
      <AvisoEstado tono="error" titulo="El enlace no es válido">
        <p>Puede que esa suscripción ya no exista. Si sigues recibiendo correos, responde a cualquiera de ellos pidiendo la baja.</p>
      </AvisoEstado>
    );
  }

  const enviando = estado.tipo === "enviando";
  return (
    <div className="max-w-2xl space-y-5">
      {e === "error" && (
        <AvisoEstado tono="error" titulo="No hemos podido completar la baja ahora mismo">
          <p>Inténtalo de nuevo en unos minutos o responde a cualquiera de nuestros correos pidiendo la baja.</p>
        </AvisoEstado>
      )}
      <p className="text-lg leading-relaxed text-ink-soft">
        {email ? <>Vas a dejar de recibir la newsletter en <strong className="text-navy-900">{email}</strong>.</> : "Vas a dejar de recibir la newsletter."}
      </p>
      <button
        type="button"
        disabled={enviando}
        className={BOTON_PRINCIPAL}
        onClick={async () => {
          setEstado({ tipo: "enviando" });
          const r = await darDeBaja(t);
          setEstado({ tipo: "listo", ...r });
        }}
      >
        {enviando ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : <MailX aria-hidden className="size-5" />}
        Darme de baja
      </button>
    </div>
  );
}
