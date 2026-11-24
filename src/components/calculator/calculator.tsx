"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  FileText,
  Info,
  Package,
  Printer,
  Ruler,
  Send,
  Store,
  Truck,
  Wrench,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldRenderer } from "@/components/calculator/field-renderer";
import { BookingForm } from "@/components/forms/booking-form";
import { QuoteRequestForm } from "@/components/forms/quote-request-form";
import { NumberTicker } from "@/components/motion/number-ticker";
import { ServiceIcon } from "@/components/site/service-icon";
import { useWeb } from "@/components/site/web-provider";
import { TravelCost, type TravelResult } from "@/components/tools/travel-cost";
import { servicePhotos } from "@/content/images";
import type { ServiceSlug } from "@/content/services";
import { whatsappLink } from "@/content/site";
import {
  mamparaModels,
  visibleFields,
  type CategoryDef,
  type CategoryId,
  type Values,
} from "@/lib/pricing/categories";
import { buildQuoteMessage, deliveryLabels, selectedOptions, type Delivery } from "@/lib/pricing/message";
import { usePricing } from "@/lib/pricing/use-pricing";
import { quoteRequestsEnabled } from "@/lib/requests";
import { registrarCalculadora } from "@/lib/actividad";
import { cn } from "@/lib/utils";

const STEPS = ["Servicio", "Configura", "Visita y entrega", "Resumen"] as const;

const eur = (n: number) => `${n.toLocaleString("es-ES", { maximumFractionDigits: 2 })} €`;

/**
 * Un modelo estándar solo se ofrece si todas sus opciones siguen existiendo en
 * el catálogo (el panel puede ocultar opciones de un campo).
 */
function modelAvailable(def: CategoryDef, values: Values) {
  return def.sections
    .flatMap((s) => s.fields)
    .every((f) => {
      if (!(f.kind === "chips" || f.kind === "select") || !(f.id in values)) return true;
      return f.options.some((o) => o.value === String(values[f.id]));
    });
}

/**
 * Punto de entrada: lee ?servicio= y monta la calculadora con ese servicio
 * preseleccionado (si está visible). La `key` fuerza un estado limpio si cambia
 * el parámetro.
 */
export function Calculator() {
  const params = useSearchParams();
  const { activas } = usePricing();
  const s = params.get("servicio");
  const initial = s && (activas as string[]).includes(s) ? (s as CategoryId) : null;
  return <CalculatorInner key={initial ?? "none"} initial={initial} />;
}

