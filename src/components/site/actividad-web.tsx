"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { iniciarActividad, registrarVista } from "@/lib/actividad";

/**
 * Apunta cada página vista (también las navegaciones dentro de la web) para
 * Logs y Tráfico web del panel. No pinta nada. Sin NEXT_PUBLIC_SUPABASE_URL
 * no hace nada.
 */
export function ActividadWeb() {
  const pathname = usePathname();
  useEffect(() => {
    iniciarActividad();
    registrarVista(pathname);
  }, [pathname]);
  return null;
}
