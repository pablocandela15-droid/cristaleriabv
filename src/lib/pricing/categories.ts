import type { M2Category, PricingConfig } from "./config";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type Opt = { value: string; label: string; hint?: string };
export type Values = Record<string, string | number | boolean | string[] | undefined>;

type Base = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Mostrar el campo solo si se cumple la condición. */
  when?: (v: Values) => boolean;
};

export type FieldDef =
  | (Base & { kind: "number"; unit?: string; min: number; max: number; step?: number; placeholder?: string })
  | (Base & { kind: "chips" | "select"; options: Opt[] })
  | (Base & { kind: "multi"; options: Opt[] })
  | (Base & { kind: "toggle" })
  | (Base & { kind: "text" | "textarea"; placeholder?: string; maxLength: number });

export type Section = { title: string; fields: FieldDef[] };

export type QuoteLine = { label: string; amount: number | null; detail?: string };
export type Quote = {
  /** Total orientativo en € (redondeado). 0 si faltan datos. */
  total: number;
  ready: boolean;
  missing: string[];
  lines: QuoteLine[];
  /** Conceptos sin precio automático («se valora en la visita»). */
  pending: string[];
};

export type CategoryDef = {
  id: string;
  /** Categoría del servicio (para enlazar con /servicios). */
  service: string;
  name: string;
  short: string;
  sections: Section[];
  defaults: Values;
  quote: (v: Values, c: PricingConfig) => Quote;
};

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
export const str = (v: unknown) => (v == null ? "" : String(v));
export const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function optionLabel(field: FieldDef, value: unknown): string {
  if (field.kind === "chips" || field.kind === "select" || field.kind === "multi") {
    const values = (Array.isArray(value) ? value : [value]).filter((x) => x !== undefined && x !== null && x !== "");
    return values.map((x) => field.options.find((o) => o.value === String(x))?.label ?? String(x)).join(", ");
  }
  if (field.kind === "toggle") return value ? "Sí" : "No";
  if (field.kind === "number") return value === "" || value == null ? "" : `${value}${field.unit ? ` ${field.unit}` : ""}`;
  return str(value);
}

export function visibleFields(def: CategoryDef, v: Values) {
  return def.sections.flatMap((s) => s.fields).filter((f) => !f.when || f.when(v));
}

function checkRequired(def: CategoryDef, v: Values): string[] {
  return visibleFields(def, v)
    .filter((f) => {
      if (!f.required) return false;
      if (f.kind === "number") {
        const n = num(v[f.id]);
        return !n || n < f.min || n > f.max;
      }
      return !str(v[f.id]);
    })
    .map((f) => f.label);
}

const qty = (v: Values) => Math.max(1, Math.round(num(v.cantidad) || 1));

/** Cálculo genérico por m²: base × área × multiplicadores + extras, × cantidad. */
function m2Quote(
  def: CategoryDef,
  v: Values,
  cat: M2Category,
  opts: {
    widthId?: string;
    heightId?: string;
    areaLabel: string;
    extras?: { id: string; label: string; active: boolean; units?: number; unitLabel?: string }[];
  },
): Quote {
  const missing = checkRequired(def, v);
  const w = num(v[opts.widthId ?? "ancho"]);
  const h = num(v[opts.heightId ?? "alto"]);
  const area = (w * h) / 10000;
  if (missing.length || !area) return { total: 0, ready: false, missing, lines: [], pending: [] };

  let factor = 1;
  for (const [field, table] of Object.entries(cat.factors)) {
    const key = str(v[field]);
    if (key && table[key] != null) factor *= table[key];
  }
  const unit = cat.basePerM2 * area * factor;
  const n = qty(v);
  const lines: QuoteLine[] = [
    {
      label: opts.areaLabel,
      amount: round2(unit * n),
      detail: `${area.toLocaleString("es-ES", { maximumFractionDigits: 2 })} m²${n > 1 ? ` × ${n}` : ""}`,
    },
  ];
  const pending: string[] = [];
  for (const e of opts.extras ?? []) {
    if (!e.active) continue;
    const price = cat.extras[e.id] ?? 0;
    const units = (e.units ?? 1) * n;
    if (price > 0) lines.push({ label: e.label, amount: round2(price * units), detail: e.unitLabel });
    else pending.push(e.label);
  }
  const total = Math.round(lines.reduce((s, l) => s + (l.amount ?? 0), 0));
  return { total, ready: true, missing: [], lines, pending };
}

/* ------------------------------------------------------------------ */
/* Opciones compartidas                                                */
/* ------------------------------------------------------------------ */

