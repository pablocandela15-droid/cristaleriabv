/**
 * Tarifas y catálogo editables desde el panel de administración.
 *
 * Supabase guarda una sola fila en `web_tarifas` (id = 1) con dos JSON:
 *  - `config`:   precios (misma forma que DEFAULT_PRICING de ./config). Lo que
 *                falte se toma de los valores por defecto (mergePricing).
 *  - `catalogo`: textos y opciones de la calculadora por encima del código
 *                (nombres, «formas» y demás opciones, campos y categorías
 *                ocultos). Ver el tipo Catalogo y aplicarCatalogo().
 *
 * FICHERO COMPARTIDO. Vive igual en los dos repos:
 *   cristaleriabv          → src/lib/pricing/tarifas.ts
 *   admin-cristaleriabv    → src/lib/web/pricing/tarifas.ts
 * junto con ./config.ts y ./categories.ts. Si cambias uno, copia los tres al
 * otro repo para que la web y el gestor de presupuestos calculen lo mismo.
 * Por eso aquí solo hay imports relativos y nada de React ni de Next.
 */
import { DEFAULT_PRICING, type PricingConfig } from "./config";
import type { CategoryDef, FieldDef, Opt, Values } from "./categories";

/* ------------------------------------------------------------------ */
/* Tipos de la fila `web_tarifas`                                      */
/* ------------------------------------------------------------------ */

/** Una opción de un campo (chips, select o multi). `value` es la clave de precio en `config`. */
export type OpcionCatalogo = { value: string; label: string; hint?: string; activo?: boolean };

export type CampoCatalogo = {
  label?: string;
  /** Texto de ayuda. Cadena vacía = quitar la ayuda del código. */
  hint?: string;
  /** false = ocultar el campo (solo si no es obligatorio). */
  activo?: boolean;
  /**
   * Lista COMPLETA y ordenada de opciones. Sustituye a la del código; las que
   * tengan `activo: false` no se muestran. Un `value` que no existe en el código
   * es una opción nueva: su precio se busca en `config` con ese mismo `value`
   * (p. ej. config.espejos.factors.forma["hexagonal"]). Sin precio = sin recargo.
   */
  opciones?: OpcionCatalogo[];
};

export type CategoriaCatalogo = {
  /** false = la categoría no sale en la calculadora de la web. */
  activo?: boolean;
  nombre?: string;
  short?: string;
  campos?: Record<string, CampoCatalogo>;
};

export type Catalogo = { version?: number; categorias?: Record<string, CategoriaCatalogo> };

export type FilaTarifas = { config?: Partial<PricingConfig> | null; catalogo?: Catalogo | null };

export type CategoriaAplicada = CategoryDef & { activo: boolean };

/* ------------------------------------------------------------------ */
/* Precios                                                             */
/* ------------------------------------------------------------------ */

const esObjeto = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);

/**
 * Mezcla los precios guardados con los de por defecto, por categoría y un nivel
 * más (factors, extras…): lo que falte en Supabase se toma de DEFAULT_PRICING.
 */
export function mergePricing(remote: Partial<PricingConfig> | null | undefined): PricingConfig {
  if (!esObjeto(remote)) return DEFAULT_PRICING;
  const out = { ...DEFAULT_PRICING } as Record<string, unknown>;
  for (const [k, v] of Object.entries(remote)) {
    const def = (DEFAULT_PRICING as Record<string, unknown>)[k];
    if (esObjeto(def) && esObjeto(v)) {
      const cat: Record<string, unknown> = { ...def };
      for (const [k2, v2] of Object.entries(v)) {
        const def2 = def[k2];
        cat[k2] = esObjeto(def2) && esObjeto(v2) ? { ...def2, ...v2 } : v2;
      }
      out[k] = cat;
    } else if (v !== undefined && v !== null) {
      out[k] = v;
    }
  }
  return out as PricingConfig;
}

/* ------------------------------------------------------------------ */
/* Catálogo (textos, opciones, campos y categorías visibles)          */
/* ------------------------------------------------------------------ */

