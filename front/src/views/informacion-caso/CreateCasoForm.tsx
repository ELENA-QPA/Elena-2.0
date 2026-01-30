"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Save, ArrowLeft, Loader2 } from "lucide-react";
import { useCaso } from "@/modules/informacion-caso/hooks/useCaso";
import { CreateCasoBody } from "@/modules/informacion-caso/data/interfaces/caso.interface";
import { toast } from "sonner";
import { getCookie } from "cookies-next";
import { CookiesKeysEnum } from "@/utilities/enums";
import Link from "next/link";

const JURISDICTIONS = [
  "Administrativo",
  "Civil circuito - mayor cuantía",
  "Civil municipal - menor cuantía",
  "Civil municipal de pequeñas causas y competencia múltiple - mínima cuantía",
  "Consejo de Estado",
  "Familia",
  "Laboral circuito",
  "Pequeñas causas laborales",
  "Tribunal administrativo - sección primera",
  "Tribunal administrativo - sección segunda",
  "Tribunal administrativo - sección tercera",
  "Tribunal administrativo - sección cuarta",
  "Otros",
];

const PROCESS_TYPES_BY_JURISDICTION: Record<string, string[]> = {
  Administrativo: [
    "Acción de nulidad y restablecimiento del derecho",
    "Acciones de cumplimiento",
    "Acciones de grupo",
    "Acciones populares",
    "Aprobación conciliaciones extrajudiciales",
    "Comisiones (Despachos comisorios)",
    "Negación copias, consultas y certificaciones (artículos 21 y 24 de la Ley 57 de 1985)",
    "Residuales (diferentes a temas laborales, contractuales o tributarios)",
    "Sección 1a electorales",
    "Sección 1a nulidad simple (otros asuntos)",
    "Sección 1a nulidad y restablecimiento del derecho (otros asuntos)",
    "Sección 2a ejecutivos (laboral)",
    "Sección 2a lesividad",
    "Sección 2a nulidad y restablecimiento del derecho (asuntos laborales)",
    "Sección 3a acción de repetición",
    "Sección 3a contractuales",
    "Sección 3a ejecutivos (contractual)",
    "Sección 3a reparación directa",
    "Sección 3a restitución de inmueble",
    "Sección 4a jurisdicción coactiva",
    "Sección 4a nulidad simple (asuntos tributarios)",
    "Sección 4a nulidad y restablecimiento del derecho (asuntos tributarios)",
  ],

  "Civil circuito - mayor cuantía": [
    "Procesos verbales (mayor cuantía)",
    "Proceso nulidad, disolución y liquidación sociedad civil y comercial",
    "Proceso pertenencia, divisorios, deslinde, amojonamiento",
    "Procesos de insolvencia",
    "Acciones populares y de grupo",
    "Procesos ejecutivos",
    "Pruebas extraprocesales designación árbitros",
    "Otros procesos (exhortos, recusaciones, etc.)",
  ],

  "Civil municipal - menor cuantía": [
    "Verbal de menor cuantía",
    "Verbal sumario",
    "Monitorio",
    "Pertenencia - divisorios - deslinde y amojonamiento",
    "Ejecutivo de menor cuantía",
    "Sucesión",
    "Pruebas extraprocesales - otros requerimientos - diligencias varias",
    "Matrimonio civil",
    "Proceso de insolvencia",
    "Medidas cautelares anticipadas",
    "Despacho comisorio",
  ],

  "Civil municipal de pequeñas causas y competencia múltiple - mínima cuantía":
    [
      "Verbal de mínima cuantía",
      "Monitorio",
      "Sucesión de mínima cuantía",
      "Celebración matrimonio civil - mínima cuantía",
      "Despacho comisorio",
      "Otros procesos de mínima cuantía",
      "Ejecutivo de mínima cuantía",
      "Verbal sumario",
      "Pertenencia - divisorios - deslinde y amojonamiento",
      "Pruebas extraprocesales - otros requerimientos - diligencias varias",
      "Proceso de insolvencia",
      "Medidas cautelares anticipadas",
    ],

  "Consejo de Estado": ["Otros"],

  Familia: [
    "Verbales",
    "Verbales sumarios",
    "Sucesión y cualquier otro de naturaleza liquidatoria",
    "Jurisdicción voluntaria",
    "Adopciones",
    "Derechos menores - permisos especiales salidas del país",
    "Ejecutivo de alimentos - ejecutivo",
    "Homologaciones",
    "Restablecimiento de derechos",
    "Otros procesos y actuaciones (comisarias, ICBF, cancillería, etc.)",
  ],

  "Laboral circuito": [
    "Ordinario",
    "Fuero sindical - acción de reintegro",
    "Cancelación personería jurídica",
    "Ejecutivos",
    "Pago por consignación",
    "Residual - otros procesos",
    "Homologaciones",
    "Despachos comisorios de laborales",
  ],

  "Pequeñas causas laborales": [
    "Ordinario de única instancia",
    "Ejecutivos",
    "Pago por consignación - oficina de depósitos judiciales",
    "Residual - otros procesos",
  ],

  "Tribunal administrativo - sección primera": [
    "Electorales",
    "Nulidad simple (otros asuntos)",
    "Nulidad y restablecimiento del derecho (otros asuntos)",
  ],

  "Tribunal administrativo - sección segunda": [
    "Ejecutivos (laboral)",
    "Lesividad",
    "Nulidad y restablecimiento del derecho (asuntos laborales)",
  ],

  "Tribunal administrativo - sección tercera": [
    "Acción de repetición",
    "Ejecutivos (contractual)",
    "Reparación directa",
    "Restitución de inmueble",
  ],

  "Tribunal administrativo - sección cuarta": [
    "Jurisdicción coactiva",
    "Nulidad simple (asuntos tributarios)",
    "Nulidad y restablecimiento del derecho (asuntos tributarios)",
  ],

  Otros: [
    "Superintendencia de Industria y Comercio",
    "Superintendencia Financiera",
    "Otro",
  ],
};