const ACABADOS_PERFIL: Opt[] = [
  { value: "lacado-blanco", label: "Lacado blanco" },
  { value: "lacado-gris", label: "Lacado gris" },
  { value: "lacado-negro", label: "Lacado negro" },
  { value: "anodizado", label: "Anodizado natural" },
  { value: "imitacion-madera", label: "Imitación madera" },
];

const cantidad = (label = "Cantidad"): FieldDef => ({
  kind: "number",
  id: "cantidad",
  label,
  unit: "ud.",
  min: 1,
  max: 100,
  hint: "Número de piezas iguales que necesitas.",
});

const observaciones: FieldDef = {
  kind: "textarea",
  id: "observaciones",
  label: "Observaciones",
  placeholder: "Recortes, taladros, instalación especial, altura del plato…",
  maxLength: 500,
};

/* ------------------------------------------------------------------ */
/* Mamparas a medida                                                   */
/* ------------------------------------------------------------------ */

const mamparas: CategoryDef = {
  id: "mamparas",
  service: "mamparas",
  name: "Mampara a medida",
  short: "Configura tu mampara de ducha o bañera",
  defaults: {
    tipoMampara: "frontal",
    composicion: "fijo-puerta",
    alto: 195,
    cristal: "templado-8mm",
    perfileria: "minima",
    acabadoPerfil: "cromo",
    acabadoCristal: [],
    extraclaro: false,
    cantidad: 1,
  },
  sections: [
    {
      title: "Tipo y composición",
      fields: [
        {
          kind: "chips",
          id: "tipoMampara",
          label: "Tipo de mampara",
          required: true,
          hint: "Bañera: sobre el borde de la bañera. Frontal: un solo lado. Esquina: dos lados en L. Nicho: entre tres paredes. Walk-in: panel fijo sin puerta.",
          options: [
            { value: "frontal", label: "Frontal" },
            { value: "esquina", label: "Esquina (L)" },
            { value: "nicho", label: "Nicho" },
            { value: "banera", label: "Bañera" },
            { value: "panel-fijo", label: "Panel fijo (walk-in)" },
          ],
        },
        {
          kind: "select",
          id: "composicion",
          label: "Composición",
          hint: "Cómo se distribuyen los paneles. Fijo: sin apertura. Fijo + puerta: combinado. Corredera: deslizante sobre guía. Abatible: con bisagra.",
          options: [
            { value: "fijo", label: "Fijo" },
            { value: "fijo-puerta", label: "Fijo + puerta" },
            { value: "dos-puertas", label: "2 puertas" },
            { value: "tres-hojas", label: "3 hojas" },
            { value: "corredera", label: "Corredera" },
            { value: "abatible", label: "Abatible" },
            { value: "esquina-l", label: "Esquina L" },
          ],
        },
      ],
    },
    {
      title: "Medidas",
      fields: [
        {
          kind: "number",
          id: "ancho",
          label: "Ancho",
          unit: "cm",
          min: 40,
          max: 300,
          required: true,
          placeholder: "100",
          hint: "Mide el ancho del hueco. En frontal, entre paredes; en esquina, cada lado por separado (indícalo en observaciones).",
        },
        {
          kind: "number",
          id: "alto",
          label: "Alto",
          unit: "cm",
          min: 100,
          max: 300,
          required: true,
          placeholder: "195",
          hint: "Desde el plato o la bañera hasta donde quieres que llegue. Lo habitual: 185–200 cm.",
        },
      ],
    },
    {
      title: "Cristal",
      fields: [
        {
          kind: "chips",
          id: "cristal",
          label: "Cristal templado",
          hint: "Todo el cristal es templado de seguridad. 6 mm ligero, 8 mm equilibrio perfecto, 10 mm premium y más robusto.",
          options: [
            { value: "templado-6mm", label: "6 mm" },
            { value: "templado-8mm", label: "8 mm", hint: "recomendado" },
            { value: "templado-10mm", label: "10 mm" },
          ],
        },
        {
          kind: "toggle",
          id: "extraclaro",
          label: "Cristal extraclaro (mayor transparencia)",
          hint: "Elimina el tono verdoso del cristal normal: máxima transparencia y luminosidad.",
        },
        {
          kind: "multi",
          id: "acabadoCristal",
          label: "Acabados del cristal",
          options: [
            { value: "antical", label: "Tratamiento antical" },
            { value: "acido", label: "Al ácido (translúcido)" },
            { value: "serigrafia", label: "Serigrafía / decorado" },
          ],
        },
      ],
    },
    {
      title: "Perfilería",
      fields: [
        {
          kind: "chips",
          id: "perfileria",
          label: "Perfilería",
          hint: "Sin perfil: minimalista, solo fijaciones. Mínima: perfil fino. Completa: marco de aluminio, más tradicional y robusto.",
          options: [
            { value: "sin-perfil", label: "Sin perfil" },
            { value: "minima", label: "Mínima" },
            { value: "completa", label: "Completa" },
          ],
        },
        {
          kind: "chips",
          id: "acabadoPerfil",
          label: "Acabado del perfil",
          hint: "Conviene que combine con la grifería.",
          options: [
            { value: "cromo", label: "Cromo" },
            { value: "negro", label: "Negro mate" },
            { value: "blanco", label: "Blanco" },
            { value: "oro-cepillado", label: "Oro cepillado" },
          ],
        },
      ],
    },
    {
      title: "Apertura y detalles",
      fields: [
        {
          kind: "chips",
          id: "aperturaLado",
          label: "Lado de apertura",
          hint: "Mirando la mampara desde fuera de la ducha.",
          when: (v) => v.tipoMampara !== "panel-fijo" && v.composicion !== "fijo",
          options: [
            { value: "izquierda", label: "Izquierda" },
            { value: "derecha", label: "Derecha" },
          ],
        },
        {
          kind: "chips",
          id: "aperturaDireccion",
          label: "Dirección",
          when: (v) => v.composicion === "abatible" || v.composicion === "fijo-puerta",
          options: [
            { value: "interior", label: "Hacia dentro" },
            { value: "exterior", label: "Hacia fuera" },
          ],
        },
        cantidad(),
        observaciones,
      ],
    },
  ],
  quote(v, c) {
    const missing = checkRequired(this, v);
    if (missing.length) return { total: 0, ready: false, missing, lines: [], pending: [] };
    const m = c.mamparas;
    const ancho = num(v.ancho);
    const alto = num(v.alto);
    const n = qty(v);
    const lines: QuoteLine[] = [
      { label: "Mampara base", amount: m.base },
      { label: "Ancho", amount: round2(ancho * m.perCmWidth), detail: `${ancho} cm × ${m.perCmWidth} €/cm` },
    ];
    const pending: string[] = [];
    const add = (label: string, amount: number | undefined, detail?: string) => {
      if (amount && amount > 0) lines.push({ label, amount, detail });
    };
    if (alto > m.tallOverCm) add(`Altura superior a ${m.tallOverCm} cm`, m.tallSurcharge);
    add("Cristal templado 10 mm", m.cristal[str(v.cristal)]);
    if (v.extraclaro) add("Cristal extraclaro", m.extraclaro);
    add("Perfilería completa", m.perfileria[str(v.perfileria)]);
    add("Acabado del perfil", m.acabadoPerfil[str(v.acabadoPerfil)], str(v.acabadoPerfil) === "negro" ? "Negro mate" : "Oro cepillado");
    const labels: Record<string, string> = { antical: "Tratamiento antical", acido: "Cristal al ácido", serigrafia: "Serigrafía / decorado" };
    for (const a of arr(v.acabadoCristal)) {
      const price = m.acabadoCristal[a] ?? 0;
      if (price > 0) add(labels[a] ?? a, price);
      else pending.push(labels[a] ?? a);
    }
    const unit = lines.reduce((s, l) => s + (l.amount ?? 0), 0);
    if (n > 1) lines.push({ label: `Cantidad × ${n}`, amount: round2(unit * (n - 1)) });
    return { total: Math.round(unit * n), ready: true, missing: [], lines, pending };
  },
};

