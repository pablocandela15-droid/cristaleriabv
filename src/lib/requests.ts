import { BackendError, callFunction, formulariosSupabase } from "@/lib/backend";
import { whatsappLink } from "@/content/site";

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
export async function submitAppointment(r: AppointmentRequest): Promise<SubmitResult> {
  if (r.website) return { ok: true, via: "backend" };
  if (!formulariosSupabase) {
    window.open(whatsappLink(appointmentText(r)), "_blank", "noopener,noreferrer");
    return { ok: true, via: "whatsapp" };
  }
  try {
    const res = await callFunction<{ reference: string }>("book-appointment", r);
    return { ok: true, via: "backend", reference: res.reference };
  } catch (e) {
    return { ok: false, error: e instanceof BackendError ? e.message : "No se pudo enviar la solicitud" };
  }
}

/** Mensaje de contacto: edge function `contact` si los formularios de Supabase están activos; si no, WhatsApp. */
export async function submitContact(r: ContactRequest): Promise<SubmitResult> {
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
    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
    return { ok: true, via: "whatsapp" };
  }
  try {
    await callFunction("contact", r);
    return { ok: true, via: "backend" };
  } catch (e) {
    return { ok: false, error: e instanceof BackendError ? e.message : "No se pudo enviar el mensaje" };
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
