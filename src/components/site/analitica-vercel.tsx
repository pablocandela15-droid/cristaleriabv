"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics sin los tokens personales de la newsletter: los enlaces de confirmar y de baja llevan `?t=`
 * y no deben salir de la web (ni a las estadísticas de visitas).
 */
function sinToken(evento: BeforeSendEvent): BeforeSendEvent {
  try {
    const url = new URL(evento.url);
    if (url.pathname.startsWith("/newsletter/") && url.searchParams.has("t")) {
      url.searchParams.delete("t");
      return { ...evento, url: url.toString() };
    }
  } catch {
    // URL rara: se manda tal cual.
  }
  return evento;
}

export function AnaliticaVercel() {
  return <Analytics beforeSend={sinToken} />;
}