/* ------------------------------------------------------------------ */
/* Dominó                                                              */
/* ------------------------------------------------------------------ */

const domino: CategoryDef = {
  id: "domino",
  service: "domino",
  name: "Cristal Dominó",
  short: "Paneles, puertas y divisores de vidrio",
  defaults: { tipoPieza: "fijo", espesor: "8", tipoCristal: "templado", acabado: "transparente", cantidad: 1, antical: false, varilleria: false },
  sections: [
    {
      title: "Pieza",
      fields: [
        { kind: "text", id: "nombrePieza", label: "Nombre de la pieza", placeholder: "Ej.: puerta del salón", maxLength: 80 },
        {
          kind: "chips",
          id: "tipoPieza",
          label: "Tipo de pieza",
          required: true,
          options: [
            { value: "fijo", label: "Fijo" },
            { value: "pivotante", label: "Pivotante" },
            { value: "corredera", label: "Corredera" },
            { value: "bisagras", label: "Con bisagras" },
          ],
        },
        { kind: "number", id: "ancho", label: "Ancho del hueco", unit: "cm", min: 20, max: 400, required: true, placeholder: "100" },
        { kind: "number", id: "alto", label: "Alto del hueco", unit: "cm", min: 20, max: 350, required: true, placeholder: "200" },
      ],
    },
    {
      title: "Cristal y acabado",
      fields: [
        {
          kind: "chips",
          id: "espesor",
          label: "Espesor",
          options: [
            { value: "6", label: "6 mm" },
            { value: "8", label: "8 mm" },
            { value: "10", label: "10 mm" },
            { value: "12", label: "12 mm" },
          ],
        },
        {
          kind: "chips",
          id: "tipoCristal",
          label: "Tipo de cristal",
          options: [
            { value: "templado", label: "Templado" },
            { value: "laminado", label: "Laminado" },
            { value: "extraclaro", label: "Extraclaro" },
          ],
        },
        {
          kind: "chips",
          id: "acabado",
          label: "Acabado",
          options: [
            { value: "transparente", label: "Transparente" },
            { value: "satinado", label: "Satinado" },
            { value: "serigrafado", label: "Serigrafiado" },
          ],
        },
        {
          kind: "select",
          id: "color",
          label: "Color de la perfilería",
          options: [
            { value: "negro-9005", label: "Negro RAL 9005" },
            { value: "bronce", label: "Bronce" },
            { value: "beige-9002", label: "Beige RAL 9002" },
            { value: "blanco-9001", label: "Blanco RAL 9001" },
          ],
        },
        { kind: "toggle", id: "antical", label: "Tratamiento antical" },
      ],
    },
    {
      title: "Herrajes",
      fields: [
        {
          kind: "chips",
          id: "tirador",
          label: "Tirador",
          when: (v) => v.tipoPieza === "pivotante" || v.tipoPieza === "bisagras",
          options: [
            { value: "pletina-30", label: "Pletina 30" },
            { value: "tirador-generico", label: "Tirador genérico" },
          ],
        },
        {
          kind: "chips",
          id: "freno",
          label: "Freno",
          when: (v) => v.tipoPieza === "corredera",
          options: [
            { value: "freno-simple", label: "Freno simple" },
            { value: "freno-doble", label: "Freno doble" },
            { value: "final-carrera", label: "Final de carrera" },
          ],
        },
        { kind: "toggle", id: "caset", label: "Caset", when: (v) => v.tipoPieza === "corredera" },
        { kind: "toggle", id: "varilleria", label: "Varillería decorativa" },
        {
          kind: "chips",
          id: "tipoVarilla",
          label: "Tipo de varilla",
          when: (v) => Boolean(v.varilleria),
          options: [
            { value: "hierro", label: "Hierro" },
            { value: "aluminio", label: "Aluminio" },
          ],
        },
        {
          kind: "number",
          id: "metrosVarilla",
          label: "Longitud total de varilla",
          unit: "cm",
          min: 0,
          max: 5000,
          placeholder: "500",
          when: (v) => Boolean(v.varilleria),
        },
        cantidad(),
        observaciones,
      ],
    },
  ],
  quote(v, c) {
    return m2Quote(this, v, c.domino, {
      areaLabel: "Cristal Dominó",
      extras: [
        { id: "extraclaro", label: "Cristal extraclaro", active: v.tipoCristal === "extraclaro" },
        { id: "antical", label: "Tratamiento antical", active: Boolean(v.antical) },
        { id: "tirador", label: "Tirador", active: Boolean(v.tirador) && (v.tipoPieza === "pivotante" || v.tipoPieza === "bisagras") },
        { id: "freno", label: "Freno", active: Boolean(v.freno) && v.tipoPieza === "corredera" },
        { id: "caset", label: "Caset", active: Boolean(v.caset) && v.tipoPieza === "corredera" },
        {
          id: "varillaMl",
          label: "Varillería",
          active: Boolean(v.varilleria),
          units: num(v.metrosVarilla) / 100,
          unitLabel: `${num(v.metrosVarilla) / 100} m`,
        },
      ],
    });
  },
};

