"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, Send, TriangleAlert } from "lucide-react";
import { Field, TextArea, TextInput } from "@/components/forms/fields";
import { ConsentCheckbox, Honeypot } from "@/components/forms/consent";
import { CasillaNewsletter } from "@/components/newsletter/casilla";
import { useWeb } from "@/components/site/web-provider";
import { whatsappLink } from "@/content/site";
import { submitQuoteRequest, validators } from "@/lib/requests";
import { CASILLA_PRESUPUESTO, suscribir } from "@/lib/newsletter";
import { useFormularioActividad } from "@/lib/actividad/react";

type Errors = Partial<Record<"name" | "phone" | "email" | "consent", string>>;

/**
 * Solicitud de presupuesto desde el resumen de la calculadora. Se guarda en el
 * gestor de presupuestos del panel (edge function `web-solicitud-presupuesto`)
 * y muestra el número de solicitud; si falla, ofrece enviarla por WhatsApp.
 * Casilla opcional (sin marcar) para recibir también la newsletter: tras guardar
 * la solicitud se apunta con doble opt-in (le llega un correo para confirmar).
 */
export function QuoteRequestForm({
  categoria,
  valores,
  total,
  resumen,
  town,
  onDone,
}: {
  categoria: string;
  valores: Record<string, unknown>;
  total: number;
  resumen: string;
  town?: string;
  onDone?: () => void;
}) {
  const { site, newsletter: newsletterActiva } = useWeb();
  const [form, setForm] = useState({ name: "", phone: "", email: "", town: town ?? "", notes: "", consent: false, newsletter: false, website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<
    { kind: "idle" | "sending" } | { kind: "done"; numero?: string; newsletter?: { ok: boolean; mensaje: string } } | { kind: "error"; message: string }
  >({
    kind: "idle",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const { conectar, onFocusCapture, errorValidacion, envio } = useFormularioActividad("presupuesto");

  const datos = [
    `Nombre: ${form.name.trim()}`,
    `Teléfono: ${form.phone.trim()}`,
    form.email.trim() && `Email: ${form.email.trim()}`,
    form.town.trim() && `Población: ${form.town.trim()}`,
    form.notes.trim() && `Comentarios: ${form.notes.trim()}`,
  ].filter(Boolean);
  const whatsappText = `${resumen}\n\n${datos.join("\n")}`;

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e: Errors = {
      name: validators.name(form.name),
      phone: validators.phone(form.phone),
      email: validators.email(form.email) ?? (newsletterActiva && form.newsletter && !form.email.trim() ? "Escribe tu email para recibir las novedades" : undefined),
      consent: validators.consent(form.consent),
    };
    const clean = Object.fromEntries(Object.entries(e).filter(([, v]) => v)) as Errors;
    setErrors(clean);
    if (Object.keys(clean).length) {
      errorValidacion(Object.keys(clean).length);
      return;
    }
    envio();
    setState({ kind: "sending" });
    const res = await submitQuoteRequest({
      nombre: form.name.trim(),
      telefono: form.phone.trim(),
      email: form.email.trim() || undefined,
      poblacion: form.town.trim() || undefined,
      notas: form.notes.trim() || undefined,
      categoria,
      valores,
      total,
      resumen,
      consentimiento: true,
      website: form.website,
    });
    if (!res.ok) {
      setState({ kind: "error", message: res.error });
      return;
    }
    let newsletter: { ok: boolean; mensaje: string } | undefined;
    if (newsletterActiva && form.newsletter && form.email.trim()) {
      const n = await suscribir({ email: form.email, nombre: form.name, origen: "web_presupuesto", website: form.website });
      newsletter = n.ok
        ? { ok: true, mensaje: "Te hemos enviado un correo para confirmar la suscripción a las novedades." }
        : { ok: false, mensaje: "No hemos podido apuntarte a las novedades ahora mismo; puedes hacerlo desde el pie de la web." };
    }
    setState({ kind: "done", numero: res.numero, newsletter });
  }

  if (state.kind === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
        <CheckCircle2 aria-hidden className="size-12 text-whatsapp" />
        <h3 className="text-2xl font-medium">Solicitud recibida</h3>
        {state.numero && (
          <p className="text-ink-soft">
            Número de solicitud:{" "}
            <strong className="font-heading text-xl font-medium text-navy-900" data-numero-solicitud>
              {state.numero}
            </strong>
          </p>
        )}
        <p className="max-w-sm text-ink-soft">
          Gracias, {form.name.trim().split(" ")[0]}. Revisaremos tu presupuesto y te llamaremos para confirmarlo y concertar la visita
          técnica.
        </p>
        {state.newsletter && <p className="max-w-sm text-sm text-ink-soft">{state.newsletter.mensaje}</p>}
        {onDone && (
          <button onClick={onDone} className="mt-2 min-h-11 cursor-pointer rounded-lg px-4 font-medium text-navy-900 underline underline-offset-4">
            Cerrar
          </button>
        )}
      </div>
    );
  }

  return (
    <form ref={conectar} onFocusCapture={onFocusCapture} onSubmit={onSubmit} noValidate className="relative space-y-4">
      <Honeypot value={form.website} onChange={(v) => set("website", v)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" required error={errors.name}>
          {(p) => <TextInput {...p} autoComplete="name" maxLength={120} value={form.name} onChange={(e) => set("name", e.target.value)} />}
        </Field>
        <Field label="Teléfono" required error={errors.phone}>
          {(p) => (
            <TextInput {...p} type="tel" autoComplete="tel" inputMode="tel" maxLength={30} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          )}
        </Field>
        <Field label="Email" error={errors.email} hint="Opcional, para enviarte el presupuesto detallado.">
          {(p) => <TextInput {...p} type="email" autoComplete="email" maxLength={200} value={form.email} onChange={(e) => set("email", e.target.value)} />}
        </Field>
        <Field label="Población">
          {(p) => (
            <TextInput {...p} autoComplete="address-level2" maxLength={120} placeholder="Ej.: Elche" value={form.town} onChange={(e) => set("town", e.target.value)} />
          )}
        </Field>
      </div>
      <Field label="Comentarios">
        {(p) => (
          <TextArea
            {...p}
            maxLength={1500}
            placeholder="Cualquier detalle que nos ayude a preparar el presupuesto"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        )}
      </Field>
      <ConsentCheckbox checked={form.consent} onChange={(v) => set("consent", v)} error={errors.consent} />
      {newsletterActiva && (
        <CasillaNewsletter checked={form.newsletter} onChange={(v) => set("newsletter", v)}>
          {CASILLA_PRESUPUESTO}
        </CasillaNewsletter>
      )}

      {state.kind === "error" && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-navy-900">
          <p className="flex items-start gap-2 font-medium">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
            {state.message}
          </p>
          <p className="mt-1 text-ink-soft">Puedes intentarlo de nuevo o enviárnosla por WhatsApp con los mismos datos.</p>
          <a
            href={whatsappLink(whatsappText, site.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-whatsapp px-4 font-medium text-white shadow-layered transition hover:brightness-110"
          >
            <Send aria-hidden className="size-4" /> Enviar por WhatsApp
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={state.kind === "sending"}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 font-medium text-cream-100 shadow-layered transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        {state.kind === "sending" ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : <Send aria-hidden className="size-5" />}
        {state.kind === "error" ? "Reintentar" : "Enviar solicitud"}
      </button>
    </form>
  );
}
