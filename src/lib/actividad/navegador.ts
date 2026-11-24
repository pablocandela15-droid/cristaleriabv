// ============================================================================
//  Actividad de la web · lo que se observa solo en el navegador: errores,
//  páginas vistas y su fin (tiempo activo y scroll), clics en contacto
//  (teléfono, WhatsApp, correo, mapa, redes) y en llamadas a la acción, y la
//  velocidad de carga. Se arranca una vez (instrumentation-client.ts) y cada
//  cambio de ruta lo avisa <ActividadWeb /> con registrarVista().
// ============================================================================

import { actividadActiva, puedeMedir, registrar, rutaActual, vaciar } from "./cliente";

interface Vista {
  id: number;
  ruta: string;
  scrollMax: number;
  hitos: Set<number>;
}

const HITOS_SCROLL = [25, 50, 75, 100];
/** Sin tocar nada en este tiempo, la página deja de contar como «activa». */
const INACTIVA_MS = 60_000;

let iniciada = false;
let medir = false;
let vistaId = 0;
let vista: Vista | null = null;
let activoMs = 0;
let ultimoTick = 0;
let ultimaInteraccion = 0;
let visible = true;

const ahora = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Suma el tiempo activo desde la última vez (página visible y con interacción en el último minuto). */
function acumular() {
  const t = ahora();
  if (visible && t - ultimaInteraccion < INACTIVA_MS) activoMs += Math.min(t - ultimoTick, INACTIVA_MS);
  ultimoTick = t;
}

function interaccion() {
  acumular();
  ultimaInteraccion = ahora();
}

function porcentajeScroll(): number {
  try {
    const alto = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
    if (alto <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round(((window.scrollY + window.innerHeight) / alto) * 100)));
  } catch {
    return 0;
  }
}

/** Fin de la vista actual (o de un trozo, si solo se oculta): tiempo activo desde el último aviso y scroll máximo. */
function cerrarVista(accion: "navegacion" | "oculta" | "cierre") {
  if (!vista) return;
  acumular();
  registrar("pagina_salida", {
    accion,
    ruta: vista.ruta,
    valor: Math.round(Math.min(activoMs, 3_600_000)),
    props: { scroll_max: vista.scrollMax, vista_id: vista.id },
  });
  activoMs = 0;
}

/** Procedencia de la primera página: solo el origen del referente (nunca la URL entera) y los utm_* / qr. */
function procedencia(): Record<string, string | undefined> {
  const datos: Record<string, string | undefined> = {};
  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.origin !== window.location.origin) datos.referente = ref.origin;
    }
  } catch {
    // Referente ilegible: sin él.
  }
  try {
    const q = new URLSearchParams(window.location.search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "qr"] as const) {
      const v = q.get(k);
      if (v) datos[k] = v.slice(0, 100);
    }
  } catch {
    // Consulta ilegible: sin ella.
  }
  return datos;
}

/** Nueva página vista (la llama <ActividadWeb /> en cada cambio de ruta). */
export function registrarVista(ruta: string): void {
  if (!actividadActiva || !medir) return;
  try {
    if (vista?.ruta === ruta) return; // el mismo render dos veces (modo estricto de React)
    if (vista) cerrarVista("navegacion");
    vistaId += 1;
    const inicial = vistaId === 1;
    vista = { id: vistaId, ruta, scrollMax: porcentajeScroll(), hitos: new Set() };
    ultimaInteraccion = ahora();
    ultimoTick = ultimaInteraccion;
    registrar("pagina_vista", {
      ruta,
      props: { vista_id: vistaId, navegacion: inicial ? "inicial" : "cliente", idioma: "es", ...(inicial ? procedencia() : {}) },
    });
  } catch {
    // Nunca rompe la navegación.
  }
}

function alScroll() {
  if (!vista) return;
  const pct = porcentajeScroll();
  if (pct > vista.scrollMax) vista.scrollMax = pct;
  for (const h of HITOS_SCROLL) {
    if (pct >= h && !vista.hitos.has(h)) {
      vista.hitos.add(h);
      registrar("scroll", { valor: h, props: { vista_id: vista.id } });
    }
  }
}

