"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { ChatWidget } from "@/components/chat/chat-widget";
import { useWeb } from "@/components/site/web-provider";
import { whatsappLink } from "@/content/site";
import { cn } from "@/lib/utils";

/** Botones flotantes: WhatsApp abajo a la izquierda y asistente virtual abajo a la derecha. */
export function FloatingActions() {
  const { site } = useWeb();
  const pathname = usePathname();
  // En la calculadora, en móvil y tablet, la barra inferior de precio ocupa ese
  // espacio y los botones taparían opciones: se muestran solo en escritorio.
  const inCalculator = pathname.startsWith("/presupuesto");

  return (
    <>
      <a
        href={whatsappLink("Hola, me gustaría pedir información sobre un trabajo de cristalería.", site.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className={cn(
          "fixed bottom-4 left-4 z-40 size-14 place-items-center rounded-full bg-whatsapp text-white shadow-[0_12px_30px_-10px_rgb(31_143_78/0.7)] transition-transform duration-300 hover:scale-105 sm:bottom-6 sm:left-6 print:hidden",
          inCalculator ? "hidden lg:grid" : "grid",
        )}
      >
        <MessageCircle aria-hidden className="size-6" />
      </a>
      <div
        className={cn(
          "pointer-events-none fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6 print:hidden",
          inCalculator && "hidden lg:block",
        )}
      >
        <ChatWidget />
      </div>
    </>
  );
}
