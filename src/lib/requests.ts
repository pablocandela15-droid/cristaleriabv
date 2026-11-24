import { BackendError, callFunction, formulariosSupabase, isBackendConfigured } from "@/lib/backend";
import { whatsappLink } from "@/content/site";
import { registrarContactoEnviado, registrarSolicitudPresupuesto } from "@/lib/actividad";

export type AppointmentRequest = {
  name: string;
  phone: string;
  email?: string;
  town?: string;
  address?: string;
  preferredDate?: string;
  preferredSlot?: "manana" | "tarde" | "";
  service?: string;
  notes?: string;
  distanceKm?: number | null;
  visitCost?: number | null;
  quote?: { category: string; total: number; summary: string } | null;
  consent: boolean;
  /** Campo trampa anti-spam: debe llegar vacío. */
  website?: string;
};

export type ContactRequest = {
  name: string;
  phone: string;
  email: string;
  service?: string;
  message: string;
  consent: boolean;
  website?: string;
};

export type SubmitResult = { ok: true; via: "backend" | "whatsapp"; reference?: string } | { ok: false; error: string };

/** Número de WhatsApp del negocio (el del panel, si lo hay). */
type Opts = { whatsapp?: string };

const slotLabel = { manana: "Mañana (9:00–13:30)", tarde: "Tarde (16:00–19:30)", "": "Indiferente" } as const;

function appointmentText(r: AppointmentRequest) {
  return [
    "*Solicitud de visita técnica*",
    `Nombre: ${r.name}`,
    `Teléfono: ${r.phone}`,
    r.email && `Email: ${r.email}`,
    r.town && `Población: ${r.town}`,
    r.address && `Dirección: ${r.address}`,
    r.service && `Servicio: ${r.service}`,
    r.preferredDate && `Fecha preferida: ${new Date(r.preferredDate).toLocaleDateString("es-ES")}`,
    `Franja: ${slotLabel[r.preferredSlot ?? ""]}`,
    r.visitCost != null && `Coste de la visita: ${r.visitCost === 0 ? "gratuita" : `${r.visitCost} €`}`,
    r.quote && `Presupuesto orientativo: ${r.quote.total} € (${r.quote.category})`,
    r.notes && `Comentarios: ${r.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Envía la reserva a la edge function `book-appointment` si los formularios de
 * Supabase están activos (NEXT_PUBLIC_FORMULARIOS_SUPABASE=1); si no, abre
 * WhatsApp con los datos.
 */
export async function submitAppointment(r: AppointmentRequest, opts: Opts = {}): Promise<SubmitResult> {
  if (r.website) return { ok: true, via: "backend" };
  if (!formulariosSupabase) {
    window.open(whatsappLink(appointmentText(r), opts.whatsapp), "_blank", "noopener,noreferrer");
    registrarContactoEnviado("visita", "whatsapp");
    return { ok: true, via: "whatsapp" };
  }
  try {
    const res = await callFunction<{ reference: string }>("book-appointment", r);
    registrarContactoEnviado("visita", "servidor");
    return { ok: true, via: "backend", reference: res.reference };
  } catch (e) {
    return { ok: false, error: e instanceof BackendError ? e.message : "No se pudo enviar la solicitud" };
  }
}

/** Mensaje de contacto: edge function `contact` si los formularios de Supabase están activos; si no, WhatsApp. */
export async function submitContact(r: ContactRequest, opts: Opts = {}): Promise<SubmitResult> {
  if (r.website) return { ok: true, via: "backend" };
  if (!formulariosSupabase) {
    const text = [
      "*Mensaje desde la web*",
      `Nombre: ${r.name}`,
      `Teléfono: ${r.phone}`,
      `Email: ${r.email}`,
      r.service && `Servicio: ${r.service}`,
      "",
      r.message,
    ]
      .filter((x): x is string => typeof x === "string")
      .join("\n");
    window.open(whatsappLink(text, opts.whatsapp), "_blank", "noopener,noreferrer");
    registrarContactoEnviado("contacto", "whatsapp");
    return { ok: true, via: "whatsapp" };
  }
  try {
    await callFunction("contact", r);
    registrarContactoEnviado("contacto", "servidor");
    return { ok: true, via: "backend" };
  } catch (e) {
    return { ok: false, error: e instanceof BackendError ? e.message : "No se pudo enviar el mensaje" };
  }
}

/** Solicitud de presupuesto desde la calculadora (edge function `web-solicitud-presupuesto` del panel). */
export type QuoteRequest = {
  nombre: string;
  telefono: string;
  email?: string;
  poblacion?: string;
  direccion?: string;
  notas?: string;
  /** Id de la categoría de la calculadora (mamparas, espejos…). */
  categoria: string;
  /** Valores introducidos en la calculadora, para recalcular en el panel. */
  valores: Record<string, unknown>;
  /** Precio orientativo de la calculadora (€). */
  total: number;
  /** Resumen legible (el mismo texto que se envía por WhatsApp). */
  resumen: string;
  consentimiento: true;
  /** Campo trampa anti-spam: debe llegar vacío. */
  website: string;
};

export type QuoteResult = { ok: true; numero?: string } | { ok: false; error: string };

/** Hay dónde guardar la solicitud: el proyecto de Supabase del panel está configurado. */
export const quoteRequestsEnabled = isBackendConfigured;

/**
 * Guarda la solicitud como presupuesto «solicitud» en el panel y devuelve su
 * número (P-2026-0001). Si falla, el formulario ofrece enviarla por WhatsApp.
 */
export async function submitQuoteRequest(r: QuoteRequest): Promise<QuoteResult> {
  if (r.website) return { ok: true };
  if (!isBackendConfigured) return { ok: false, error: "No podemos guardar la solicitud ahora mismo" };
  const body: QuoteRequest = {
    ...r,
    nombre: r.nombre.slice(0, 120),
    telefono: r.telefono.slice(0, 30),
    email: r.email?.slice(0, 200) || undefined,
    poblacion: r.poblacion?.slice(0, 120) || undefined,
    notas: r.notas?.slice(0, 1500) || undefined,
    resumen: r.resumen.slice(0, 4000),
    total: Math.max(0, Math.min(1e6, Math.round(r.total * 100) / 100)),
  };
  try {
    const res = await callFunction<{ numero?: string }>("web-solicitud-presupuesto", body, AbortSignal.timeout(15000));
    registrarSolicitudPresupuesto({ ok: true }, r.categoria);
    return { ok: true, numero: typeof res?.numero === "string" ? res.numero : undefined };
  } catch (e) {
    registrarSolicitudPresupuesto({ ok: false, status: e instanceof BackendError ? (e.status ?? 0) : 0 }, r.categoria);
    if (e instanceof BackendError && e.status === 429) {
      return { ok: false, error: "Has enviado varias solicitudes seguidas. Espera un poco o escríbenos por WhatsApp." };
    }
    if (e instanceof BackendError && e.status === 400 && e.message) return { ok: false, error: e.message };
    return { ok: false, error: "No hemos podido enviar la solicitud" };
  }
}

/** Validaciones compartidas por los formularios. */
export const validators = {
  name: (v: string) => (v.trim().length >= 2 ? undefined : "Escribe tu nombre"),
  phone: (v: string) => (/^(\+?\d[\d\s-]{7,15})$/.test(v.trim()) ? undefined : "Escribe un teléfono válido"),
  email: (v: string, required = false) =>
    !v.trim() ? (required ? "Escribe tu email" : undefined) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? undefined : "Escribe un email válido",
  consent: (v: boolean) => (v ? undefined : "Debes aceptar la política de privacidad"),
};
