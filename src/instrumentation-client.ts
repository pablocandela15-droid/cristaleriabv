// Se ejecuta en el navegador antes de que la web sea interactiva (Next.js:
// instrumentation-client). Arranca la actividad para Logs del panel lo antes
// posible, para ver también los errores de la carga. Sin
// NEXT_PUBLIC_SUPABASE_URL no hace nada.
import { iniciarActividad } from "@/lib/actividad";

try {
  iniciarActividad();
} catch {
  // La medición nunca rompe la web.
}
