"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit,
  Send,
  Maximize2,
  Minimize2,
  AlertCircle,
  Download,
} from "lucide-react";
import Link from "next/link";
import {
  type IQuoteWithMeta,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
} from "../../types/quotes.types";
import { QuotePreview } from "./QuotePreview";
import { QuoteTimeline } from "./QuoteTimeline";
import { ResendQuoteModal } from "./ResendQuoteModal";
import { downloadQuotePdf, sendQuote } from "../../../api/quotes.service";
import { toast } from "sonner";

// ─── Props ───────────────────────────────────────────────────────────────────

interface QuoteDetailViewProps {
  quote: IQuoteWithMeta;
  onBack: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function QuoteDetailView({ quote, onBack }: QuoteDetailViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);

  const statusColors = QUOTE_STATUS_COLORS[quote.quoteStatus];

  return (
    <div className="p-2 sm:p-4 md:p-6 min-w-0 overflow-x-hidden">
      {/* ── 1. Encabezado ──────────────────────────────────────────────────── */}
      <div className="mb-4 sm:mb-6">
        {/* Fila superior: back + acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="shrink-0 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                  {quote.quoteId}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${statusColors.dot}`}
                  />
                  {QUOTE_STATUS_LABELS[quote.quoteStatus]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {quote.companyName} · {quote.contactName}
              </p>
            </div>
          </div>

          {/* Acciones según estado */}
          <div className="flex items-center gap-2 shrink-0">
            {quote.quoteStatus === "draft" && (
              <>
                <Link
                  href={`/dashboard/generar-cotizacion?edit=${quote._id}`}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-elena-pink-400 text-elena-pink-600 hover:bg-elena-pink-50"
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    Continuar edición
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-400 text-emerald-600 hover:bg-emerald-50"
                  onClick={async () => {
                    if (
                      window.confirm(
                        `¿Enviar cotización ${quote.quoteId} a ${quote.email}?`,
                      )
                    ) {
                      try {
                        await sendQuote(quote._id);
                        toast.success(`Cotización enviada a ${quote.email}`);
                        onBack(); // Volver a la grilla para refrescar
                      } catch (error: any) {
                        toast.error(
                          error.message || "Error al enviar la cotización",
                        );
                      }
                    }
                  }}
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  Enviar cotización
                </Button>
              </>
            )}

            {quote.quoteStatus === "sent" && (
              <Button
                variant="outline"
                size="sm"
                className="border-amber-400 text-amber-600 hover:bg-amber-50"
                onClick={() => setShowResendModal(true)}
              >
                <Send className="h-4 w-4 mr-1.5" />
                Reenviar
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="border-gray-400 text-gray-600 hover:bg-gray-50"
              onClick={async () => {
                try {
                  await downloadQuotePdf(quote._id, quote.quoteId);
                  toast.success("PDF descargado");
                } catch {
                  toast.error("Error al descargar el PDF");
                }
              }}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Descargar PDF
            </Button>
          </div>
        </div>

        {/* Info rápida */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
          <span>
            Última actualización:{" "}
            {new Date(quote.updatedAt).toLocaleString("es-CO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span>·</span>
          <span>Email: {quote.email}</span>
        </div>
      </div>

      {/* ── 2. Layout Split Panel ──────────────────────────────────────────── */}
      <div
        className={`grid gap-4 ${
          isFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
        }`}
      >
        {/* ── Panel izquierdo: Preview ──────────────────────────────────── */}
        <div
          className={`${
            isFullscreen ? "col-span-1" : "lg:col-span-2"
          } border rounded-lg bg-white overflow-hidden`}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Vista previa de la cotización
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={
                isFullscreen
                  ? "Salir de pantalla completa"
                  : "Ver en pantalla completa"
              }
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
            {quote ? (
              <QuotePreview quote={quote} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-3 text-gray-300" />
                <p className="text-sm">No se pudo renderizar la vista previa</p>
                <p className="text-xs mt-1">
                  El histórico sigue disponible en el panel derecho
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Panel derecho: Timeline ───────────────────────────────────── */}
        {!isFullscreen && (
          <div className="lg:col-span-1 border rounded-lg bg-white overflow-hidden">
            <div className="px-4 py-2 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                Línea de tiempo
              </h2>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
              <QuoteTimeline quote={quote} />
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Reenviar ──────────────────────────────────────────────── */}
      {showResendModal && (
        <ResendQuoteModal
          quote={quote}
          onClose={() => setShowResendModal(false)}
        />
      )}
    </div>
  );
}