// ─── Clics ──────────────────────────────────────────────────────────────────
type Contacto = "telefono" | "whatsapp" | "email" | "mapa" | "red_social";

function tipoContacto(href: string): { accion: Contacto; destino: string } | null {
  const h = href.trim().toLowerCase();
  if (h.startsWith("tel:")) return { accion: "telefono", destino: "telefono" };
  if (h.startsWith("mailto:")) return { accion: "email", destino: "email" };
  if (h.startsWith("whatsapp:")) return { accion: "whatsapp", destino: "whatsapp" };
  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host === "wa.me" || host.endsWith("whatsapp.com")) return { accion: "whatsapp", destino: host };
  if (
    (/(^|\.)google\.[a-z.]+$/.test(host) && url.pathname.startsWith("/maps")) ||
    host.startsWith("maps.google.") ||
    host === "maps.app.goo.gl" ||
    (host === "goo.gl" && url.pathname.startsWith("/maps")) ||
    host.endsWith("openstreetmap.org") ||
    host === "maps.apple.com"
  ) {
    return { accion: "mapa", destino: host };
  }
  if (/(^|\.)(instagram|facebook|tiktok|youtube|linkedin|x|twitter|pinterest)\.com$/.test(host) || host === "youtu.be") {
    return { accion: "red_social", destino: host };
  }
  return null;
}

/** Zona de la página del elemento: la marcada con data-zona o, si no, la de su bloque. */
function zonaDe(el: Element): string {
  const marcada = el.closest<HTMLElement>("[data-zona]")?.dataset.zona;
  if (marcada) return marcada;
  if (el.closest("[role=dialog]")) return "dialogo";
  if (el.closest("header")) return "cabecera";
  if (el.closest("footer")) return "pie";
  if (el.closest("main")) return "contenido";
  return "otra";
}

const RUTAS_CTA = /^\/(presupuesto|contacto)(\/|$)/;

