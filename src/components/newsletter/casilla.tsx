import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Casilla de la newsletter: sin marcar de serie (el consentimiento tiene que ser un acto expreso). Mismo aspecto que
 * la del consentimiento de los formularios (components/forms/consent.tsx), con su propio texto.
 */
export function CasillaNewsletter({
  checked,
  onChange,
  error,
  dark,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 text-[13.5px] leading-snug",
          dark
            ? "has-[:focus-visible]:[&>span:first-of-type]:ring-[3px] has-[:focus-visible]:[&>span:first-of-type]:ring-cream-200/40"
            : "has-[:focus-visible]:[&>span:first-of-type]:ring-[3px] has-[:focus-visible]:[&>span:first-of-type]:ring-navy-700/30",
        )}
      >
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={error ? true : undefined} />
        <span
          aria-hidden
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
            checked
              ? dark
                ? "border-cream-200 bg-cream-200 text-navy-900"
                : "border-navy-900 bg-navy-900 text-cream-100"
              : dark
                ? "border-cream-200/40"
                : "border-navy-900/30 bg-white",
          )}
        >
          {checked && <Check className="size-3.5" />}
        </span>
        <span className={dark ? "text-cream-100/80" : "text-ink-soft"}>{children}</span>
      </label>
      {error && (
        <p role="alert" className={cn("mt-1.5 text-[13px]", dark ? "text-red-300" : "text-destructive")}>
          {error}
        </p>
      )}
    </div>
  );
}