/* ------------------------------------------------------------------ */
/* Espejos                                                             */
/* ------------------------------------------------------------------ */

const espejos: CategoryDef = {
  id: "espejos",
  service: "espejos",
  name: "Espejo a medida",
  short: "Espejos decorativos y funcionales",
  defaults: { espesor: "4", forma: "rectangular", canto: "pulido", cantidad: 1 },
  sections: [
    {
      title: "Medidas y forma",
      fields: [
        { kind: "number", id: "ancho", label: "Ancho", unit: "cm", min: 10, max: 400, required: true, placeholder: "80" },
        { kind: "number", id: "alto", label: "Alto", unit: "cm", min: 10, max: 300, required: true, placeholder: "120" },
        {
          kind: "chips",
          id: "forma",
          label: "Forma",
          options: [
            { value: "rectangular", label: "Rectangular" },
            { value: "redondo", label: "Redondo" },
            { value: "ovalado", label: "Ovalado" },
            { value: "irregular", label: "Irregular" },
          ],
        },
      ],
    },
    {
      title: "Acabado",
      fields: [
        {
          kind: "chips",
          id: "espesor",
          label: "Espesor",
          options: [
            { value: "4", label: "4 mm" },
            { value: "5", label: "5 mm" },
            { value: "6", label: "6 mm" },
          ],
        },
        {
          kind: "chips",
          id: "canto",
          label: "Canto",
          options: [
            { value: "pulido", label: "Pulido" },
            { value: "biselado", label: "Biselado" },
          ],
        },
        {
          kind: "multi",
          id: "extras",
          label: "Extras",
          options: [
            { value: "iluminacion", label: "Iluminación LED" },
            { value: "antivaho", label: "Sistema antivaho" },
          ],
        },
        cantidad(),
        observaciones,
      ],
    },
  ],
  quote(v, c) {
    const extras = arr(v.extras);
    return m2Quote(this, v, c.espejos, {
      areaLabel: "Espejo",
      extras: [
        { id: "iluminacion", label: "Iluminación LED", active: extras.includes("iluminacion") },
        { id: "antivaho", label: "Sistema antivaho", active: extras.includes("antivaho") },
      ],
    });
  },
};

