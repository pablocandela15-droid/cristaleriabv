"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoaderCircle, MailCheck } from "lucide-react";
import { AvisoEstado, BOTON_PRINCIPAL } from "@/components/newsletter/aviso-estado";
import { TOKEN_PRUEBA, TOKEN_RE, confirmar, newsletterDisponible, type EstadoConfirmacion } from "@/lib/newsletter";

type Estado = { tipo: "pendiente" | "enviando" } | { tipo: "resultado"; estado: EstadoConfirmacion; email: string | null };

/**
 * /newsletter/confirmada?t=<token>: el enlace del correo de confirmación. No confirma al abrirse (los programas de
 * correo y los antivirus abren los enlaces solos): pide pulsar «Confirmar mi suscripción».
 */
export function ConfirmarSuscripcion() {
  const t = (useSearchParams().get("t") ?? "").trim();
  const [estado, setEstado] = useState<Estado>({ tipo: "pendiente" });

  if (!newsletterDisponible) {
    return <AvisoEstado tono="info" titulo="La newsletter no está disponible ahora mismo">Vuelve a intentarlo más tarde.</AvisoEstado>;
  }
  if (t === TOKEN_PRUEBA) {
    return <AvisoEstado tono="info" titulo="Es un enlace de prueba">Este enlace sale en las pruebas y no confirma ninguna suscripción.</AvisoEstado>;
  }
  if (!TOKEN_RE.test(t)) {
    return (
      <AvisoEstado tono="error" titulo="El enlace no es válido">
        <p>Comprueba que lo has copiado entero desde el correo o vuelve a apuntarte desde el pie de esta web.</p>
      </AvisoEstado>
    );
  }

  if (estado.tipo === "resultado") {
    const { estado: e, email } = estado;
    if (e === "confirmada" || e === "ya_confirmada") {
      return (
        <AvisoEstado tono="ok" titulo={e === "confirmada" ? "¡Suscripción confirmada!" : "Tu suscripción ya estaba confirmada"}>
          <p>
            {email ? <>Te escribiremos a <strong className="text-navy-900">{email}</strong> </> : "Te escribiremos "}
            cuando haya ofertas, trabajos nuevos o consejos que contarte. Cada correo lleva un enlace para darte de baja.
          </p>
          <p>
            <Link href="/" className="font-medium text-navy-900 underline underline-offset-4">
              Volver a la web
            </Link>
          </p>
        </AvisoEstado>
      );
    }
    if (e === "caducado") {
      return (
        <AvisoEstado tono="info" titulo="El enlace ha caducado">
          <p>Los enlaces de confirmación duran 7 días. Vuelve a apuntarte desde el pie de esta web y te mandaremos otro.</p>
        </AvisoEstado>
      );
    }
    if (e === "invalido") {
      return (
        <AvisoEstado tono="error" titulo="El enlace no es válido">
          <p>Puede que ya no exista esa suscripción. Vuelve a apuntarte desde el pie de esta web.</p>
        </AvisoEstado>
      );
    }
  }

  const enviando = estado.tipo === "enviando";
  const fallo = estado.tipo === "resultado" && estado.estado === "error";
  return (
    <div className="max-w-2xl space-y-5">
      {fallo && (
        <AvisoEstado tono="error" titulo="No hemos podido confirmarla ahora mismo">
          <p>Inténtalo de nuevo en unos minutos.</p>
        </AvisoEstado>
      )}
      <p className="text-lg leading-relaxed text-ink-soft">
        Un último paso: pulsa el botón para confirmar que quieres recibir por correo las novedades y ofertas de la cristalería.
      </p>
      <button
        type="button"
        disabled={enviando}
        className={BOTON_PRINCIPAL}
        onClick={async () => {
          setEstado({ tipo: "enviando" });
          const r = await confirmar(t);
          setEstado({ tipo: "resultado", ...r });
        }}
      >
        {enviando ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : <MailCheck aria-hidden className="size-5" />}
        Confirmar mi suscripción
      </button>
      <p className="text-sm text-ink-soft">
        ¿No te has apuntado tú? No hagas nada: sin confirmar no recibirás ningún correo y borraremos la solicitud.
      </p>
    </div>
  );
}
