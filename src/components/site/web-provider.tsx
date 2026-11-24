"use client";

import { createContext, useContext, type ReactNode } from "react";
import { site as defaultSite, type Site } from "@/content/site";
import { services as defaultServices, type Service } from "@/content/services";
import { faqs as defaultFaqs, type Faq } from "@/content/faq";
import type { FilaTarifas } from "@/lib/pricing/tarifas";

/**
 * Datos editables desde el panel que necesitan los componentes de cliente
 * (cabecera, botones flotantes, asistente, formularios, calculadora). Los carga
 * el layout en el servidor (src/lib/web/datos.ts) ya mezclados con el código;
 * fuera del proveedor se usan los valores del código.
 */
export type WebCliente = {
  site: Site;
  services: Service[];
  faqs: Faq[];
  /** Fila de `web_tarifas` (o null): la resuelve usePricing(). */
  tarifas: FilaTarifas | null;
  /** Se puede apuntar alguien a la newsletter (leerNewsletterActiva): casilla del presupuesto. */
  newsletter?: boolean;
};

const WebContext = createContext<WebCliente>({
  site: defaultSite,
  services: defaultServices,
  faqs: defaultFaqs,
  tarifas: null,
});

export function WebProvider({ value, children }: { value: WebCliente; children: ReactNode }) {
  return <WebContext.Provider value={value}>{children}</WebContext.Provider>;
}

export function useWeb() {
  return useContext(WebContext);
}
