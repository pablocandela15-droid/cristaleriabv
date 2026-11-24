// ============================================================================
//  Actividad de la web → Super Admin › Logs del panel (registrar-actividad-web)
// ----------------------------------------------------------------------------
//  Cola de eventos en memoria que se manda en lotes cada 5 s y, al ocultar o
//  cerrar la página, con sendBeacon. Contrato (panel, repositorio
//  admin-cristaleriabv, supabase/functions/registrar-actividad-web/ingesta.ts):
//
//    POST <NEXT_PUBLIC_SUPABASE_URL>/functions/v1/registrar-actividad-web
//      Content-Type: text/plain   (sin cabeceras propias: no hay preflight CORS)
//      { v: 1, contexto: { consentimiento, version, despliegue, interno, prueba, tactil },
//        eventos: [{ id, t, tipo, accion?, sesion, seq, ruta?, objetivo?, valor?, props?, error? }] }
//    202 guardado · 503 reintentar el mismo lote (mismos id: sin duplicados) · resto: se descarta
//
//  Privacidad: sin cookies y sin guardar nada en el navegador. La sesión es un
//  id aleatorio que vive en memoria (en esta pestaña; al recargar empieza
//  otra) y no hay id de visitante. Con «No rastrear» o Global Privacy Control
//  `consentimiento` va a false y solo se mandan errores. Nada de lo que se
//  escribe en los formularios sale de aquí; el servidor vuelve a sanear todo.
//
//  Nunca rompe la web: todo va en try/catch y, si falla, se calla.
// ============================================================================

import { ACTIVIDAD_ACTIVA, DESPLIEGUE, ENDPOINT, VERSION } from "./config";

export type TipoEvento =
  | "pagina_vista"
  | "pagina_salida"
  | "scroll"
  | "clic"
  | "contacto"
  | "calculadora"
  | "media"
  | "formulario"
  | "chat"
  | "presupuesto_solicitado"
  | "presupuesto_rechazado"
  | "contacto_enviado"
  | "newsletter_alta"
  | "carga_pagina"
  | "peticion"
  | "error_js"
  | "error_promesa"
  | "error_recurso"
  | "error_peticion"
  | "error_react"
  | "error_404";

export type ValorProp = string | number | boolean | null;

export interface DatosEvento {
  accion?: string;
  objetivo?: string;
  valor?: number;
  props?: Record<string, ValorProp | undefined>;
  /** Por defecto, la ruta actual (sin consulta). */
  ruta?: string;
  error?: { mensaje?: string; pila?: string };
}

interface EventoCable {
  id: string;
  t: string;
  tipo: TipoEvento;
  accion?: string;
  sesion: string;
  seq: number;
  ruta?: string;
  objetivo?: string;
  valor?: number;
  props?: Record<string, ValorProp>;
  error?: { mensaje?: string; pila?: string };
}

/** Lote pendiente de un reintento (503 o sin red): se vuelve a mandar igual. */
interface LotePendiente {
  eventos: EventoCable[];
  intentos: number;
}

const INTERVALO_MS = 5000;
const MAX_EVENTOS_LOTE = 50;
const MAX_BYTES_LOTE = 60 * 1024;
const MAX_INTENTOS = 3;
/** Tras estos fallos seguidos (sin red, función sin desplegar, CORS…) se deja de intentar en esta página. */
const MAX_FALLOS_SEGUIDOS = 3;
/** Tope por carga de página (el servidor admite 400 por sesión). */
const MAX_EVENTOS_CARGA = 400;
const MAX_COLA = 200;
/** El mismo error, como mucho estas veces por carga de página. */
const MAX_MISMO_ERROR = 5;

const TIPOS_ERROR = new Set<TipoEvento>(["error_js", "error_promesa", "error_recurso", "error_peticion", "error_react", "error_404"]);

const enNavegador = typeof window !== "undefined" && typeof document !== "undefined";