const tieneOpciones = (f: FieldDef): f is Extract<FieldDef, { options: Opt[] }> =>
  f.kind === "chips" || f.kind === "select" || f.kind === "multi";

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function opcionesActivas(lista: OpcionCatalogo[]): Opt[] {
  const vistas = new Set<string>();
  const out: Opt[] = [];
  for (const o of lista) {
    if (!o || o.activo === false) continue;
    const value = texto(o.value);
    const label = texto(o.label);
    if (!value || !label || vistas.has(value)) continue;
    vistas.add(value);
    const hint = texto(o.hint);
    out.push(hint ? { value, label, hint } : { value, label });
  }
  return out;
}

/** Aplica el catálogo a un campo. Devuelve null si hay que ocultarlo. */
export function aplicarCampo(f: FieldDef, c: CampoCatalogo | undefined): FieldDef | null {
  if (!c) return f;
  if (c.activo === false && !f.required) return null;
  const out = { ...f, label: texto(c.label) || f.label } as FieldDef;
  if (typeof c.hint === "string") out.hint = texto(c.hint) || undefined;
  if (tieneOpciones(out) && Array.isArray(c.opciones)) {
    const opciones = opcionesActivas(c.opciones);
    // Si se desactivan todas, se quedan las del código: un campo sin opciones rompería la calculadora.
    if (opciones.length) out.options = opciones;
  }
  return out;
}

/** Corrige los valores por defecto que apunten a opciones que ya no existen. */
function corregirDefaults(defaults: Values, campos: FieldDef[]): Values {
  const out: Values = { ...defaults };
  for (const f of campos) {
    if (!tieneOpciones(f) || !(f.id in out)) continue;
    const validos = new Set(f.options.map((o) => o.value));
    const actual = out[f.id];
    if (f.kind === "multi") {
      out[f.id] = (Array.isArray(actual) ? actual : []).filter((x) => validos.has(String(x)));
    } else if (actual !== undefined && actual !== "" && !validos.has(String(actual))) {
      out[f.id] = f.options[0]?.value;
    }
  }
  return out;
}

/** Aplica el catálogo a una categoría de la calculadora. */
export function aplicarCategoria(def: CategoryDef, c: CategoriaCatalogo | undefined): CategoriaAplicada {
  if (!c) return Object.assign(Object.create(Object.getPrototypeOf(def)), def, { activo: true });
  const sections = def.sections
    .map((s) => ({
      ...s,
      fields: s.fields.map((f) => aplicarCampo(f, c.campos?.[f.id])).filter((f): f is FieldDef => f !== null),
    }))
    .filter((s) => s.fields.length > 0);
  const campos = sections.flatMap((s) => s.fields);
  // Se conserva `quote` (usa `this`): llamar siempre como categoria.quote(valores, precios).
  return Object.assign(Object.create(Object.getPrototypeOf(def)), def, {
    name: texto(c.nombre) || def.name,
    short: texto(c.short) || def.short,
    sections,
    defaults: corregirDefaults(def.defaults, campos),
    activo: c.activo !== false,
  });
}

/** Aplica el catálogo a todas las categorías (las ocultas vienen con activo = false). */
export function aplicarCatalogo<K extends string>(
  cats: Record<K, CategoryDef>,
  catalogo: Catalogo | null | undefined,
): Record<K, CategoriaAplicada> {
  const porCategoria: Record<string, CategoriaCatalogo> = esObjeto(catalogo?.categorias)
    ? (catalogo.categorias as Record<string, CategoriaCatalogo>)
    : {};
  const out = {} as Record<K, CategoriaAplicada>;
  for (const id of Object.keys(cats) as K[]) {
    out[id] = aplicarCategoria(cats[id], esObjeto(porCategoria[id]) ? porCategoria[id] : undefined);
  }
  return out;
}

/** Precios y categorías listos para calcular a partir de la fila de `web_tarifas` (o null). */
export function resolverTarifas<K extends string>(cats: Record<K, CategoryDef>, fila: FilaTarifas | null | undefined) {
  return {
    precios: mergePricing(fila?.config ?? null),
    categorias: aplicarCatalogo(cats, fila?.catalogo ?? null),
  };
}
