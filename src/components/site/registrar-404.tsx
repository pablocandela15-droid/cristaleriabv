"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registrar } from "@/lib/actividad";

/** Página que no existe: se apunta como error_404 (con si se llegó desde otra página de la web). No pinta nada. */
export function Registrar404() {
  const pathname = usePathname();
  useEffect(() => {
    let interno = false;
    try {
      interno = Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
    } catch {
      interno = false;
    }
    registrar("error_404", { ruta: pathname, props: { referente_interno: interno }, error: { mensaje: `Página no encontrada: ${pathname}` } });
  }, [pathname]);
  return null;
}
