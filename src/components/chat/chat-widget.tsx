"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { ArrowUp, Bot, X } from "lucide-react";
import { callFunction, formulariosSupabase } from "@/lib/backend";
import { localAnswer } from "@/components/chat/local-answer";
import { registrar } from "@/lib/actividad";
import { useWeb } from "@/components/site/web-provider";
import { whatsappLink } from "@/content/site";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "¿Qué diferencia hay entre cristal templado y laminado?",
  "¿Cuánto cuesta una mampara a medida?",
  "¿La visita técnica tiene coste?",
  "¿Trabajáis fuera del Baix Vinalopó?",
];

const WELCOME: Msg = {
  role: "assistant",
  content:
    "¡Hola! Soy el asistente de Cristalería Baix Vinalopó. Pregúntame lo que quieras sobre cristales, mamparas, cerramientos o presupuestos.",
};

function newSessionId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Asistente virtual. Responde en local con las preguntas frecuentes (las del
 * panel si las hay); con NEXT_PUBLIC_FORMULARIOS_SUPABASE=1 usa la edge function
 * `chat` (OpenAI).
 */
export function ChatWidget() {
  const web = useWeb();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useRef<string>("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Actividad para Logs del panel: abrir, preguntar, responder y cerrar (nunca el texto de las preguntas).
  const abierto = useRef(false);
  useEffect(() => {
    if (open === abierto.current) return;
    abierto.current = open;
    registrar("chat", { accion: open ? "abrir" : "cerrar" });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    if (!sessionId.current) sessionId.current = newSessionId();
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    registrar("chat", { accion: "mensaje" });
    try {
      let reply: string;
      if (formulariosSupabase) {
        const res = await callFunction<{ reply: string }>("chat", {
          sessionId: sessionId.current,
          messages: next.slice(-12),
          page: window.location.pathname,
        });
        reply = res.reply;
      } else {
        await new Promise((r) => setTimeout(r, 450));
        reply = localAnswer(content, web);
      }
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      registrar("chat", { accion: "respuesta", props: { codigo: formulariosSupabase ? "servidor" : "local" } });
    } catch {
      registrar("chat", { accion: "error", props: { codigo: formulariosSupabase ? "servidor" : "local" } });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            `Vaya, ahora mismo no puedo responder. Si quieres, escríbenos por WhatsApp${web.site.phones[0] ? ` o llámanos al ${web.site.phones[0].display}` : ""} y te atendemos enseguida.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Asistente virtual"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto fixed inset-x-3 bottom-3 z-50 flex max-h-[min(640px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-3xl border border-navy-900/10 bg-cream-50/95 shadow-[0_30px_80px_-30px_rgb(6_26_46/0.55)] [backdrop-filter:blur(20px)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px]"
          >
            <header className="flex items-center gap-3 bg-navy-900 px-4 py-3.5 text-cream-100">
              <span className="grid size-10 place-items-center rounded-full bg-cream-200/10 ring-1 ring-cream-200/25">
                <Image src="/brand/icon-512.png" alt="" width={28} height={28} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-[17px] leading-tight text-cream-100">Asistente virtual</p>
                <p className="text-xs text-cream-100/70">Dudas sobre cristales, mamparas y presupuestos</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar asistente"
                className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-cream-200/10"
              >
                <X className="size-5" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <p
                    className={cn(
                      "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-md bg-navy-900 text-cream-100"
                        : "rounded-bl-md border border-navy-900/8 bg-white text-ink",
                    )}
                  >
                    {m.content}
                  </p>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-1.5 px-1 text-ink-soft" aria-label="Escribiendo">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="size-2 rounded-full bg-navy-700/50"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }}
                    />
                  ))}
                </div>
              )}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="cursor-pointer rounded-full border border-navy-900/15 bg-cream-100 px-3 py-2 text-left text-[13px] text-navy-900 transition-colors hover:border-navy-900/35 hover:bg-cream-200/50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-navy-900/10 bg-cream-50 p-3">
              <form onSubmit={onSubmit} className="flex items-center gap-2">
                <label htmlFor="chat-input" className="sr-only">
                  Escribe tu pregunta
                </label>
                <input
                  id="chat-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={600}
                  placeholder="Escribe tu pregunta…"
                  autoComplete="off"
                  className="h-12 flex-1 rounded-xl border border-input bg-white px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-soft focus:border-navy-700 focus:ring-2 focus:ring-navy-700/20"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Enviar"
                  className="grid size-12 cursor-pointer place-items-center rounded-xl bg-navy-900 text-cream-100 transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp className="size-5" />
                </button>
              </form>
              <p className="mt-2 text-center text-[11.5px] text-ink-soft">
                Respuestas orientativas.{" "}
                <a href={whatsappLink(undefined, web.site.whatsapp)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  Hablar con una persona
                </a>
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Cerrar asistente virtual" : "Abrir asistente virtual"}
        className={cn(
          "glass-dark pointer-events-auto flex min-h-14 cursor-pointer items-center gap-3 rounded-full p-2 text-left text-cream-100 shadow-[0_16px_40px_-16px_rgb(6_26_46/0.7)] transition-opacity sm:pr-5",
          open && "pointer-events-none opacity-0",
        )}
        whileHover={{ y: -2 }}
      >
        <span className="relative grid size-10 place-items-center rounded-full bg-cream-200 text-navy-900">
          <Bot aria-hidden className="size-5" />
          <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-navy-900 bg-emerald-400" />
        </span>
        <span className="hidden sm:block">
          <span className="block text-sm font-medium leading-tight">Asistente virtual</span>
          <span className="block text-xs text-cream-100/70">¿Dudas sobre cristales?</span>
        </span>
      </motion.button>
    </>
  );
}
