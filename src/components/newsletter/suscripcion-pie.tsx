"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle, MailPlus, TriangleAlert } from "lucide-react";
import { Honeypot } from "@/components/forms/consent";
import { CasillaNewsletter } from "@/components/newsletter/casilla";
import { CASILLA_PIE, errorEmail, suscribir } from "@/lib/newsletter";

type Estado = { tipo: "inicio" | "enviando" } | { tipo: "hecho"; mensaje: string } | { tipo: "error"; mensaje: string };

/**
 * Formulario de suscripción del pie (solo se pinta con las variables de Supabase: ver footer.tsx). Email, casilla
 * de consentimiento sin marcar con enlace a /privacidad y campo trampa. Doble opt-in: tras apuntarse llega un correo
 * para confirmar.
 */
export function SuscripcionPie() {
  const [email, setEmail] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [website, setWebsite] = useState("");
  const [errores, setErrores] = useState<{ email?: string; acepta?: string }>({});
  const [estado, setEstado] = useState<Estado>({ tipo: "inicio" });

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    const e = { email: errorEmail(email), acepta: acepta ? undefined : "Marca la casilla para recibir las novedades" };
    setErrores(e);
    if (e.email || e.acepta) return;
    setEstado({ tipo: "enviando" });
    const r = await suscribir({ email, origen: "web_formulario", website });
    setEstado(r.ok ? { tipo: "hecho", mensaje: r.mensaje } : { tipo: "error", mensaje: r.error });
  }

  if (estado.tipo === "hecho") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-cream-200/15 bg-navy-900/60 p-4 text-[15px] text-cream-100">
        <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-gold-300" />
        <p>{estado.mensaje} Si no lo ves, mira en la carpeta de correo no deseado.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="relative space-y-3" aria-label="Suscripción a la newsletter">
      <Honeypot value={website} onChange={setWebsite} />
      <div>
        <label htmlFor="newsletter-email" className="mb-1.5 block text-sm font-medium text-cream-100/85">
          Tu correo electrónico
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            id="newsletter-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errores.email) setErrores((x) => ({ ...x, email: undefined }));
            }}
            aria-invalid={errores.email ? true : undefined}
            aria-describedby={errores.email ? "newsletter-email-error" : undefined}
            className="h-12 w-full min-w-0 rounded-xl border border-cream-200/20 sm:flex-1 bg-navy-950/60 px-3.5 text-[15px] text-cream-100 outline-none transition-colors placeholder:text-cream-100/40 hover:border-cream-200/40 focus:border-cream-200/70 focus:ring-[3px] focus:ring-cream-200/15 aria-[invalid=true]:border-red-300"
          />
          <button
            type="submit"
            disabled={estado.tipo === "enviando"}
            className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-cream-200 px-5 font-medium text-navy-900 transition-colors hover:bg-cream-300 disabled:opacity-60"
          >
            {estado.tipo === "enviando" ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <MailPlus aria-hidden className="size-4" />}
            Suscribirme
          </button>
        </div>
        {errores.email && (
          <p id="newsletter-email-error" role="alert" className="mt-1.5 text-[13px] text-red-300">
            {errores.email}
          </p>
        )}
      </div>
      <CasillaNewsletter
        dark
        checked={acepta}
        onChange={(v) => {
          setAcepta(v);
          if (v) setErrores((x) => ({ ...x, acepta: undefined }));
        }}
        error={errores.acepta}
      >
        {CASILLA_PIE.antes}
        <Link href="/privacidad" className="text-cream-100 underline underline-offset-2" target="_blank">
          {CASILLA_PIE.enlace}
        </Link>
        {CASILLA_PIE.despues}
      </CasillaNewsletter>
      {estado.tipo === "error" && (
        <p role="alert" className="flex items-start gap-2 text-[14px] text-red-200">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}
