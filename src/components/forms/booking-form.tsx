"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { CalendarCheck, CheckCircle2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { ChoiceChips, Field, TextArea, TextInput } from "@/components/forms/fields";
import { ConsentCheckbox, Honeypot } from "@/components/forms/consent";
import { submitAppointment, validators, type AppointmentRequest } from "@/lib/requests";
import { formulariosSupabase } from "@/lib/backend";
import type { TravelResult } from "@/components/tools/travel-cost";

type Errors = Partial<Record<"name" | "phone" | "email" | "date" | "consent", string>>;

function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const noopSubscribe = () => () => {};
/** Fecha mínima (mañana) solo en el navegador; en el prerender queda sin límite. */
function useMinDate() {
  return useSyncExternalStore(noopSubscribe, minDate, () => undefined);
}

/** Formulario para solicitar la visita técnica (toma de medidas). */
export function BookingForm({
  service,
  travel,
  quote,
  onDone,
}: {
  service?: string;
  travel?: TravelResult | null;
  quote?: AppointmentRequest["quote"];
  onDone?: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    date: "",
    slot: "" as "" | "manana" | "tarde",
    notes: "",
    consent: false,
    website: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const min = useMinDate();
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function validate(): Errors {
    const e: Errors = {
      name: validators.name(form.name),
      phone: validators.phone(form.phone),
      email: validators.email(form.email),
      consent: validators.consent(form.consent),
    };
    if (form.date) {
      const day = new Date(`${form.date}T12:00:00`).getDay();
      if (day === 0 || day === 6) e.date = "Trabajamos de lunes a viernes; elige un día laborable";
      else if (form.date < minDate()) e.date = "Elige una fecha a partir de mañana";
    }
    return Object.fromEntries(Object.entries(e).filter(([, v]) => v)) as Errors;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setState("sending");
    const res = await submitAppointment({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      town: travel?.place,
      address: form.address.trim() || undefined,
      preferredDate: form.date || undefined,
      preferredSlot: form.slot,
      service,
      notes: form.notes.trim() || undefined,
      distanceKm: travel?.km ?? null,
      visitCost: travel ? travel.cost : null,
      quote: quote ?? null,
      consent: form.consent,
      website: form.website,
    });
    if (!res.ok) {
      setState("idle");
      toast.error(res.error, { description: "Inténtalo de nuevo o llámanos al 650 06 63 23." });
      return;
    }
    setState("done");
    if (res.via === "whatsapp") toast.success("Te llevamos a WhatsApp para enviar la solicitud");
    else toast.success("¡Solicitud recibida!", { description: "Te llamaremos para confirmar la fecha." });
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 aria-hidden className="size-12 text-whatsapp" />
        <h3 className="text-2xl font-medium">Solicitud enviada</h3>
        <p className="max-w-sm text-ink-soft">
          Gracias, {form.name.split(" ")[0]}. Te llamaremos para confirmar el día y la hora de la visita técnica.
        </p>
        {onDone && (
          <button onClick={onDone} className="mt-2 min-h-11 cursor-pointer rounded-lg px-4 font-medium text-navy-900 underline underline-offset-4">
            Cerrar
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-4">
      <Honeypot value={form.website} onChange={(v) => set("website", v)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" required error={errors.name}>
          {(p) => <TextInput {...p} autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} />}
        </Field>
        <Field label="Teléfono" required error={errors.phone}>
          {(p) => <TextInput {...p} type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />}
        </Field>
        <Field label="Email" error={errors.email} hint="Opcional, para enviarte el presupuesto detallado.">
          {(p) => <TextInput {...p} type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} />}
        </Field>
        <Field label="Dirección de la obra">
          {(p) => (
            <TextInput
              {...p}
              autoComplete="street-address"
              placeholder={travel?.place ? `Calle, número… (${travel.place})` : "Calle, número y población"}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          )}
        </Field>
        <Field label="Fecha preferida" error={errors.date} hint="De lunes a viernes. Te confirmaremos la hora por teléfono.">
          {(p) => <TextInput {...p} type="date" min={min} value={form.date} onChange={(e) => set("date", e.target.value)} />}
        </Field>
        <Field label="Franja horaria">
          {(p) => (
            <ChoiceChips
              id={p.id}
              name="slot"
              value={form.slot}
              onChange={(v) => set("slot", v)}
              options={[
                { value: "manana", label: "Mañana", hint: "9:00–13:30" },
                { value: "tarde", label: "Tarde", hint: "16:00–19:30" },
              ]}
            />
          )}
        </Field>
      </div>
      <Field label="Comentarios">
        {(p) => (
          <TextArea {...p} maxLength={500} placeholder="Cualquier detalle que nos ayude a preparar la visita" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        )}
      </Field>
      {travel && (
        <p className="rounded-xl bg-cream-200/50 px-4 py-3 text-sm text-navy-900">
          Visita técnica en <strong className="font-medium">{travel.place}</strong>:{" "}
          {travel.free ? "gratuita" : `${travel.cost} € de desplazamiento`}.
        </p>
      )}
      <ConsentCheckbox checked={form.consent} onChange={(v) => set("consent", v)} error={errors.consent} />
      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 font-medium text-cream-100 shadow-layered transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        {state === "sending" ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : <CalendarCheck aria-hidden className="size-5" />}
        {formulariosSupabase ? "Solicitar visita técnica" : "Solicitar visita por WhatsApp"}
      </button>
    </form>
  );
}