function alClic(ev: MouseEvent) {
  try {
    const objetivo = ev.target instanceof Element ? ev.target : null;
    if (!objetivo) return;
    const el = objetivo.closest<HTMLElement>("a[href], [data-actividad]");
    if (!el) return;
    const zona = zonaDe(el);
    const etiqueta = el.dataset.actividad;
    if (el instanceof HTMLAnchorElement) {
      const href = el.getAttribute("href") ?? "";
      const contacto = tipoContacto(href);
      if (contacto) {
        // Nunca el número ni la dirección: solo el canal, dónde estaba el botón y su etiqueta.
        registrar("contacto", { accion: contacto.accion, objetivo: etiqueta ?? zona, props: { destino: contacto.destino, zona } });
        return;
      }
      const url = new URL(href, window.location.href);
      if (url.origin === window.location.origin) {
        if (!etiqueta && !RUTAS_CTA.test(url.pathname)) return;
        registrar("clic", {
          objetivo: etiqueta ?? (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
          props: { destino: url.pathname, elemento: "enlace", zona },
        });
        return;
      }
      registrar("clic", { objetivo: etiqueta ?? url.hostname, props: { destino: url.hostname, elemento: "enlace_externo", zona } });
      return;
    }
    if (etiqueta) registrar("clic", { objetivo: etiqueta, props: { elemento: "boton", zona } });
  } catch {
    // Nunca rompe el clic.
  }
}

// ─── Errores ────────────────────────────────────────────────────────────────
function alError(ev: Event) {
  try {
    const destino = ev.target;
    if (destino && destino !== window && destino instanceof Element) {
      // Un recurso que no carga (imagen, script, hoja de estilos).
      const url = (destino as HTMLImageElement).currentSrc || destino.getAttribute("src") || destino.getAttribute("href") || "";
      registrar("error_recurso", {
        objetivo: url.split(/[?#]/)[0].slice(0, 120),
        props: { etiqueta: destino.tagName.toLowerCase() },
        error: { mensaje: `No se pudo cargar ${destino.tagName.toLowerCase()}: ${url.split(/[?#]/)[0]}` },
      });
      return;
    }
    const e = ev as ErrorEvent;
    const err = e.error as { message?: string; stack?: string } | undefined;
    registrar("error_js", { error: { mensaje: e.message || err?.message || "Error desconocido", pila: err?.stack } });
  } catch {
    // Nada.
  }
}

function alPromesaRechazada(ev: PromiseRejectionEvent) {
  try {
    const r = ev.reason as { message?: string; stack?: string; name?: string } | string | undefined;
    const mensaje = typeof r === "string" ? r : r?.message ? `${r.name && r.name !== "Error" ? `${r.name}: ` : ""}${r.message}` : String(r);
    registrar("error_promesa", { error: { mensaje, pila: typeof r === "object" ? r?.stack : undefined } });
  } catch {
    // Nada.
  }
}

// ─── Velocidad de carga ─────────────────────────────────────────────────────
let lcp = 0;
let cls = 0;

function observarRendimiento() {
  try {
    if (typeof PerformanceObserver === "undefined") return;
    new PerformanceObserver((lista) => {
      const entradas = lista.getEntries();
      const ultima = entradas[entradas.length - 1];
      if (ultima) lcp = ultima.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((lista) => {
      for (const e of lista.getEntries() as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>) {
        if (!e.hadRecentInput && typeof e.value === "number") cls += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {
    // Navegador sin estas métricas: se manda lo que haya.
  }
}

function registrarCarga() {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return;
    const ms = (n: number) => (n > 0 ? Math.round(n) : undefined);
    registrar("carga_pagina", {
      ruta: rutaActual(),
      props: {
        ttfb: ms(nav.responseStart - nav.startTime),
        dom: ms(nav.domContentLoadedEventEnd),
        carga: ms(nav.loadEventEnd),
        lcp: ms(lcp),
        cls: Math.round(cls * 1000) / 1000,
        navegacion: nav.type,
      },
    });
  } catch {
    // Nada.
  }
}

/**
 * Arranca la recogida una sola vez. Sin la variable de Supabase no hace nada
 * (ni listeners). Sin permiso para medir («No rastrear» o GPC), solo errores.
 */
export function iniciarActividad(): void {
  if (!actividadActiva || iniciada) return;
  iniciada = true;
  try {
    window.addEventListener("error", alError, true);
    window.addEventListener("unhandledrejection", alPromesaRechazada);
    medir = puedeMedir();
    // Al ocultar o cerrar la página se manda lo pendiente (también los errores). Al salir, el navegador avisa
    // primero con pagehide y luego con visibilitychange: el fin de la vista se apunta una sola vez.
    let descargada = false;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        if (medir && !descargada) {
          acumular();
          visible = false;
          cerrarVista("oculta");
        }
        void vaciar(true);
      } else {
        acumular();
        visible = true;
      }
    });
    window.addEventListener("pagehide", () => {
      if (medir && visible && !descargada) cerrarVista("cierre");
      descargada = true;
      void vaciar(true);
    });
    // Vuelta desde la caché de atrás/adelante: la misma vista sigue viva.
    window.addEventListener("pageshow", (ev) => {
      if (ev.persisted) descargada = false;
    });
    if (!medir) return;

    visible = document.visibilityState !== "hidden";
    ultimoTick = ahora();
    ultimaInteraccion = ultimoTick;
    for (const tipo of ["pointerdown", "keydown", "touchstart", "wheel"] as const) {
      window.addEventListener(tipo, interaccion, { passive: true, capture: true });
    }
    let pendienteScroll = false;
    window.addEventListener(
      "scroll",
      () => {
        if (pendienteScroll) return;
        pendienteScroll = true;
        requestAnimationFrame(() => {
          pendienteScroll = false;
          interaccion();
          alScroll();
        });
      },
      { passive: true },
    );
    document.addEventListener("click", alClic, true);
    setInterval(acumular, 5000);
    observarRendimiento();
    const trasCargar = () => setTimeout(registrarCarga, 3000);
    if (document.readyState === "complete") trasCargar();
    else window.addEventListener("load", trasCargar, { once: true });
  } catch {
    // La medición nunca rompe la web.
  }
}
