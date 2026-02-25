"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { IQuoteWithMeta } from "../../types/quotes.types";
import { pushTimelineEvent, sendQuote } from "../../../api/quotes.service";

// ─── Props ───────────────────────────────────────────────────────────────────

interface ResendQuoteModalProps {
  quote: IQuoteWithMeta;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ResendQuoteModal({ quote, onClose }: ResendQuoteModalProps) {
  const [email, setEmail] = useState(quote.email);
  const [isSending, setIsSending] = useState(false);

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error("Ingresa un correo electrónico válido");
      return;
    }

    setIsSending(true);

    try {
      await sendQuote(quote._id, email);
      toast.success(`Cotización reenviada a ${email}`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al reenviar la cotización");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Reenviar cotización</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              La cotización{" "}
              <span className="font-mono font-medium text-elena-pink-600">
                {quote.quoteId}
              </span>{" "}
              será reenviada al siguiente correo electrónico:
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Correo electrónico del destinatario
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              className="text-sm"
            />
            {email !== quote.email && (
              <p className="text-xs text-amber-600">
                ⚠ El correo original era: {quote.email}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            className="bg-elena-pink-600 hover:bg-elena-pink-700 text-white"
            onClick={handleResend}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1.5" />
                Confirmar reenvío
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
