import { faqs as defaultFaqs, type Faq } from "@/content/faq";
import { services as defaultServices, type Service } from "@/content/services";
import { site as defaultSite, type Site } from "@/content/site";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ");

/**
 * Respuesta local para cuando el asistente con IA (edge function `chat`) no está
 * activo: busca la pregunta frecuente o el servicio que mejor encaja. Usa las
 * preguntas, servicios y teléfonos editados en el panel si se le pasan.
 */
export function localAnswer(
  question: string,
  { faqs = defaultFaqs, services = defaultServices, site = defaultSite }: { faqs?: Faq[]; services?: Service[]; site?: Site } = {},
): string {
  const q = normalize(question);
  const words = new Set(q.split(/\s+/).filter((w) => w.length > 2));

  let best: { score: number; answer: string } = { score: 0, answer: "" };

  for (const f of faqs) {
    let score = 0;
    for (const tag of f.tags) if (q.includes(normalize(tag))) score += tag.includes(" ") ? 3 : 2;
    for (const w of normalize(f.q).split(/\s+/)) if (w.length > 3 && words.has(w)) score += 1;
    if (score > best.score) best = { score, answer: f.a };
  }

  for (const s of services) {
    const key = normalize(s.name);
    if (q.includes(key) || q.includes(key.replace(/s$/, ""))) {
      const asksPrice = /precio|cuesta|cuanto|presupuesto|coste/.test(q);
      const answer = asksPrice
        ? `Puedes calcular al momento un precio orientativo de ${s.name.toLowerCase()} en nuestra calculadora (menú «Presupuesto»): eliges medidas, tipo de cristal y acabados y te damos una estimación. El precio final se confirma tras la visita técnica.`
        : `${s.intro} ¿Quieres que te ayude a calcular un presupuesto orientativo?`;
      if (3 > best.score) best = { score: 3, answer };
    }
  }

  if (best.score >= 2) return best.answer;

  const phone = site.phones[0]?.display;
  return `No tengo una respuesta exacta para eso, pero el equipo te ayuda encantado: ${phone ? `llámanos al ${phone} o ` : ""}escríbenos por WhatsApp. También puedes calcular un presupuesto orientativo en la sección «Presupuesto».`;
}