/* ------------------------------------------------------------------ */
/* Cerramientos                                                        */
/* ------------------------------------------------------------------ */

const cerramientos: CategoryDef = {
  id: "cerramientos",
  service: "cerramientos",
  name: "Cerramiento",
  short: "Terrazas, balcones y porches",
  defaults: { tipoCerramiento: "terraza", material: "aluminio", tipoVidrio: "simple", acabado: "lacado-blanco", cantidad: 1 },
  sections: [
    {
      title: "Tipo y medidas",
      fields: [
        {
          kind: "chips",
          id: "tipoCerramiento",
          label: "Tipo de cerramiento",
          options: [
            { value: "terraza", label: "Terraza" },
            { value: "balcon", label: "Balcón" },
            { value: "porche", label: "Porche" },
            { value: "cortina-cristal", label: "Cortina de cristal" },
          ],
        },
        { kind: "number", id: "ancho", label: "Ancho total", unit: "cm", min: 50, max: 2000, required: true, placeholder: "300" },
        { kind: "number", id: "alto", label: "Alto", unit: "cm", min: 50, max: 400, required: true, placeholder: "250" },
      ],
    },
    {
      title: "Materiales",
      fields: [
        {
          kind: "chips",
          id: "material",
          label: "Material del perfil",
          options: [
            { value: "aluminio", label: "Aluminio" },
            { value: "pvc", label: "PVC" },
            { value: "madera", label: "Madera" },
          ],
        },
        {
          kind: "chips",
          id: "tipoVidrio",
          label: "Tipo de vidrio",
          options: [
            { value: "simple", label: "Simple" },
            { value: "doble", label: "Doble (Climalit)" },
            { value: "bajo-emisivo", label: "Bajo emisivo" },
          ],
        },
        { kind: "select", id: "acabado", label: "Acabado del perfil", options: ACABADOS_PERFIL },
        cantidad("Cantidad de cerramientos"),
        observaciones,
      ],
    },
  ],
  quote(v, c) {
    return m2Quote(this, v, c.cerramientos, { areaLabel: "Cerramiento" });
  },
};

/* ------------------------------------------------------------------ */
/* Aluminio                                                            */
/* ------------------------------------------------------------------ */

