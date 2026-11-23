"use client";

import { useState } from "react";
import { BookingForm } from "@/components/forms/booking-form";
import { TravelCost, type TravelResult } from "@/components/tools/travel-cost";
import { NativeSelect, Field } from "@/components/forms/fields";
import { useWeb } from "@/components/site/web-provider";

/** Reserva de visita técnica: población (coste de desplazamiento) + datos de contacto. */
export function ContactBooking() {
  const { services } = useWeb();
  const [travel, setTravel] = useState<TravelResult | null>(null);
  const [service, setService] = useState("");
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-navy-900/10 bg-cream-50 p-5 sm:p-6">
        <h3 className="font-heading text-lg font-medium">1. ¿Dónde y qué?</h3>
        <div className="mt-4 space-y-4">
          <Field label="Servicio">
            {(p) => (
              <NativeSelect
                {...p}
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="Selecciona el tipo de trabajo"
                options={services.map((s) => ({ value: s.name, label: s.name }))}
              />
            )}
          </Field>
          <TravelCost value={travel} onChange={setTravel} compact />
        </div>
      </div>
      <div className="rounded-2xl border border-navy-900/10 bg-cream-50 p-5 sm:p-6">
        <h3 className="font-heading text-lg font-medium">2. Tus datos</h3>
        <div className="mt-4">
          <BookingForm service={service || undefined} travel={travel} />
        </div>
      </div>
    </div>
  );
}
