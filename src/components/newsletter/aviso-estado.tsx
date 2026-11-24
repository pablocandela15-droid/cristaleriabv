import type { ReactNode } from "react";
import { CheckCircle2, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type TonoAviso = "ok" | "info" | "error" | "cargando";

const ICONO: Record<TonoAviso, ReactNode> = {
  ok: <CheckCircle2 aria-hidden className="size-6 shrink-0 text-whatsapp" />,
  info: <Info aria-hidden className="size-6 shrink-0 text-gold-600" />,
  error: <TriangleAlert aria-hidden className="size-6 shrink-0 text-destructive" />,
  cargando: <LoaderCircle aria-hidden className="size-6 shrink-0 animate-spin text-navy-700" />,
};

/** Tarjeta con el resultado de confirmar o de darse de baja (anunciada a los lectores de pantalla). */
export function AvisoEstado({ tono, titulo, children }: { tono: TonoAviso; titulo: string; children?: ReactNode }) {
  return (
    <div
      role={tono === "error" ? "alert" : "status"}
      className={cn(
        "flex max-w-2xl items-start gap-4 rounded-2xl border bg-cream-50 p-5 sm:p-6",
        tono === "error" ? "border-destructive/30" : "border-navy-900/10",
      )}
    >
      {ICONO[tono]}
      <div className="min-w-0 space-y-2">
        <h2 className="text-xl font-medium">{titulo}</h2>
        {children && <div className="space-y-3 text-[15px] leading-relaxed text-ink-soft">{children}</div>}
      </div>
    </div>
  );
}

export const BOTON_PRINCIPAL =
  "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 font-medium text-cream-100 shadow-layered transition-colors hover:bg-navy-800 disabled:opacity-60";
