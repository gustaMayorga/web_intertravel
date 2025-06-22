
"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react"; // Using MessageCircle as a generic chat icon, replace if you have a specific WhatsApp icon SVG

interface WhatsAppButtonProps {
  phoneNumber: string; // Include country code, e.g., +1234567890
  message?: string;   // Optional predefined message
}

export default function WhatsAppButton({ phoneNumber, message }: WhatsAppButtonProps) {
  const handleWhatsAppClick = () => {
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant="default"
      size="icon"
      className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-xl bg-green-500 hover:bg-green-600 text-white z-50"
      onClick={handleWhatsAppClick}
      aria-label="Contactar por WhatsApp"
    >
      {/* You can replace this with a more specific WhatsApp SVG icon if desired */}
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52s-.669-1.611-.916-2.206c-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479s1.065 2.871 1.213 3.07c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.205-1.634a11.802 11.802 0 005.785 1.495h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    </Button>
  );
}