const aluminio: CategoryDef = {
  id: "aluminio",
  service: "aluminio",
  name: "Carpintería de aluminio",
  short: "Ventanas, puertas y correderas",
  defaults: { tipoTrabajo: "ventana", tipoApertura: "corredera", acabado: "lacado-blanco", vidrio: "doble", cantidad: 1 },
  sections: [
    {
      title: "Tipo y medidas",
      fields: [
        {
          kind: "chips",
          id: "tipoTrabajo",
          label: "Tipo de trabajo",
          options: [
            { value: "ventana", label: "Ventana" },
            { value: "puerta", label: "Puerta" },
            { value: "mosquitera", label: "Mosquitera" },
            { value: "persiana", label: "Persiana" },
          ],
        },
        {
          kind: "chips",
          id: "tipoApertura",
          label: "Apertura",
          options: [
            { value: "corredera", label: "Corredera" },
            { value: "abatible", label: "Abatible" },
            { value: "oscilobatiente", label: "Oscilobatiente" },
            { value: "fija", label: "Fija" },
          ],
        },
        { kind: "number", id: "ancho", label: "Ancho", unit: "cm", min: 30, max: 600, required: true, placeholder: "150" },
        { kind: "number", id: "alto", label: "Alto", unit: "cm", min: 30, max: 350, required: true, placeholder: "120" },
      ],
    },
    {
      title: "Acabado y vidrio",
      fields: [
        { kind: "select", id: "acabado", label: "Acabado", options: ACABADOS_PERFIL },
        {
          kind: "chips",
          id: "vidrio",
          label: "Vidrio",
          options: [
            { value: "simple", label: "Simple" },
            { value: "doble", label: "Doble (Climalit)" },
            { value: "bajo-emisivo", label: "Bajo emisivo" },
          ],
        },
        cantidad(),
        observaciones,
      ],
    },
  ],
  quote(v, c) {
    return m2Quote(this, v, c.aluminio, { areaLabel: "Carpintería de aluminio" });
  },
};

/* ------------------------------------------------------------------ */
/* Barandillas                                                         */
/* ------------------------------------------------------------------ */

const barandillas: CategoryDef = {
  id: "barandillas",
  service: "barandillas",
  name: "Barandilla",
  short: "Barandillas de vidrio y aluminio",
  defaults: { tipoBarandilla: "escalera", material: "acero-inoxidable", relleno: "cristal", acabado: "pulido", altura: 100, cantidad: 1 },
  sections: [
    {
      title: "Tipo y medidas",
      fields: [
        {
          kind: "chips",
          id: "tipoBarandilla",
          label: "Ubicación",
          options: [
            { value: "escalera", label: "Escalera" },
            { value: "balcon", label: "Balcón" },
            { value: "terraza", label: "Terraza" },
            { value: "piscina", label: "Piscina" },
          ],
        },
        { kind: "number", id: "longitud", label: "Longitud total", unit: "cm", min: 50, max: 5000, required: true, placeholder: "400" },
        { kind: "number", id: "altura", label: "Altura", unit: "cm", min: 50, max: 200, required: true, placeholder: "100" },
      ],
    },
    {
      title: "Materiales",
      fields: [
        {
          kind: "chips",
          id: "relleno",
          label: "Relleno",
          options: [
            { value: "cristal", label: "Cristal" },
            { value: "barrotes", label: "Barrotes" },
            { value: "cable", label: "Cable" },
            { value: "chapa", label: "Chapa" },
          ],
        },
        {
          kind: "chips",
          id: "material",
          label: "Material del perfil",
          options: [
            { value: "acero-inoxidable", label: "Acero inoxidable" },
            { value: "aluminio", label: "Aluminio" },
            { value: "hierro", label: "Hierro forjado" },
          ],
        },
        {
          kind: "chips",
          id: "acabado",
          label: "Acabado",
          options: [
            { value: "pulido", label: "Pulido" },
            { value: "satinado", label: "Satinado" },
            { value: "lacado", label: "Lacado" },
            { value: "negro-mate", label: "Negro mate" },
          ],
        },
        observaciones,
      ],
    },
  ],
  quote(v, c) {
    return m2Quote(this, v, c.barandillas, { widthId: "longitud", heightId: "altura", areaLabel: "Barandilla" });
  },
};

/* ------------------------------------------------------------------ */
/* Armarios (puertas correderas de cristal)                            */
/* ------------------------------------------------------------------ */

