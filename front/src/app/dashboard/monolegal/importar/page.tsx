"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import { getCookie } from "cookies-next"; 
import { CookiesKeysEnum } from "@/utilities/enums"; 

interface ImportResult {
  radicado: string;
  status: "created" | "updated" | "skipped" | "error";
  message: string;
}

interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

export default function MonolegalImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf("."));
      
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
    setError(null);
    setResults(null);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
     
      const token = getCookie(CookiesKeysEnum.token);

      if (!token) {
        setError("No se encontró token de autenticación. Por favor inicia sesión nuevamente.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
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
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error al importar el archivo. Por favor intenta nuevamente."
      );
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold mb-2">Importar desde Monolegal</h1>
        <p className="text-gray-600">
          Sincroniza los procesos judiciales desde el Excel exportado de Monolegal
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Subir archivo de Monolegal</CardTitle>
          <CardDescription>
            Selecciona el archivo Excel descargado desde la extensión de Monolegal (martes y jueves)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Seleccionar archivo</span>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
            </label>

            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{file.name}</span>
                <span className="text-gray-400">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Importar y sincronizar
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
                <div className="text-2xl font-bold text-gray-700">{summary.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.created}</div>
                <div className="text-sm text-green-600">Creados</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summary.updated}</div>
                <div className="text-sm text-blue-600">Actualizados</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{summary.skipped}</div>
                <div className="text-sm text-yellow-600">Omitidos</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
                <div className="text-sm text-red-600">Errores</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso</span>
                <span>
                  {summary.created + summary.updated} de {summary.total} procesados
                </span>
              </div>
              <Progress
                value={((summary.created + summary.updated) / summary.total) * 100}
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
                  className={`flex items-start gap-3 p-3 rounded-lg ${getStatusColor(result.status)}`}
                >
                  <div className="mt-0.5">{getStatusIcon(result.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {result.radicado}
                    </div>
                    <div className="text-xs opacity-80">{result.message}</div>
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

      {!summary && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Instrucciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700">1.</span>
              <p>
                Abre Excel y ve a la pestaña de <strong>Complementos</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700">2.</span>
              <p>
                Busca <strong>Excel + Monolegal</strong> e inicia sesión
              </p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700">3.</span>
              <p>
                Haz clic en <strong>Actualizar procesos</strong> para descargar los cambios
              </p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700">4.</span>
              <p>
                Guarda el archivo Excel en tu computadora
              </p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700">5.</span>
              <p>
                Sube el archivo aquí para sincronizar con ELENA
              </p>
            </div>
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Frecuencia recomendada:</strong> Martes y Jueves
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}