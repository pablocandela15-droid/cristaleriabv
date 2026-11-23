"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { ConsentCheckbox, Honeypot } from "@/components/forms/consent";
import { formulariosSupabase } from "@/lib/backend";
import { submitContact, validators } from "@/lib/requests";
import { services } from "@/content/services";
import { cn } from "@/lib/utils";

type Errors = Partial<Record<"name" | "phone" | "email" | "message" | "consent", string>>;

/** Formulario de contacto. `dark` para usarlo sobre fondo marino. */
export function ContactForm({ dark }: { dark?: boolean }) {
  const [form, setForm] = useState({ service: "", name: "", phone: "", email: "", message: "", consent: false, website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const label = cn("mb-1.5 block text-xs font-medium uppercase tracking-[0.12em]", dark ? "text-cream-100/80" : "text-navy-900");
  const input = cn(
    "w-full rounded-xl border px-3.5 text-[15px] outline-none transition-colors focus:ring-[3px]",
    dark
      ? "border-cream-200/20 bg-white/5 text-cream-100 placeholder:text-cream-100/40 hover:border-cream-200/40 focus:border-cream-200/70 focus:ring-cream-200/15"
      : "border-input bg-white text-ink placeholder:text-ink-soft/80 hover:border-navy-900/30 focus:border-navy-700 focus:ring-navy-700/15",
  );
  const err = (m?: string) =>
    m ? (
      <p role="alert" className={cn("mt-1.5 text-[13px]", dark ? "text-red-300" : "text-destructive")}>
        {m}
      </p>
    ) : null;

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e: Errors = {
      name: validators.name(form.name),
      phone: validators.phone(form.phone),
      email: validators.email(form.email, true),
      message: form.message.trim().length >= 10 ? undefined : "Cuéntanos un poco más (mínimo 10 caracteres)",
      consent: validators.consent(form.consent),
    };
    const clean = Object.fromEntries(Object.entries(e).filter(([, v]) => v)) as Errors;
    setErrors(clean);
    if (Object.keys(clean).length) return;
    setState("sending");
    const res = await submitContact({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      service: services.find((s) => s.slug === form.service)?.name,
      message: form.message.trim(),
      consent: form.consent,
      website: form.website,
    });
    if (!res.ok) {
      setState("idle");
      toast.error(res.error);
      return;
    }
    setState("done");
    toast.success(res.via === "whatsapp" ? "Te llevamos a WhatsApp para enviar el mensaje" : "¡Mensaje enviado! Te responderemos pronto.");
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-start gap-3 py-8">
        <CheckCircle2 aria-hidden className={cn("size-10", dark ? "text-gold-300" : "text-whatsapp")} />
        <p className={cn("font-heading text-2xl", dark ? "text-cream-100" : "text-navy-900")}>¡Gracias, {form.name.split(" ")[0]}!</p>
        <p className={dark ? "text-cream-100/75" : "text-ink-soft"}>Hemos recibido tu mensaje. Te contestaremos lo antes posible.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-4">
      <Honeypot value={form.website} onChange={(v) => set("website", v)} />
      <div>
        <label htmlFor="cf-service" className={label}>
          Servicio
        </label>
        <select id="cf-service" value={form.service} onChange={(e) => set("service", e.target.value)} className={cn(input, "h-12 cursor-pointer [&>option]:text-ink")}>
          <option value="">Selecciona un servicio…</option>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={label}>
            Nombre *
          </label>
          <input id="cf-name" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name || undefined} className={cn(input, "h-12")} />
          {err(errors.name)}
        </div>
        <div>
          <label htmlFor="cf-phone" className={label}>
            Teléfono *
          </label>
          <input id="cf-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone || undefined} className={cn(input, "h-12")} />
          {err(errors.phone)}
        </div>
      </div>
      <div>
        <label htmlFor="cf-email" className={label}>
          Email *
        </label>
        <input id="cf-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email || undefined} className={cn(input, "h-12")} />
        {err(errors.email)}
      </div>
      <div>
        <label htmlFor="cf-message" className={label}>
          Cuéntanos tu proyecto *
        </label>
        <textarea
          id="cf-message"
          rows={4}
          maxLength={1500}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          aria-invalid={!!errors.message || undefined}
          placeholder="Qué necesitas, medidas aproximadas, plazos…"
          className={cn(input, "min-h-28 py-3")}
        />
        {err(errors.message)}
      </div>
      <ConsentCheckbox checked={form.consent} onChange={(v) => set("consent", v)} error={errors.consent} dark={dark} />
      <button
        type="submit"
        disabled={state === "sending"}
        className={cn(
          "inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 font-medium shadow-layered transition-colors disabled:opacity-60",
          dark ? "bg-cream-200 text-navy-900 hover:bg-cream-300" : "bg-navy-900 text-cream-100 hover:bg-navy-800",
        )}
      >
        {state === "sending" ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : <Send aria-hidden className="size-5" />}
        {formulariosSupabase ? "Enviar mensaje" : "Enviar por WhatsApp"}
      </button>
    </form>
  );
}