const NORMALIZED_PROCESS_TYPES = new Map<string, string[]>(
  Object.entries(PROCESS_TYPES_BY_JURISDICTION).map(([k, v]) => [
    k.toLowerCase().trim(),
    v,
  ]),
);

export function CreateCasoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const casoId = searchParams.get("id");

  const { caso, loading, error, createCaso, getCasoById } = useCaso();

  const [processTypes, setProcessTypes] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    etiqueta: "",
    clientType: "",
    department: "",
    city: "",
    personType: "",
    documentType: "",
    documentName: "",
    numeroRadicado: "",
    country: "COLOMBIA",
    jurisdiction: "",
    processType: "",
    despachoJudicial: "",
    location: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const raw = formData.jurisdiction;
    if (!raw) {
      setProcessTypes([]);
      return;
    }

    const key = raw.toLowerCase().trim();
    let tipos = NORMALIZED_PROCESS_TYPES.get(key);

    if (!tipos) {
      for (const [mapKey, mapTipos] of NORMALIZED_PROCESS_TYPES.entries()) {
        if (mapKey.includes(key) || key.includes(mapKey)) {
          tipos = mapTipos;
          break;
        }
      }
    }

    tipos = tipos || [];

    setProcessTypes(tipos);

    // limpiar el seleccionado previo
    setFormData((prev) => ({ ...prev, processType: "" }));
  }, [formData.jurisdiction]);

  // Si estamos en modo edición, cargar el caso
  useEffect(() => {
    const raw = formData.jurisdiction;
    if (!raw) {
      setProcessTypes([]);
      return;
    }

    const key = raw.toLowerCase().trim();
    let tipos = NORMALIZED_PROCESS_TYPES.get(key);

    if (!tipos) {
      for (const [mapKey, mapTipos] of NORMALIZED_PROCESS_TYPES.entries()) {
        if (mapKey.includes(key) || key.includes(mapKey)) {
          tipos = mapTipos;
          break;
        }
      }
    }

    tipos = tipos || [];

    setProcessTypes(tipos);
    setFormData((prev) => ({ ...prev, processType: "" }));
  }, [formData.jurisdiction]);

  // USEEFFECT 1: Cargar el caso (modo edit o view)
  useEffect(() => {
    if ((mode === "edit" || mode === "view") && casoId) {
      getCasoById(casoId);
    }
  }, [mode, casoId, getCasoById]);

  // USEEFFECT 2: Mapear los datos del caso al formulario
  useEffect(() => {
    if (caso && (mode === "edit" || mode === "view")) {
      setFormData({
        etiqueta: caso.etiqueta || "",
        clientType: caso.clientType?.trim() || "",
        department: caso.department || "",
        city: caso.city || "",
        personType: caso.personType || "",
        documentType:
          (caso.documents &&
            caso.documents[0] &&
            (caso.documents[0].category || caso.documents[0].documentType)) ||
          "",
        documentName:
          (caso.documents && caso.documents[0] && caso.documents[0].document) ||
          "",
        numeroRadicado:
          caso.radicado || caso.numeroRadicado || caso.etiqueta || "",
        country: caso.country || "COLOMBIA",
        jurisdiction: caso.jurisdiction || "",
        processType: caso.processType || "",
        despachoJudicial: caso.despachoJudicial || "",
        location: caso.location || "",
      });
    }
  }, [caso, mode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validar campos obligatorios
      if (
        !formData.etiqueta ||
        !formData.clientType ||
        !formData.department ||
        !formData.city ||
        !formData.personType ||
        !formData.documentType ||
        !formData.documentName ||
        !formData.numeroRadicado ||
        !formData.country ||
        !formData.jurisdiction ||
        !formData.processType ||
        !formData.despachoJudicial ||
        !formData.location
      ) {
        console.error("[CREATE_CASO_FORM] Faltan campos obligatorios:", {
          etiqueta: !!formData.etiqueta,
          clientType: !!formData.clientType,
          department: !!formData.department,
          personType: !!formData.personType,
          documentType: !!formData.documentType,
          documentName: !!formData.documentName,
          numeroRadicado: !!formData.numeroRadicado,
          country: !!formData.country,
          jurisdiction: !!formData.jurisdiction,
          processType: !!formData.processType,
          despachoJudicial: !!formData.despachoJudicial,
          location: !!formData.location,
        });
        toast.error("Por favor completa todos los campos obligatorios (*)");
        setIsSubmitting(false);
        return;
      }

      // Obtener el usuario y token responsable
      let responsible = "Sistema";

      // Verificar token en cookies (usado por el HttpClient)
      const cookieToken = getCookie(CookiesKeysEnum.token);

      if (!cookieToken) {
        toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
        setIsSubmitting(false);
        router.push("/login");
        return;
      }

      try {
        const userDataString = localStorage.getItem("user");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          responsible = userData?.name || userData?.email || "Sistema";
        } else {
          console.warn(
            "[CREATE_CASO_FORM] No se encontró información de usuario en localStorage, usando datos por defecto",
          );
        }
      } catch (err) {
        console.warn(
          "[CREATE_CASO_FORM] Error al obtener el usuario del localStorage:",
          err,
        );
      }

      const casoData: CreateCasoBody = {
        clientType: formData.clientType,
        responsible: responsible,
        department: formData.department,
        city: formData.city,
        numeroRadicado:
          formData.numeroRadicado || formData.etiqueta || undefined,
        personType: formData.personType || "NATURAL",
        jurisdiction: formData.jurisdiction,
        processType: formData.processType,
        despachoJudicial: formData.despachoJudicial,
        radicado: formData.numeroRadicado || "NO",
        country: formData.country || "COLOMBIA",
        location: formData.location,
        // estado: 'ACTIVO',

        documents: [
          {
            category: formData.documentType || "Documento",
            documentType: "Escrito",
            document:
              formData.documentName || formData.documentType || "Documento",
            subdocument: "",
            settledDate: new Date().toISOString(),
            consecutive: "",
            responsibleType: responsible,
            responsible: responsible,
            observations: "Documento creado automáticamente",
          },
        ],
        interveners: [],
        proceduralParts: [],
        payments: [
          {
            successBonus: false,
            bonusPercentage: 0,
            bonusPrice: 0,
            bonusCausationDate: "",
            bonusPaymentDate: "",
            notes: "",
            paymentValues: [],
          },
        ],
        files: [],
        filesMetadata: JSON.stringify({
          totalFiles: 0,
          fileNames: [],
          createdAt: new Date().toISOString(),
        }),
      };

      const response = await createCaso(casoData);

      if ("record" in response) {
        toast.success("Caso creado exitosamente", { position: "top-right" });
        router.push(
          `/dashboard/informacion-caso?mode=view&id=${response.record._id}`,
        );
      } else {
        const errorMsg = Array.isArray(response.message)
          ? response.message.join(", ")
          : response.message;
        console.error("[CREATE_CASO_FORM] Error en respuesta:", errorMsg);
        toast.error(errorMsg, { position: "top-right" });
      }
    } catch (error) {
      console.error("[CREATE_CASO_FORM] Error inesperado:", error);
      toast.error("Error inesperado al crear el caso", {
        position: "top-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && mode === "edit") {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando caso...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/expedientes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight elena-text-gradient">
              {mode === "edit" ? "Editar Caso" : "Crear Nuevo Caso"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "edit"
                ? "Modifica la información del caso"
                : "Completa la información para crear un nuevo caso"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="elena-card">
        <CardHeader>
          <CardTitle className="text-pink-700">Información del Caso</CardTitle>
          <CardDescription>
            Completa todos los campos requeridos para crear el expediente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Código Interno */}
              <div className="space-y-2">
                <Label htmlFor="internalCode">Código Interno *</Label>
                <Input
                  id="internalCode"
                  value={formData.etiqueta}
                  onChange={(e) =>
                    handleInputChange("etiqueta", e.target.value)
                  }
                  placeholder="Ej: EXP-2024-001"
                  required
                />
              </div>

              {/* Tipo de Cliente */}
              <div className="space-y-2">
                <Label htmlFor="clientType">Tipo de Cliente *</Label>
                <Select
                  value={formData.clientType}
                  onValueChange={(value) =>
                    handleInputChange("clientType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rappi">Rappi</SelectItem>
                    <SelectItem value="Uber">Uber</SelectItem>
                    <SelectItem value="Didi">Didi</SelectItem>
                    <SelectItem value="Beat">Beat</SelectItem>
                    <SelectItem value="iFood">iFood</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Documento (select) */}
              <div className="space-y-2">
                <Label htmlFor="documentType">Documento *</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) =>
                    handleInputChange("documentType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Demanda">Demanda</SelectItem>
                    <SelectItem value="Memorial">Memorial</SelectItem>
                    <SelectItem value="Concepto">Concepto</SelectItem>
                    <SelectItem value="Derecho de petición">
                      Derecho de petición
                    </SelectItem>
                    <SelectItem value="Notificación personal">
                      Notificación personal
                    </SelectItem>
                    <SelectItem value="Poder">Poder</SelectItem>
                    <SelectItem value="Tutela">Tutela</SelectItem>
                    <SelectItem value="Acta de Conciliación">
                      Acta de Conciliación
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nombre de documento */}
              <div className="space-y-2">
                <Label htmlFor="documentName">Nombre de documento *</Label>
                <Input
                  id="documentName"
                  value={formData.documentName}
                  onChange={(e) =>
                    handleInputChange("documentName", e.target.value)
                  }
                  placeholder="Ej: Demanda inicial"
                  required
                />
              </div>
              {/* Tipo de Documento */}
              <div className="space-y-2">
                <Label htmlFor="documentType">Tipo de Documento *</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) =>
                    handleInputChange("documentType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Escrito">Escrito</SelectItem>
                    <SelectItem value="Documento del proceso">
                      Documento del proceso
                    </SelectItem>
                    <SelectItem value="Documento contraparte">
                      Documento contraparte
                    </SelectItem>
                    <SelectItem value="Documento general">
                      Documento general
                    </SelectItem>
                    <SelectItem value="Documento juzgado">
                      Documento juzgado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Departamento */}
              <div className="space-y-2">
                <Label htmlFor="department">Departamento *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    handleInputChange("department", e.target.value)
                  }
                  placeholder="Ej: Bogotá D.C."
                  required
                />
              </div>

              {/* Ciudad */}
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Ej: Bogotá"
                  required
                />
              </div>

              {/* Número de radicado */}
              <div className="space-y-2">
                <Label htmlFor="numeroRadicado">Número de radicado *</Label>
                <Input
                  id="numeroRadicado"
                  value={formData.numeroRadicado}
                  onChange={(e) =>
                    handleInputChange("numeroRadicado", e.target.value)
                  }
                  placeholder="Ej: RAD-2025-001"
                  required
                />
              </div>

              {/* País */}
              {/* <div className="space-y-2">
                <Label htmlFor="country">País *</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLOMBIA">Colombia</SelectItem>
                    <SelectItem value="ARGENTINA">Argentina</SelectItem>
                    <SelectItem value="MEXICO">México</SelectItem>
                    <SelectItem value="CHILE">Chile</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              {/* Jurisdicción */}
              <div className="space-y-2">
                <Label htmlFor="jurisdiction">Jurisdicción *</Label>
                <Select
                  value={formData.jurisdiction}
                  onValueChange={(value) =>
                    handleInputChange("jurisdiction", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la jurisdicción" />
                  </SelectTrigger>
                  <SelectContent>
                    {JURISDICTIONS.map((j) => (
                      <SelectItem key={j} value={j}>
                        {j}
                      </SelectItem>
                    ))}
                    {/* <SelectItem value="SIUGJ">SIUGJ</SelectItem>
                    <SelectItem value="BUSQUEDA DE CONSULTA NACIONAL">BUSQUEDA DE CONSULTA NACIONAL</SelectItem>
                    <SelectItem value="SAMAI">SAMAI</SelectItem>
                    <SelectItem value="SIC">SIC</SelectItem>                       */}
                    {/* <SelectItem value="LABORAL CIRCUITO">LABORAL CIRCUITO</SelectItem>
                    <SelectItem value="CIVIL CIRCUITO">CIVIL CIRCUITO</SelectItem>
                    <SelectItem value="PENAL CIRCUITO">PENAL CIRCUITO</SelectItem>
                    <SelectItem value="CONTENCIOSO ADMINISTRATIVO">CONTENCIOSO ADMINISTRATIVO</SelectItem>
                    <SelectItem value="FAMILIA">FAMILIA</SelectItem>
                    <SelectItem value="COMERCIAL">COMERCIAL</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Proceso */}
              <div className="space-y-2 col-span-2">
                <Label className="w-full" htmlFor="processType">
                  Tipo de Proceso *
                </Label>

                {/* 
    key = formData.jurisdiction -> fuerza remount del Select cuando cambie jurisdicción
    value -> si no hay opciones, pasamos "" para forzar que el Select no muestre un valor antiguo
  */}
                <Select
                  key={formData.jurisdiction || "none"}
                  value={processTypes.length ? formData.processType : ""}
                  onValueChange={(value) =>
                    handleInputChange("processType", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona el tipo de proceso" />
                  </SelectTrigger>
                  <SelectContent>
                    {processTypes.length === 0 ? (
                      <SelectItem value="" key="empty" disabled>
                        Selecciona primero una jurisdicción
                      </SelectItem>
                    ) : (
                      processTypes.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Oficina */}
              <div className="space-y-2">
                <Label htmlFor="despachoJudicial">Despacho Judicial *</Label>
                <Input
                  id="despachoJudicial"
                  value={formData.despachoJudicial}
                  onChange={(e) =>
                    handleInputChange("despachoJudicial", e.target.value)
                  }
                  placeholder="Ej: Juzgado 1 Civil del Circuito de Bogotá"
                  required
                />
              </div>

              {/* Ubicación del Expediente */}
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación del Expediente *</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) =>
                    handleInputChange("location", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la ubicación del expediente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIUGJ">SIUGJ</SelectItem>
                    <SelectItem value="BUSQUEDA DE CONSULTA NACIONAL">
                      BUSQUEDA DE CONSULTA NACIONAL
                    </SelectItem>
                    <SelectItem value="SAMAI">SAMAI</SelectItem>
                    <SelectItem value="SIC">SIC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Link href="/dashboard/expedientes">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                className="bg-pink-600 hover:bg-pink-700 text-white"
                disabled={isSubmitting}
                onClick={() => {}}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === "edit" ? "Actualizar Caso" : "Crear Caso"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
