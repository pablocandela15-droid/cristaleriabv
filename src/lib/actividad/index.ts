/**
 * Actividad de la web para Super Admin › Logs y Tráfico web › Comportamiento
 * del panel. Ver cliente.ts (envío y privacidad) y navegador.ts (lo que se
 * observa solo). Aquí, lo que apuntan los componentes: calculadora,
 * formularios, galería de trabajos, asistente y las operaciones completadas.
 */
import { registrar } from "./cliente";

export { registrar, actividadActiva, type TipoEvento, type DatosEvento } from "./cliente";
export { iniciarActividad, registrarVista } from "./navegador";

export type AccionCalculadora = "inicio" | "categoria" | "paso" | "calculado" | "reiniciar";

/**
 * Calculadora: el servicio (objetivo), el paso y, al calcular, el importe
 * orientativo (IVA incluido). Nunca medidas, opciones ni datos del cliente.
 */
export function registrarCalculadora(accion: AccionCalculadora, datos: { categoria?: string | null; paso?: number; total?: number } = {}) {
  registrar("calculadora", {
    accion,
    objetivo: datos.categoria ?? undefined,
    valor: accion === "calculado" ? datos.total : undefined,
    props: { categoria: datos.categoria ?? undefined, paso: datos.paso },
  });
}

/** El servidor guardó la solicitud de presupuesto (o la rechazó, con su código). */
export function registrarSolicitudPresupuesto(resultado: { ok: true } | { ok: false; status: number }, categoria: string) {
  if (resultado.ok) registrar("presupuesto_solicitado", { accion: "ok", objetivo: categoria, props: { categoria } });
  else registrar("presupuesto_rechazado", { objetivo: categoria, props: { status: resultado.status, categoria } });
}

/** Formulario de contacto o de visita técnica enviado (por WhatsApp o al servidor). */
export function registrarContactoEnviado(formulario: "contacto" | "visita", via: "whatsapp" | "servidor") {
  registrar("contacto_enviado", { accion: via, objetivo: formulario, props: { formulario } });
}

/**
 * Llamada a una edge function: `peticion` (técnico) y, si falla por el
 * servidor o por la red, `error_peticion` (la de la solicitud de presupuesto
 * es crítica en el panel).
 */
export function registrarPeticion(funcion: string, status: number, ms: number, detalle?: string) {
  registrar("peticion", { objetivo: funcion, valor: Math.round(ms), props: { endpoint: funcion, metodo: "POST", status } });
  if (status === 0 || status >= 500) {
    registrar("error_peticion", {
      objetivo: funcion,
      props: { endpoint: funcion, metodo: "POST", status },
      error: { mensaje: status === 0 ? `Sin respuesta de ${funcion}${detalle ? ` (${detalle})` : ""}` : `HTTP ${status} en ${funcion}` },
    });
  }
}
