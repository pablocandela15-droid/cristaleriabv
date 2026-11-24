"use client";

import { useEffect, useState, type FocusEvent } from "react";
import { registrar } from "./cliente";

export type ObjetivoFormulario = "presupuesto" | "contacto" | "visita";

/** Campos rellenos y total del formulario (nunca su contenido). */
function contarCampos(form: HTMLFormElement | null): { campos: number; total: number } {
  if (!form) return { campos: 0, total: 0 };
  let campos = 0;
  let total = 0;
  for (const el of Array.from(form.elements)) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) continue;
    if (el instanceof HTMLInputElement && ["hidden", "submit", "button"].includes(el.type)) continue;
    if (el.closest("[aria-hidden=true]") || el.tabIndex < 0) continue; // el campo trampa anti-spam
    total += 1;
    const lleno = el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio") ? el.checked : el.value.trim() !== "";
    if (lleno) campos += 1;
  }
  return { campos, total };
}

/** Seguimiento de un formulario, con su estado en un cierre (no son datos de React: no repintan nada). */
function crearSeguimiento(objetivo: ObjetivoFormulario) {
  let form: HTMLFormElement | null = null;
  let iniciado = false;
  let enviado = false;
  let abandonado = false;
  const abandonar = () => {
    if (!iniciado || enviado || abandonado) return;
    abandonado = true;
    registrar("formulario", { accion: "abandono", objetivo, props: contarCampos(form) });
  };
  return {
    /** Ref de callback para el <form> (`ref={actividad.conectar}`). */
    conectar: (el: HTMLFormElement | null) => {
      if (el) form = el;
    },
    onFocusCapture: (ev: FocusEvent<HTMLFormElement>) => {
      if (iniciado || !(ev.target instanceof HTMLElement) || ev.target.tabIndex < 0) return;
      iniciado = true;
      abandonado = false;
      registrar("formulario", { accion: "inicio", objetivo, props: contarCampos(form) });
    },
    errorValidacion: (campos: number) => registrar("formulario", { accion: "error_validacion", objetivo, props: { campos } }),
    envio: () => {
      enviado = true;
      registrar("formulario", { accion: "envio", objetivo, props: contarCampos(form) });
    },
    /** Al desmontar o salir de la página sin enviar: abandono. */
    montar: () => {
      window.addEventListener("pagehide", abandonar);
      return () => {
        window.removeEventListener("pagehide", abandonar);
        abandonar();
      };
    },
  };
}

/**
 * Seguimiento de un formulario: «inicio» al entrar en el primer campo,
 * «error_validacion», «envio» y «abandono» (si se empezó y se cierra o se sale
 * sin enviar). Solo cuenta campos: nada de lo que se escribe.
 */
export function useFormularioActividad(objetivo: ObjetivoFormulario) {
  const [seguimiento] = useState(() => crearSeguimiento(objetivo));
  useEffect(() => seguimiento.montar(), [seguimiento]);
  return seguimiento;
}
