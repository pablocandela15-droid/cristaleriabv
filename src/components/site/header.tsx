"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronDown, Menu, Phone } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Logo } from "@/components/site/logo";
import { ServiceIcon } from "@/components/site/service-icon";
import { useWeb } from "@/components/site/web-provider";
import { mainNav } from "@/content/site";
import { cn } from "@/lib/utils";

export function Header() {
  const { site, services } = useWeb();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));
  // El menú móvil se cierra solo: cada enlace va envuelto en <SheetClose>.

  const isActive = (href: string) =>
    href !== "/" && !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  const phone = site.phones[0];

  return (
    <header className="sticky top-0 z-40">
      <motion.div
        className={cn(
          "border-b transition-[background-color,border-color,box-shadow] duration-500 ease-glass",
          scrolled
            ? "border-navy-900/10 bg-cream-100/75 shadow-[0_8px_30px_-18px_rgb(6_26_46/0.35)] [backdrop-filter:blur(16px)_saturate(150%)]"
            : "border-transparent bg-cream-100/0",
        )}
      >
        <div className="container-site flex h-[76px] items-center justify-between gap-6">
          <Logo priority className="h-12 sm:h-14" />

          <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
            {mainNav.map((item) =>
              item.href === "/servicios" ? (
                <div key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-[15px] text-ink transition-colors hover:text-navy-700",
                      isActive(item.href) && "text-navy-900 font-medium",
                    )}
                  >
                    {item.label}
                    <ChevronDown aria-hidden className="size-3.5 transition-transform duration-300 group-hover:rotate-180 group-focus-within:rotate-180" />
                  </Link>
                  {/* Menú desplegable de servicios */}
                  <div className="invisible absolute left-1/2 top-full w-[560px] -translate-x-1/2 translate-y-2 pt-3 opacity-0 transition-all duration-300 ease-glass group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <div className="grid grid-cols-2 gap-1 rounded-2xl border border-navy-900/10 bg-cream-50/95 p-2 shadow-[0_24px_60px_-24px_rgb(6_26_46/0.45)] [backdrop-filter:blur(18px)]">
                      {services.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/servicios/${s.slug}`}
                          className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-cream-200/60"
                        >
                          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-navy-900 text-cream-200">
                            <ServiceIcon slug={s.slug} className="size-[18px]" />
                          </span>
                          <span>
                            <span className="block text-sm font-medium text-navy-900">{s.name}</span>
                            <span className="block text-[13px] leading-snug text-ink-soft">{s.short}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-md px-3 text-[15px] text-ink transition-colors hover:text-navy-700",
                    isActive(item.href) && "font-medium text-navy-900",
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            {phone && (
              <a
                href={`tel:${phone.tel}`}
                className="hidden min-h-11 items-center gap-2 rounded-lg bg-navy-900 px-4 text-[15px] font-medium text-cream-100 shadow-layered transition-colors hover:bg-navy-800 sm:inline-flex"
              >
                <Phone aria-hidden className="size-4 text-cream-200" />
                {phone.display}
              </a>
            )}

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                aria-label="Abrir menú"
                className="grid size-11 cursor-pointer place-items-center rounded-lg border border-navy-900/15 bg-cream-50/70 text-navy-900 lg:hidden"
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[88%] gap-0 border-l-navy-900/10 bg-cream-100 p-0 sm:max-w-sm">
                <SheetTitle className="sr-only">Menú</SheetTitle>
                <div className="flex h-[72px] items-center border-b border-navy-900/10 px-5">
                  <Logo className="h-10" />
                </div>
                <nav aria-label="Menú móvil" className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
                  {mainNav.map((item) => (
                    <SheetClose
                      key={item.href}
                      render={<Link href={item.href} />}
                      className="flex min-h-12 items-center justify-between rounded-lg px-3 font-heading text-xl text-navy-900 hover:bg-cream-200/60"
                    >
                      {item.label}
                      <ArrowRight aria-hidden className="size-4 text-gold-600" />
                    </SheetClose>
                  ))}
                  <p className="mt-6 px-3 text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">Servicios</p>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {services.map((s) => (
                      <SheetClose
                        key={s.slug}
                        render={<Link href={`/servicios/${s.slug}`} />}
                        className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-ink hover:bg-cream-200/60"
                      >
                        <ServiceIcon slug={s.slug} className="size-4 text-navy-700" />
                        {s.name}
                      </SheetClose>
                    ))}
                  </div>
                </nav>
                <div className="space-y-2 border-t border-navy-900/10 p-4">
                  {site.phones.map((p) => (
                    <a
                      key={p.tel}
                      href={`tel:${p.tel}`}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-navy-900 text-cream-100"
                    >
                      <Phone aria-hidden className="size-4 text-cream-200" />
                      {p.label ? `${p.label}: ${p.display}` : p.display}
                    </a>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