const armarios: CategoryDef = {
  id: "armarios",
  service: "armarios",
  name: "Puertas de armario",
  short: "Puertas correderas de cristal con estructura",
  defaults: {
    alto: 200,
    ancho: 150,
    profundidad: 60,
    anchoLeja: 150,
    numPuertas: 2,
    tipoMadera: "melamina",
    tipoCristal: "transparente-6",
    acabado: "normal",
  },
  sections: [
    {
      title: "Medidas del hueco",
      fields: [
        {
          kind: "number",
          id: "alto",
          label: "Alto",
          unit: "cm",
          min: 50,
          max: 350,
          required: true,
          hint: "Del suelo al techo del hueco. Si hay falso techo, mide hasta él.",
        },
        {
          kind: "number",
          id: "ancho",
          label: "Ancho",
          unit: "cm",
          min: 50,
          max: 500,
          required: true,
          hint: "De pared a pared. Mide arriba, en medio y abajo, y usa la medida menor.",
        },
        {
          kind: "number",
          id: "profundidad",
          label: "Profundidad aproximada",
          unit: "cm",
          min: 30,
          max: 100,
          required: true,
          hint: "Desde la pared hacia fuera. Lo estándar son 60 cm.",
        },
        {
          kind: "number",
          id: "anchoLeja",
          label: "Ancho de la leja superior",
          unit: "cm",
          min: 30,
          max: 500,
          required: true,
          hint: "Normalmente coincide con el ancho total del armario.",
        },
      ],
    },
    {
      title: "Puertas y materiales",
      fields: [
        {
          kind: "chips",
          id: "numPuertas",
          label: "Número de puertas",
          hint: "Recomendado: 2 puertas para armarios de hasta 200 cm de ancho.",
          options: ["1", "2", "3", "4", "5", "6"].map((n) => ({ value: n, label: n })),
        },
        {
          kind: "select",
          id: "tipoCristal",
          label: "Cristal de las puertas",
          hint: "Cristal templado. 6 mm es estándar; 8 mm, más robusto. El mate da privacidad.",
          options: [
            { value: "transparente-6", label: "Transparente 6 mm" },
            { value: "mate-6", label: "Mate 6 mm" },
            { value: "bronce-6", label: "Bronce 6 mm" },
            { value: "transparente-8", label: "Transparente 8 mm" },
            { value: "mate-8", label: "Mate 8 mm" },
          ],
        },
        {
          kind: "chips",
          id: "acabado",
          label: "Acabado del cristal",
          hint: "Pintado: color personalizado. Vinilado: lámina decorativa.",
          options: [
            { value: "normal", label: "Normal" },
            { value: "pintado", label: "Pintado" },
            { value: "vinilado", label: "Vinilado" },
          ],
        },
        {
          kind: "select",
          id: "tipoMadera",
          label: "Madera de la leja",
          options: [
            { value: "melamina", label: "Melamina" },
            { value: "mdf", label: "MDF" },
            { value: "contrachapado", label: "Contrachapado" },
            { value: "pino", label: "Pino" },
            { value: "roble", label: "Roble" },
          ],
        },
        observaciones,
      ],
    },
  ],
  quote(v, c) {
    const missing = checkRequired(this, v);
    if (missing.length) return { total: 0, ready: false, missing, lines: [], pending: [] };
    const a = c.armarios;
    const alto = num(v.alto);
    const ancho = num(v.ancho);
    const prof = num(v.profundidad);
    const leja = num(v.anchoLeja);
    const n = Math.max(1, Math.round(num(v.numPuertas) || 2));

    // Geometría de la web anterior.
    const doorW = ancho / n + 4;
    const doorH = alto > 290 ? 321 : alto + 10;
    const doorM2 = (doorH / 100) * (doorW / 100);
    const adjW = ancho - 0.5;
    const adjH = alto - 0.5;
    const frameMl = (2 * adjH + 2 * adjW) / 100;
    const guideMl = (2 * adjW - 16) / 200;

    const puertas =
      a.casacaMl * (doorW / 100) * n +
      (a.cristalM2[str(v.tipoCristal)] ?? 0) * doorM2 * n +
      a.rueda * 2 * n +
      a.tapeta * 2 * n +
      a.tirador * n;
    const acabado = (a.acabadoM2[str(v.acabado)] ?? 0) * doorM2 * n;
    const marco = a.tubo4040Ml * frameMl + a.guiaSuperiorMl * guideMl + a.guiaInferiorMl * guideMl;
    const lejaPrice = (a.maderaM2[str(v.tipoMadera)] ?? 0) * (prof / 100) * (leja / 100) + a.tubo6040Ml * (leja / 100);

    const lines: QuoteLine[] = [
      { label: `Puertas de cristal (${n})`, amount: round2(puertas), detail: `${doorW.toFixed(1)} × ${doorH.toFixed(1)} cm cada una` },
      ...(acabado > 0 ? [{ label: "Acabado del cristal", amount: round2(acabado) }] : []),
      { label: "Marco y guías", amount: round2(marco) },
      { label: "Leja superior", amount: round2(lejaPrice), detail: `${leja} × ${prof} cm` },
    ];
    return { total: Math.round(lines.reduce((s, l) => s + (l.amount ?? 0), 0)), ready: true, missing: [], lines, pending: [] };
  },
};

/* ------------------------------------------------------------------ */
/* Otros: cristal suelto a medida                                      */
/* ------------------------------------------------------------------ */

