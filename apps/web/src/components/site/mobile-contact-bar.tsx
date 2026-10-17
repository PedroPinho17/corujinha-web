"use client";

import { MessageCircle, Phone } from "lucide-react";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function MobileContactBar({
  phone,
  whatsapp,
}: {
  phone: string;
  whatsapp?: string | null;
}) {
  const tel = digitsOnly(phone);
  const wa = digitsOnly(whatsapp || phone);
  if (!tel) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-pink/15 bg-white/95 p-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
        <a
          href={`tel:+${tel.startsWith("351") ? tel : `351${tel}`}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-pink px-4 py-3 text-sm font-semibold text-white"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Ligar
        </a>
        <a
          href={`https://wa.me/${wa.startsWith("351") ? wa : `351${wa}`}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-orange bg-orange/10 px-4 py-3 text-sm font-semibold text-orange-dark"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
