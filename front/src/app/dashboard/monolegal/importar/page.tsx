"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { getCookie } from "cookies-next";
import { CookiesKeysEnum } from "@/utilities/enums";
import Swal from "sweetalert2";

interface ImportResult {
  radicado: string;
  status: "created" | "updated" | "skipped" | "error";
  message: string;
  details?: {
    despachoJudicial: string;
    city: string;
    ultimaActuacion: string;
    fechaUltimaActuacion?: Date | string;   
  };
}

interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

interface UpdatedRecord {
  radicado: string;
  despachoJudicial: string;
  city: string;
  ultimaActuacion: string;
}

interface ImportResponse {
  success: boolean;
  message: string;
  summary: ImportSummary;
  details: ImportResult[];
  updatedRecords?: UpdatedRecord[];
}

export default function MonolegalImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<
    "today" | "date" | "file" | null
  >(null);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const showUpdatedRecordsAlert = async (
    count: number,
    updatedRecords: UpdatedRecord[]
  ) => {
    const recordsList = updatedRecords
      .slice(0, 10)
      .map(
        (record) => `
        <div style="text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; margin-bottom: 8px; border-radius: 6px;">
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 14px; margin-right: 8px;">Radicado:</span>
            <strong style="color: #1f2937; font-size: 14px;">${
              record.radicado
            }</strong>
          </div>
          <div style="padding-left: 28px;">
            <div style="color: #6b7280; font-size: 13px; margin-bottom: 2px;">
              ${record.despachoJudicial}
            </div>
            ${
              record.city
                ? `<div style="color: #6b7280; font-size: 13px; margin-bottom: 2px;">${record.city}</div>`
                : ""
            }
            <div style="color: #6b7280; font-size: 13px;">
              ${record.ultimaActuacion || "Sin actuación"}
            </div>
          </div>
        </div>
      `
      )
      .join("");

    const moreRecords =
      updatedRecords.length > 10
        ? `<p style="margin-top: 12px; text-align: center; color: #6b7280; font-size: 13px;">... y ${
            updatedRecords.length - 10
          } registros más</p>`
        : "";

    await Swal.fire({
      icon: "info",
      title: `🔄 ${count} ${
        count === 1 ? "Registro Actualizado" : "Registros Actualizados"
      }`,
      html: `
        <div style="max-height: 400px; overflow-y: auto; padding: 10px;">
          ${recordsList}
          ${moreRecords}
        </div>
      `,
      confirmButtonText: "Entendido",
      confirmButtonColor: "#3b82f6",
      width: "650px",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = selectedFile.name.substring(
        selectedFile.name.lastIndexOf(".")
      );

      if (!validExtensions.includes(fileExtension.toLowerCase())) {
        setError("Por favor selecciona un archivo Excel válido (.xlsx o .xls)");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
      setResults(null);
      setSummary(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo primero");
      return;
    }

    setLoading(true);
    setLoadingType("file");
    setError(null);
    setResults(null);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = getCookie(CookiesKeysEnum.token);

      if (!token) {
        setError(
          "No se encontró token de autenticación. Por favor inicia sesión nuevamente."
        );
        setLoading(false);
        setLoadingType(null);
        return;
      }

      const response = await axios.post<ImportResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/monolegal/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSummary(response.data.summary);
        setResults(response.data.details);

        if (response.data.summary.updated > 0 && response.data.updatedRecords) {
          await showUpdatedRecordsAlert(
            response.data.summary.updated,
            response.data.updatedRecords
          );
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al importar el archivo. Por favor intenta nuevamente."
      );
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleSyncFromApi = async () => {
    setLoading(true);
    setLoadingType("today");
    setError(null);
    setResults(null);
    setSummary(null);

    try {
      const token = getCookie(CookiesKeysEnum.token);

      if (!token) {
        setError(
          "No se encontró token de autenticación. Por favor inicia sesión nuevamente."
        );
        setLoading(false);
        setLoadingType(null);
        return;
      }

      const response = await axios.post<ImportResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/monolegal/sync`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSummary(response.data.summary);
        setResults(response.data.details);

        if (response.data.summary.updated > 0 && response.data.updatedRecords) {
          await showUpdatedRecordsAlert(
            response.data.summary.updated,
            response.data.updatedRecords
          );
        }

        Swal.fire({
          icon: "success",
          title: "✅ Sincronización Completada",
          text: `Se procesaron ${response.data.summary.total} registros correctamente`,
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al sincronizar. Por favor intenta nuevamente."
      );

      Swal.fire({
        icon: "error",
        title: "Error en sincronización",
        text: err.response?.data?.message || "Ocurrió un error al sincronizar",
      });
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleSyncByDate = async () => {
    if (!selectedDate) {
      setError("Por favor selecciona una fecha");
      return;
    }

    setLoading(true);
    setLoadingType("date");
    setError(null);
    setResults(null);
    setSummary(null);

    try {
      const token = getCookie(CookiesKeysEnum.token);

      if (!token) {
        setError(
          "No se encontró token de autenticación. Por favor inicia sesión nuevamente."
        );
        setLoading(false);
        setLoadingType(null);
        return;
      }

      const response = await axios.post<ImportResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/monolegal/sync/history`,
        { fecha: selectedDate },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSummary(response.data.summary);
        setResults(response.data.details);

        if (response.data.summary.updated > 0 && response.data.updatedRecords) {
          await showUpdatedRecordsAlert(
            response.data.summary.updated,
            response.data.updatedRecords
          );
        }

        const fechaFormateada = new Date(
          selectedDate + "T12:00:00"
        ).toLocaleDateString("es-CO", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        Swal.fire({
          icon: "success",
          title: "✅ Sincronización Completada",
          html: `<p>Se procesaron <strong>${response.data.summary.total}</strong> registros del <strong>${fechaFormateada}</strong></p>`,
          timer: 4000,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al sincronizar. Por favor intenta nuevamente."
      );

      Swal.fire({
        icon: "error",
        title: "Error en sincronización",
        text: err.response?.data?.message || "Ocurrió un error al sincronizar",
      });
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "created":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "updated":
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case "skipped":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "text-green-600 bg-green-50";
      case "updated":
        return "text-blue-600 bg-blue-50";
      case "skipped":
        return "text-yellow-600 bg-yellow-50";
      case "error":
        return "text-red-600 bg-red-50";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Historial de sincronizaciones
        </h1>
      </div>
     
      <Card className="mb-6 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Actuaciones de una fecha específica
          </CardTitle>
          <CardDescription>
            Selecciona una fecha para visualizar los cambios de ese día
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label
                htmlFor="sync-date"
                className="text-sm font-medium mb-2 block"
              >
                Fecha a visualizar
              </Label>
              <Input
                id="sync-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="bg-white"
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSyncByDate}
                disabled={loading || !selectedDate}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {loading && loadingType === "date" ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 mr-2" />
                    Consultar por fecha
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resumen de importación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">
                  {summary.total}
                </div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {summary.created}
                </div>
                <div className="text-sm text-green-600">Creados</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.updated}
                </div>
                <div className="text-sm text-blue-600">Actualizados</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {summary.skipped}
                </div>
                <div className="text-sm text-yellow-600">Omitidos</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {summary.errors}
                </div>
                <div className="text-sm text-red-600">Errores</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso</span>
                <span>
                  {summary.created + summary.updated} de {summary.total}{" "}
                  procesados
                </span>
              </div>
              <Progress
                value={
                  ((summary.created + summary.updated) / summary.total) * 100
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {results && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de registros</CardTitle>
            <CardDescription>
              Resultado individual de cada proceso importado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${getStatusColor(
                    result.status
                  )}`}
                >
                  <div className="mt-0.5">{getStatusIcon(result.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {result.radicado}
                    </div>
                    <div className="text-xs opacity-80">
                      {result.details?.ultimaActuacion || result.message}
                    </div>
                    {result.details && (
                      <div className="text-xs opacity-70 mt-1">
                        {result.details.city && (
                          <span className="mr-2">{result.details.city}</span>
                        )}
                        {result.details.despachoJudicial && (
                          <span>- {result.details.despachoJudicial}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-semibold uppercase">
                    {result.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* {!summary && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Instrucciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">           
            <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded mb-4">
              <p className="font-semibold text-purple-900 mb-2">
                Sincronización por fecha
              </p>
              <p className="text-purple-800">
                Si necesitas consultar los cambios de un día específico, usa el selector de
                fecha.
              </p>
            </div>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
}