const otros: CategoryDef = {
  id: "otros",
  service: "otros",
  name: "Cristal a medida",
  short: "Cristales sueltos y trabajos especiales",
  defaults: { ancho: 100, alto: 100, grosor: "6", tipoCristal: "templado", cantos: "pulido", taladros: 0, herrajes: "none", cantidad: 1 },
  sections: [
    {
      title: "Medidas",
      fields: [
        { kind: "number", id: "ancho", label: "Ancho", unit: "cm", min: 10, max: 500, required: true },
        { kind: "number", id: "alto", label: "Alto", unit: "cm", min: 10, max: 500, required: true },
      ],
    },
    {
      title: "Cristal",
      fields: [
        {
          kind: "chips",
          id: "tipoCristal",
          label: "Tipo de cristal",
          options: [
            { value: "float", label: "Float (básico)" },
            { value: "templado", label: "Templado" },
            { value: "laminado", label: "Laminado" },
            { value: "climalit", label: "Climalit" },
            { value: "acustico", label: "Acústico" },
          ],
        },
        {
          kind: "chips",
          id: "grosor",
          label: "Grosor",
          options: ["4", "6", "8", "10", "12"].map((g) => ({ value: g, label: `${g} mm` })),
        },
        {
          kind: "chips",
          id: "cantos",
          label: "Cantos",
          options: [
            { value: "recto", label: "Recto" },
            { value: "pulido", label: "Pulido" },
            { value: "bisel", label: "Biselado" },
          ],
        },
      ],
    },
    {
      title: "Mecanizado",
      fields: [
        { kind: "number", id: "taladros", label: "Taladros / encajes", unit: "ud.", min: 0, max: 20 },
        {
          kind: "chips",
          id: "herrajes",
          label: "Herrajes",
          options: [
            { value: "none", label: "Sin herrajes" },
            { value: "basic", label: "Básicos" },
            { value: "premium", label: "Premium" },
          ],
        },
        cantidad(),
        observaciones,
      ],
    },
  ],
  quote(v, c) {
    const base = m2Quote(this, v, c.otros, { areaLabel: "Cristal a medida" });
    if (!base.ready) return base;
    const n = qty(v);
    const taladros = Math.max(0, Math.round(num(v.taladros)));
    const herraje = c.otros.hardware[str(v.herrajes)] ?? 0;
    if (taladros) base.lines.push({ label: "Taladros / encajes", amount: taladros * (c.otros.extras.taladro ?? 0) * n, detail: `${taladros} ud.` });
    if (herraje) base.lines.push({ label: "Herrajes", amount: herraje * n });
    base.total = Math.round(base.lines.reduce((s, l) => s + (l.amount ?? 0), 0));
    return base;
  },
};

/* ------------------------------------------------------------------ */
/* Registro                                                            */
/* ------------------------------------------------------------------ */

export const categories = { mamparas, domino, espejos, cerramientos, aluminio, barandillas, armarios, otros };
export type CategoryId = keyof typeof categories;
export const categoryList = Object.values(categories);

/** Modelos estándar de mampara (web anterior). El precio «desde» se calcula con la fórmula a medida. */
export const mamparaModels = [
  { id: "frontal-100", name: "Frontal 100 cm", description: "Mampara frontal fija + puerta corredera", values: { tipoMampara: "frontal", ancho: 100, alto: 195, composicion: "fijo-puerta", perfileria: "minima", acabadoPerfil: "cromo", cristal: "templado-8mm" } },
  { id: "frontal-120", name: "Frontal 120 cm", description: "Mampara frontal de 2 puertas correderas", values: { tipoMampara: "frontal", ancho: 120, alto: 195, composicion: "dos-puertas", perfileria: "minima", acabadoPerfil: "cromo", cristal: "templado-8mm" } },
  { id: "esquina-80x80", name: "Esquina 80 × 80 cm", description: "Mampara angular con puerta", values: { tipoMampara: "esquina", ancho: 80, alto: 195, composicion: "esquina-l", perfileria: "completa", acabadoPerfil: "cromo", cristal: "templado-6mm" } },
  { id: "banera-150", name: "Bañera 150 cm", description: "Mampara sobre bañera de 2 hojas", values: { tipoMampara: "banera", ancho: 150, alto: 150, composicion: "dos-puertas", perfileria: "completa", acabadoPerfil: "blanco", cristal: "templado-6mm" } },
  { id: "panel-fijo-100", name: "Panel fijo 100 cm", description: "Panel de cristal fijo para walk-in", values: { tipoMampara: "panel-fijo", ancho: 100, alto: 200, composicion: "fijo", perfileria: "sin-perfil", acabadoPerfil: "negro", cristal: "templado-10mm" } },
  { id: "frontal-140", name: "Frontal 140 cm Premium", description: "Mampara frontal corredera con acabado negro", values: { tipoMampara: "frontal", ancho: 140, alto: 200, composicion: "corredera", perfileria: "minima", acabadoPerfil: "negro", cristal: "templado-8mm" } },
] as const;