/** ¿Está la recogida activa en este navegador? (variable de Supabase puesta y en el navegador). */
export const actividadActiva = ACTIVIDAD_ACTIVA && enNavegador;

function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  } catch {
    // Sin crypto (navegador muy antiguo): aleatorio corriente, solo para no repetir ids en esta página.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

/** El navegador deja medir: ni «No rastrear» ni Global Privacy Control. */
export function puedeMedir(): boolean {
  if (!enNavegador) return false;
  try {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
    const w = window as Window & { doNotTrack?: string };
    if (nav.globalPrivacyControl === true) return false;
    const dnt = nav.doNotTrack ?? w.doNotTrack ?? nav.msDoNotTrack;
    return !(dnt === "1" || dnt === "yes");
  } catch {
    return true;
  }
}

/**
 * Tráfico interno: quien abre la web con `?bv_interno=1` (el personal, para no
 * contarse) queda marcado en ESE navegador; `?bv_interno=0` lo quita. Es lo
 * único que se guarda, y solo si se pide así.
 */
function leerInterno(): boolean {
  try {
    const p = new URLSearchParams(window.location.search).get("bv_interno");
    if (p === "1") window.localStorage.setItem("bv_interno", "1");
    if (p === "0") window.localStorage.removeItem("bv_interno");
    return window.localStorage.getItem("bv_interno") === "1";
  } catch {
    return false;
  }
}

function esTactil(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

function despliegueDeLaPagina(): string {
  if (DESPLIEGUE) return DESPLIEGUE;
  try {
    return document.documentElement.dataset.dplId ?? "";
  } catch {
    return "";
  }
}

const textoCorto = (v: string, max: number) => (/^[A-Za-z0-9._-]{1,64}$/.test(v) ? v.slice(0, max) : undefined);

// ─── Estado (en memoria: se pierde al recargar, a propósito) ────────────────
const sesion = enNavegador ? uuid() : "";
let seq = 0;
let enviados = 0;
let desactivada = false;
let fallosSeguidos = 0;
let temporizador: ReturnType<typeof setTimeout> | null = null;
const cola: EventoCable[] = [];
const pendientes: LotePendiente[] = [];
const vecesError = new Map<string, number>();
let contexto: Record<string, unknown> | null = null;

function contextoLote(): Record<string, unknown> {
  if (!contexto) {
    contexto = {
      consentimiento: puedeMedir(),
      version: textoCorto(VERSION, 40),
      despliegue: textoCorto(despliegueDeLaPagina(), 80),
      interno: leerInterno(),
      prueba: (() => {
        try {
          return navigator.webdriver === true;
        } catch {
          return false;
        }
      })(),
      tactil: esTactil(),
    };
  }
  return contexto;
}

/** Ruta actual sin consulta ni fragmento. */
export function rutaActual(): string {
  try {
    return window.location.pathname || "/";
  } catch {
    return "/";
  }
}

/**
 * Apunta un evento. Nunca lanza. Sin permiso para medir, solo entran los
 * errores. Sin la variable de Supabase, no hace nada.
 */
export function registrar(tipo: TipoEvento, datos: DatosEvento = {}): void {
  if (!actividadActiva || desactivada) return;
  try {
    const esError = TIPOS_ERROR.has(tipo);
    if (!esError && !contextoLote().consentimiento) return;
    if (esError) {
      const clave = `${tipo}|${datos.error?.mensaje ?? ""}|${datos.objetivo ?? ""}`.slice(0, 300);
      const n = (vecesError.get(clave) ?? 0) + 1;
      vecesError.set(clave, n);
      if (n > MAX_MISMO_ERROR) return;
    }
    if (enviados + cola.length >= MAX_EVENTOS_CARGA || cola.length >= MAX_COLA) return;

    const props: Record<string, ValorProp> = {};
    for (const [k, v] of Object.entries(datos.props ?? {})) {
      if (v === undefined) continue;
      if (typeof v === "number" && !Number.isFinite(v)) continue;
      props[k] = typeof v === "string" ? v.slice(0, 200) : v;
    }
    const evento: EventoCable = {
      id: uuid(),
      t: new Date().toISOString(),
      tipo,
      sesion,
      seq: seq++,
      ruta: (datos.ruta ?? rutaActual()).slice(0, 300),
    };
    if (datos.accion) evento.accion = datos.accion;
    if (datos.objetivo) evento.objetivo = datos.objetivo.slice(0, 120);
    if (typeof datos.valor === "number" && Number.isFinite(datos.valor)) evento.valor = datos.valor;
    if (Object.keys(props).length) evento.props = props;
    if (datos.error) {
      evento.error = {
        mensaje: datos.error.mensaje?.slice(0, 500),
        pila: datos.error.pila?.slice(0, 4000),
      };
    }
    cola.push(evento);
    programar();
  } catch {
    // La medición nunca rompe la web.
  }
}

function programar() {
  if (temporizador || desactivada) return;
  try {
    temporizador = setTimeout(() => {
      temporizador = null;
      void vaciar(false);
    }, INTERVALO_MS);
  } catch {
    temporizador = null;
  }
}

/** Parte la cola en lotes de ≤ 50 eventos y ≤ 60 KB. */
function sacarLote(): EventoCable[] {
  const lote: EventoCable[] = [];
  let bytes = 200;
  while (cola.length && lote.length < MAX_EVENTOS_LOTE) {
    const tam = JSON.stringify(cola[0]).length + 1;
    if (lote.length && bytes + tam > MAX_BYTES_LOTE) break;
    lote.push(cola.shift()!);
    bytes += tam;
  }
  return lote;
}

const cuerpo = (eventos: EventoCable[]) => JSON.stringify({ v: 1, contexto: contextoLote(), eventos });

async function mandar(lote: LotePendiente): Promise<void> {
  let estado = 0;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: cuerpo(lote.eventos),
      keepalive: true,
      credentials: "omit",
      cache: "no-store",
    });
    estado = res.status;
  } catch {
    estado = 0; // sin red o bloqueado
  }
  if (estado >= 200 && estado < 300) {
    enviados += lote.eventos.length;
    fallosSeguidos = 0;
    return;
  }
  fallosSeguidos += 1;
  // 403 (origen no permitido), 404 (función sin desplegar) o varios fallos seguidos: no insistir en esta página.
  if (estado === 403 || estado === 404 || fallosSeguidos >= MAX_FALLOS_SEGUIDOS) {
    desactivada = true;
    cola.length = 0;
    pendientes.length = 0;
    return;
  }
  if ((estado === 0 || estado === 503 || estado === 502 || estado === 504) && lote.intentos + 1 < MAX_INTENTOS) {
    pendientes.push({ eventos: lote.eventos, intentos: lote.intentos + 1 });
    programar();
  }
}

/**
 * Manda lo que haya. `final`: la página se oculta o se cierra (sendBeacon, que
 * el navegador entrega aunque la página ya no exista).
 */
export async function vaciar(final: boolean): Promise<void> {
  if (!actividadActiva || desactivada) return;
  try {
    if (temporizador && final) {
      clearTimeout(temporizador);
      temporizador = null;
    }
    const lotes: LotePendiente[] = pendientes.splice(0, pendientes.length);
    while (cola.length) lotes.push({ eventos: sacarLote(), intentos: 0 });
    if (!lotes.length) return;
    if (final) {
      for (const lote of lotes) {
        let entregado = false;
        try {
          entregado = typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, cuerpo(lote.eventos));
        } catch {
          entregado = false;
        }
        if (entregado) enviados += lote.eventos.length;
        else void mandar(lote);
      }
      return;
    }
    for (const lote of lotes) await mandar(lote);
  } catch {
    // Nada: la próxima pasada lo intentará con lo que quede.
  }
}