function CalculatorInner({ initial }: { initial: CategoryId | null }) {
  const { precios: config, categorias: categories, activas } = usePricing();
  const { site } = useWeb();
  const topRef = useRef<HTMLDivElement>(null);

  const [catId, setCatId] = useState<CategoryId | null>(initial);
  const [mode, setMode] = useState<"medida" | "modelos">("medida");
  const [modelId, setModelId] = useState<string | null>(null);
  const [values, setValues] = useState<Values>(() => (initial ? { ...categories[initial].defaults } : {}));
  const [step, setStep] = useState(initial ? 1 : 0);
  const [showErrors, setShowErrors] = useState(false);
  const [travel, setTravel] = useState<TravelResult | null>(null);
  const [delivery, setDelivery] = useState<Delivery>("instalacion");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const def = catId ? categories[catId] : null;
  const quote = useMemo(() => (def ? def.quote(values, config) : null), [def, values, config]);
  const models = useMemo(() => mamparaModels.filter((m) => modelAvailable(categories.mamparas, m.values)), [categories]);
  const model = models.find((m) => m.id === modelId);

  function scrollTop() {
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  // Actividad para Logs del panel: servicio, paso y precio calculado (nunca medidas ni datos del cliente).
  const calculadoRef = useRef<string | null>(null);
  useEffect(() => {
    registrarCalculadora("inicio", { categoria: initial, paso: initial ? 2 : 1 });
  }, [initial]);

  function go(next: number, categoria: CategoryId | null = catId) {
    if (next !== step) {
      if (next === 0 && step > 0) registrarCalculadora("reiniciar", { categoria, paso: 1 });
      else registrarCalculadora("paso", { categoria, paso: next + 1 });
    }
    setStep(next);
    scrollTop();
  }

  function choose(id: CategoryId, keepMode = false) {
    registrarCalculadora("categoria", { categoria: id, paso: 2 });
    setCatId(id);
    setValues({ ...categories[id].defaults });
    setModelId(null);
    if (!keepMode) setMode("medida");
    setShowErrors(false);
    go(1, id);
  }

  function update(id: string, value: Values[string]) {
    setValues((v) => ({ ...v, [id]: value }));
  }

  function pickModel(id: string) {
    const m = models.find((x) => x.id === id)!;
    setModelId(id);
    setValues({ ...categories.mamparas.defaults, ...m.values });
  }

  function next() {
    if (step === 1) {
      if (!quote?.ready) {
        setShowErrors(true);
        requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid=true], [role=alert]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
        return;
      }
      // Precio calculado: el visitante ha configurado el trabajo y sigue adelante con ese precio (una vez por precio).
      const clave = `${catId}|${quote.total}`;
      if (calculadoRef.current !== clave) {
        calculadoRef.current = clave;
        registrarCalculadora("calculado", { categoria: catId, paso: 3, total: quote.total });
      }
    }
    go(Math.min(step + 1, 3));
  }

  const envio = delivery === "envio" ? config.entrega.envio : 0;
  const grandTotal = (quote?.ready ? quote.total : 0) + envio;

  const message =
    def && quote
      ? buildQuoteMessage({
          def,
          values,
          quote,
          model: model?.name,
          travel,
          delivery: step >= 2 ? delivery : undefined,
          envio: config.entrega.envio,
          montaje: { min: config.entrega.montajeMin, max: config.entrega.montajeMax },
        })
      : "";

  return (
    <div ref={topRef} className="scroll-mt-28" data-zona="calculadora">
      {/* Indicador de pasos */}
      <nav aria-label="Pasos de la calculadora" className="mb-8 print:hidden">
        <ol className="flex items-center gap-2 overflow-x-auto pb-1 sm:gap-3">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            const clickable = i < step;
            return (
              <li key={label} className="flex shrink-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && go(i)}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition-colors",
                    !current && "pr-1.5 sm:pr-4",
                    current && "border-navy-900 bg-navy-900 text-cream-100",
                    done && "cursor-pointer border-navy-900/20 bg-cream-50 text-navy-900 hover:border-navy-900/40",
                    !current && !done && "border-navy-900/10 text-ink-soft",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-full text-xs font-medium",
                      current ? "bg-cream-200 text-navy-900" : done ? "bg-navy-900 text-cream-100" : "bg-navy-900/5",
                    )}
                  >
                    {done ? <Check aria-hidden className="size-3.5" /> : i + 1}
                  </span>
                  {/* En móvil solo se lee el nombre del paso actual */}
                  <span className={cn(!current && "sr-only sm:not-sr-only")}>{label}</span>
                </button>
                {i < STEPS.length - 1 && <span aria-hidden className="h-px w-4 bg-navy-900/15 sm:w-8" />}
              </li>
            );
          })}
        </ol>
        <p className="sr-only" aria-live="polite">
          Paso {step + 1} de {STEPS.length}: {STEPS[step]}
        </p>
      </nav>

      <div className={cn("grid gap-8", step > 0 && "lg:grid-cols-[minmax(0,1fr)_380px]")}>
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${step}-${catId}-${mode}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* PASO 1: servicio */}
              {step === 0 && (
                <div>
                  <h2 className="text-2xl font-medium sm:text-3xl">¿Qué necesitas?</h2>
                  <p className="mt-2 text-ink-soft">Elige el tipo de trabajo. Podrás cambiarlo en cualquier momento.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {activas.map((id) => {
                      const c = categories[id];
                      const photo = servicePhotos[c.service as ServiceSlug].cover;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => choose(c.id as CategoryId)}
                          className="group cursor-pointer overflow-hidden rounded-2xl border border-navy-900/10 bg-cream-50 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-900/30 hover:shadow-[0_20px_40px_-24px_rgb(6_26_46/0.45)]"
                        >
                          <span className="relative block aspect-[16/10] overflow-hidden">
                            <Image
                              src={photo.src}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          </span>
                          <span className="flex items-start gap-3 p-4">
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-navy-900 text-cream-200">
                              <ServiceIcon slug={c.service as ServiceSlug} className="size-[18px]" />
                            </span>
                            <span>
                              <span className="block font-heading text-lg font-medium text-navy-900">{c.name}</span>
                              <span className="block text-sm leading-snug text-ink-soft">{c.short}</span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 2: configurar */}
              {step === 1 && def && (
                <div>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow">Paso 2 de 4</p>
                      <h2 className="mt-2 text-2xl font-medium sm:text-3xl">{def.name}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => go(0)}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm text-navy-900 underline-offset-4 hover:underline"
                    >
                      <ArrowLeft aria-hidden className="size-4" /> Cambiar servicio
                    </button>
                  </div>

                  {catId === "mamparas" && (models.length > 0 || categories.domino.activo) && (
                    <div role="tablist" aria-label="Tipo de mampara" className="mt-5 inline-flex flex-wrap gap-1 rounded-2xl border border-navy-900/10 bg-cream-50 p-1">
                      {[
                        { id: "medida", label: "A medida", icon: Ruler },
                        ...(models.length ? [{ id: "modelos", label: "Modelos estándar", icon: Package }] : []),
                      ].map((t) => (
                        <button
                          key={t.id}
                          role="tab"
                          aria-selected={mode === t.id}
                          onClick={() => setMode(t.id as "medida" | "modelos")}
                          className={cn(
                            "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors",
                            mode === t.id ? "bg-navy-900 text-cream-100 shadow-layered" : "text-navy-900 hover:bg-cream-200/50",
                          )}
                        >
                          <t.icon aria-hidden className="size-4" /> {t.label}
                        </button>
                      ))}
                      {categories.domino.activo && (
                        <button
                          role="tab"
                          aria-selected={false}
                          onClick={() => choose("domino")}
                          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-medium text-navy-900 hover:bg-cream-200/50"
                        >
                          <ServiceIcon slug="domino" className="size-4" /> Dominó
                        </button>
                      )}
                    </div>
                  )}

                  {catId === "mamparas" && mode === "modelos" && models.length > 0 ? (
                    <div className="mt-6">
                      <p className="text-ink-soft">
                        Nuestros modelos más populares, listos para instalar. Todos incluyen cristal templado de seguridad y herrajes
                        de calidad. Puedes personalizar medidas y acabados.
                      </p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {models.map((m) => {
                          const price = categories.mamparas.quote({ ...categories.mamparas.defaults, ...m.values }, config).total;
                          const selected = modelId === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => pickModel(m.id)}
                              aria-pressed={selected}
                              className={cn(
                                "relative cursor-pointer rounded-2xl border p-5 text-left transition-all",
                                selected ? "border-navy-900 bg-navy-900 text-cream-100 shadow-layered" : "border-navy-900/10 bg-cream-50 hover:border-navy-900/30",
                              )}
                            >
                              {selected && (
                                <span className="absolute right-4 top-4 grid size-6 place-items-center rounded-full bg-cream-200 text-navy-900">
                                  <Check aria-hidden className="size-3.5" />
                                </span>
                              )}
                              <span className={cn("block font-heading text-lg font-medium", selected ? "text-cream-100" : "text-navy-900")}>{m.name}</span>
                              <span className={cn("mt-1 block text-sm", selected ? "text-cream-100/75" : "text-ink-soft")}>{m.description}</span>
                              <span className={cn("mt-3 block text-sm", selected ? "text-cream-100/75" : "text-ink-soft")}>
                                {m.values.ancho} × {m.values.alto} cm · Templado {m.values.cristal.replace("templado-", "")}
                              </span>
                              <span className={cn("mt-3 block font-heading text-2xl", selected ? "text-cream-200" : "text-navy-900")}>
                                <span className="text-sm font-normal opacity-70">Desde </span>
                                {eur(price)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {modelId && (
                        <button
                          type="button"
                          onClick={() => setMode("medida")}
                          className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium text-navy-900 underline underline-offset-4"
                        >
                          <Ruler aria-hidden className="size-4" /> Personalizar medidas y acabados de este modelo
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {def.sections.map((section) => {
                        const fields = section.fields.filter((f) => !f.when || f.when(values));
                        if (!fields.length) return null;
                        return (
                          <fieldset key={section.title} className="rounded-2xl border border-navy-900/10 bg-cream-50/80 p-5 sm:p-6">
                            <legend className="sr-only">{section.title}</legend>
                            <h3 aria-hidden className="font-heading text-lg font-medium">
                              {section.title}
                            </h3>
                            <div className="mt-4 grid gap-5 sm:grid-cols-2">
                              {fields.map((f) => (
                                <div
                                  key={f.id}
                                  className={cn(
                                    (f.kind === "chips" || f.kind === "multi" || f.kind === "textarea" || f.kind === "toggle") && "sm:col-span-2",
                                  )}
                                >
                                  <FieldRenderer field={f} values={values} onChange={update} showErrors={showErrors} />
                                </div>
                              ))}
                            </div>
                          </fieldset>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PASO 3: visita y entrega */}
              {step === 2 && def && (
                <div className="space-y-6">
                  <div>
                    <p className="eyebrow">Paso 3 de 4</p>
                    <h2 className="mt-2 text-2xl font-medium sm:text-3xl">Visita técnica y entrega</h2>
                  </div>
                  <section className="rounded-2xl border border-navy-900/10 bg-cream-50/80 p-5 sm:p-6">
                    <h3 className="font-heading text-lg font-medium">¿Dónde es el trabajo?</h3>
                    <div className="mt-3">
                      <TravelCost value={travel} onChange={setTravel} />
                    </div>
                  </section>
                  <section className="rounded-2xl border border-navy-900/10 bg-cream-50/80 p-5 sm:p-6">
                    <h3 className="font-heading text-lg font-medium">¿Cómo quieres recibirlo?</h3>
                    <div role="radiogroup" aria-label="Forma de entrega" className="mt-4 grid gap-3 sm:grid-cols-3">
                      {(
                        [
                          { id: "instalacion", icon: Wrench, extra: `Montaje orientativo ${config.entrega.montajeMin}–${config.entrega.montajeMax} €` },
                          { id: "envio", icon: Truck, extra: `${config.entrega.envio} €` },
                          { id: "recogida", icon: Store, extra: "Sin coste" },
                        ] as const
                      ).map((o) => {
                        const checked = delivery === o.id;
                        return (
                          <label
                            key={o.id}
                            className={cn(
                              "flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition-all has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-navy-700/30",
                              checked ? "border-navy-900 bg-navy-900 text-cream-100 shadow-layered" : "border-input bg-white hover:border-navy-900/35",
                            )}
                          >
                            <input type="radio" name="delivery" className="sr-only" checked={checked} onChange={() => setDelivery(o.id)} />
                            <o.icon aria-hidden className={cn("size-5", checked ? "text-cream-200" : "text-navy-700")} />
                            <span className="text-[15px] font-medium leading-snug">{deliveryLabels[o.id]}</span>
                            <span className={cn("text-sm", checked ? "text-cream-100/75" : "text-ink-soft")}>{o.extra}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-3 flex items-start gap-1.5 text-[13px] text-ink-soft">
                      <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                      El pre-montaje en nuestro taller está siempre incluido en el precio.
                    </p>
                  </section>
                </div>
              )}

              {/* PASO 4: resumen */}
              {step === 3 && def && quote && (
                <div className="space-y-6">
                  <div>
                    <p className="eyebrow print:hidden">Paso 4 de 4</p>
                    <h2 className="mt-2 text-2xl font-medium sm:text-3xl">Tu presupuesto orientativo</h2>
                    <p className="mt-2 text-ink-soft">Revisa los datos y envíanoslos. Te confirmaremos el precio final tras la visita técnica.</p>
                  </div>

                  <section className="rounded-2xl border border-navy-900/10 bg-cream-50/80 p-5 sm:p-6">
                    <h3 className="font-heading text-lg font-medium">
                      {def.name}
                      {model && <span className="text-ink-soft"> · {model.name}</span>}
                    </h3>
                    <dl className="mt-4 grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
                      {selectedOptions(def, values).map((o) => (
                        <div key={o.label} className="flex justify-between gap-4 border-b border-navy-900/5 py-1.5">
                          <dt className="text-ink-soft">{o.label}</dt>
                          <dd className="text-right font-medium text-navy-900">{o.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <div className={cn("grid gap-3 print:hidden", quoteRequestsEnabled && quote.ready ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
                    {quoteRequestsEnabled && quote.ready && (
                      <button
                        type="button"
                        onClick={() => setRequestOpen(true)}
                        data-actividad="solicitar-presupuesto"
                        className="inline-flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 font-medium text-cream-100 shadow-layered transition-colors hover:bg-navy-800"
                      >
                        <FileText aria-hidden className="size-5" /> Solicitar presupuesto
                      </button>
                    )}
                    <a
                      href={whatsappLink(message, site.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-actividad="presupuesto-whatsapp"
                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 font-medium text-white shadow-layered transition hover:brightness-110"
                    >
                      <Send aria-hidden className="size-5" /> Enviar por WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => setBookingOpen(true)}
                      data-actividad="reservar-visita"
                      className={cn(
                        "inline-flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 font-medium transition-colors",
                        quoteRequestsEnabled && quote.ready
                          ? "border border-navy-900/15 bg-cream-50 text-navy-900 hover:border-navy-900/35"
                          : "bg-navy-900 text-cream-100 shadow-layered hover:bg-navy-800",
                      )}
                    >
                      <CalendarCheck aria-hidden className="size-5" /> Reservar visita técnica
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      data-actividad="imprimir-presupuesto"
                      className="inline-flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border border-navy-900/15 bg-cream-50 px-4 font-medium text-navy-900 transition-colors hover:border-navy-900/35"
                    >
                      <Printer aria-hidden className="size-5" /> Imprimir / PDF
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navegación inferior (escritorio) */}
          {step > 0 && step < 3 && (
            <div className="mt-8 hidden items-center justify-between lg:flex print:hidden">
              <button
                type="button"
                onClick={() => go(step - 1)}
                className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-4 font-medium text-navy-900 hover:bg-cream-200/50"
              >
                <ArrowLeft aria-hidden className="size-4" /> Atrás
              </button>
              <button
                type="button"
                onClick={next}
                className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-navy-900 px-6 font-medium text-cream-100 shadow-layered hover:bg-navy-800"
              >
                {step === 1 ? "Continuar: visita y entrega" : "Ver resumen"} <ArrowRight aria-hidden className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* Panel de precio */}
        {step > 0 && def && quote && (
          <aside aria-label="Precio orientativo" className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-3xl bg-navy-900 text-cream-100 shadow-[0_30px_60px_-30px_rgb(6_26_46/0.7)]">
              <div className="relative p-6">
                <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-navy-600/40 blur-2xl" />
                <p className="text-xs uppercase tracking-[0.14em] text-cream-200/80">Precio orientativo</p>
                <p className="mt-2 font-heading text-5xl font-medium text-cream-200">
                  {quote.ready ? (
                    <>
                      <NumberTicker value={grandTotal} live />
                      <span className="ml-1 text-3xl">€</span>
                    </>
                  ) : (
                    <span className="text-2xl text-cream-100/70">Completa los datos</span>
                  )}
                </p>
                {!quote.ready && quote.missing.length > 0 && showErrors && (
                  <p className="mt-2 text-sm text-red-200">Falta: {quote.missing.join(", ")}</p>
                )}
                <p className="mt-2 text-[13px] text-cream-100/70">{config.priceNote}</p>
              </div>

              {quote.ready && (
                <div className="space-y-2 border-t border-cream-200/10 bg-navy-950/40 p-6 text-sm">
                  {quote.lines.map((l) => (
                    <div key={l.label} className="flex justify-between gap-4">
                      <span className="text-cream-100/80">
                        {l.label}
                        {l.detail && <span className="block text-xs text-cream-100/50">{l.detail}</span>}
                      </span>
                      <span className="shrink-0 tabular-nums">{l.amount != null ? eur(l.amount) : "—"}</span>
                    </div>
                  ))}
                  {quote.pending.map((p) => (
                    <div key={p} className="flex justify-between gap-4 text-cream-100/70">
                      <span>{p}</span>
                      <span className="shrink-0 text-xs">Se valora en la visita</span>
                    </div>
                  ))}
                  {step >= 2 && (
                    <>
                      <div className="my-2 h-px bg-cream-200/10" />
                      <div className="flex justify-between gap-4">
                        <span className="text-cream-100/80">Pre-montaje en taller</span>
                        <span>Incluido</span>
                      </div>
                      {delivery === "envio" && (
                        <div className="flex justify-between gap-4">
                          <span className="text-cream-100/80">Envío a domicilio</span>
                          <span className="tabular-nums">{eur(config.entrega.envio)}</span>
                        </div>
                      )}
                      {delivery === "instalacion" && (
                        <div className="flex justify-between gap-4">
                          <span className="text-cream-100/80">Montaje (no incluido)</span>
                          <span className="shrink-0">
                            {config.entrega.montajeMin}–{config.entrega.montajeMax} €
                          </span>
                        </div>
                      )}
                      {travel && (
                        <div className="flex justify-between gap-4">
                          <span className="text-cream-100/80">Visita técnica · {travel.place}</span>
                          <span className="shrink-0 tabular-nums">{travel.free ? "Gratis" : eur(travel.cost)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Barra inferior móvil */}
      {step > 0 && step < 3 && def && quote && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-900/10 bg-cream-50/95 px-4 py-3 shadow-[0_-12px_30px_-18px_rgb(6_26_46/0.4)] [backdrop-filter:blur(14px)] lg:hidden print:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <button type="button" onClick={() => go(step - 1)} aria-label="Atrás" className="grid size-12 cursor-pointer place-items-center rounded-xl border border-navy-900/15 text-navy-900">
              <ArrowLeft className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-soft">Precio orientativo</p>
              <p className="font-heading text-2xl font-medium text-navy-900">{quote.ready ? eur(grandTotal) : "—"}</p>
            </div>
            <button
              type="button"
              onClick={next}
              className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-navy-900 px-5 font-medium text-cream-100 shadow-layered"
            >
              {step === 1 ? "Continuar" : "Resumen"} <ArrowRight aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      )}

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto bg-cream-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-navy-900">Reservar visita técnica</DialogTitle>
            <DialogDescription>Déjanos tus datos y te llamamos para confirmar el día y la hora.</DialogDescription>
          </DialogHeader>
          {def && quote && (
            <BookingForm
              service={def.name}
              travel={travel}
              quote={quote.ready ? { category: def.name, total: grandTotal, summary: message } : null}
              onDone={() => setBookingOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto bg-cream-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-navy-900">Solicitar presupuesto</DialogTitle>
            <DialogDescription>
              {def && quote?.ready ? `${def.name}: ${eur(grandTotal)} orientativos. ` : ""}Déjanos tus datos: revisamos el presupuesto y te
              llamamos para confirmarlo y concertar la visita técnica.
            </DialogDescription>
          </DialogHeader>
          {def && catId && quote?.ready && (
            <QuoteRequestForm
              categoria={catId}
              valores={values}
              total={quote.total}
              resumen={message}
              town={travel?.place}
              onDone={() => setRequestOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Datos para impresión */}
      {step === 3 && def && quote?.ready && (
        <p className="mt-8 hidden text-sm print:block">
          Generado en cristaleriabaixvinalopo.es · {visibleFields(def, values).length} opciones · {new Date().toLocaleDateString("es-ES")}
        </p>
      )}
    </div>
  );
}
