"use client";

import { useMemo } from "react";
import { categories, type CategoryId } from "@/lib/pricing/categories";
import { mergePricing, resolverTarifas } from "@/lib/pricing/tarifas";
import { useWeb } from "@/components/site/web-provider";

// Se mantiene la exportación de siempre (ahora vive en el módulo compartido tarifas.ts).
export { mergePricing };

/**
 * Tarifas vigentes de la calculadora: la fila de `web_tarifas` de Supabase
 * (precios + catálogo, leída en el servidor y revalidada cada minuto) aplicada
 * sobre config.ts y categories.ts con resolverTarifas(). Sin Supabase, o si la
 * tabla aún no existe, son exactamente las del código.
 *
 * - `precios`: PricingConfig completo.
 * - `categorias`: todas las categorías con textos, opciones y campos del panel
 *   (las ocultas con `activo: false`). Calcular siempre con categoria.quote(v, precios).
 * - `activas`: ids de las categorías visibles, en el orden del código.
 */
export function usePricing() {
  const { tarifas } = useWeb();
  return useMemo(() => {
    const { precios, categorias } = resolverTarifas(categories, tarifas);
    const activas = (Object.keys(categorias) as CategoryId[]).filter((id) => categorias[id].activo);
    return { precios, categorias, activas };
  }, [tarifas]);
}
