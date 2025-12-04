'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useCaso } from '@/modules/informacion-caso/hooks/useCaso';
import { CreateCasoBody } from '@/modules/informacion-caso/data/interfaces/caso.interface';
import { toast } from 'sonner';
import { getCookie } from 'cookies-next';
import { CookiesKeysEnum } from '@/utilities/enums';
import Link from 'next/link';

export function CreateCasoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const casoId = searchParams.get('id');
  
  const { 
    caso, 
    loading, 
    error, 
    createCaso,
    getCasoById 
  } = useCaso();

  const [formData, setFormData] = useState({
    internalCode: '',
    clientType: '',
    department: '',
  city: '',
  personType: '',
  documentType: '',
  documentName: '',
  numeroRadicado: '',
  country: 'COLOMBIA',
    jurisdiction: '',
    processType: '',
    office: '',
    location: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si estamos en modo edición, cargar el caso
  useEffect(() => {
    if (mode === 'edit' && casoId) {
      getCasoById(casoId);
    }
  }, [mode, casoId, getCasoById]);

  // Si el caso se carga, actualizar el formulario
  useEffect(() => {
    if (caso && mode === 'edit') {
      setFormData({
        internalCode: caso.internalCode || '',
        clientType: caso.clientType || '',
        department: caso.department || '',
  city: caso.city || '',
  personType: caso.personType || '',
  documentType: (caso.documents && caso.documents[0] && (caso.documents[0].category || caso.documents[0].documentType)) || '',
  documentName: (caso.documents && caso.documents[0] && (caso.documents[0].document || '')) || '',
  numeroRadicado: caso.numeroRadicado || caso.internalCode || '',
  country: caso.country || 'COLOMBIA',
        jurisdiction: caso.jurisdiction || '',
        processType: caso.processType || '',
        office: caso.office || '',
        location: caso.location || '',
      });
    }
  }, [caso, mode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [CREATE_CASO_FORM] Iniciando submit...');
    console.log('🚀 [CREATE_CASO_FORM] FormData:', formData);
    setIsSubmitting(true);

    try {
      // Validar campos obligatorios
    if (!formData.internalCode || !formData.clientType || !formData.department || !formData.city ||
      !formData.personType || !formData.documentType || !formData.documentName || !formData.numeroRadicado || !formData.country || !formData.jurisdiction || !formData.processType || !formData.office || !formData.location) {
        console.error('❌ [CREATE_CASO_FORM] Faltan campos obligatorios:', {
          internalCode: !!formData.internalCode,
          clientType: !!formData.clientType,
          department: !!formData.department,
        personType: !!formData.personType,
  documentType: !!formData.documentType,
  documentName: !!formData.documentName,
  numeroRadicado: !!formData.numeroRadicado,
        country: !!formData.country,
          jurisdiction: !!formData.jurisdiction,
          processType: !!formData.processType,
          office: !!formData.office,
          location: !!formData.location
        });
        toast.error('Por favor completa todos los campos obligatorios (*)');
        setIsSubmitting(false); // Resetear estado si hay validación fallida
        return;
      }

      // Obtener el usuario y token responsable
      let responsible = 'Sistema';
      let userToken = null;
      
      // Verificar token en cookies (usado por el HttpClient)
      const cookieToken = getCookie(CookiesKeysEnum.token);
      console.log('🍪 [CREATE_CASO_FORM] Token de cookie:', {
        hasToken: !!cookieToken,
        tokenPreview: cookieToken ? `${cookieToken.substring(0, 20)}...` : 'null'
      });
      
      if (!cookieToken) {
        console.error('❌ [CREATE_CASO_FORM] Token no encontrado en cookies');
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        setIsSubmitting(false);
        router.push('/login');
        return;
      }
      
      try {
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          responsible = userData?.name || userData?.email || 'Sistema';
          console.log('� [CREATE_CASO_FORM] Usuario autenticado:', {
            name: userData?.name,
            email: userData?.email,
            responsible
          });
        } else {
          console.warn('⚠️ [CREATE_CASO_FORM] No se encontró información de usuario en localStorage, usando datos por defecto');
        }
      } catch (err) {
        console.warn('⚠️ [CREATE_CASO_FORM] Error al obtener el usuario del localStorage:', err);
      }

  const casoData: CreateCasoBody = {
    clientType: formData.clientType,
    responsible: responsible, // Requerido por la interfaz
  department: formData.department,
  city: formData.city,
  numeroRadicado: formData.numeroRadicado || formData.internalCode || undefined,
    personType: formData.personType || 'NATURAL',
    jurisdiction: formData.jurisdiction,
    processType: formData.processType,
    office: formData.office,
    settled: formData.numeroRadicado || 'NO', // Usar número de radicado o 'NO' por defecto
    country: formData.country || 'COLOMBIA',
    location: formData.location,
        // estado: 'ACTIVO',
        // Agregar al menos un documento mínimo para evitar error del backend
        documents: [{
          category: formData.documentType || 'Documento',
          documentType: 'Escrito',
          document: formData.documentName || formData.documentType || 'Documento',
          subdocument: '',
          settledDate: new Date().toISOString(),
          consecutive: '',
          responsibleType: responsible,
          responsible: responsible,
          observations: 'Documento creado automáticamente'
        }],
        interveners: [],
        proceduralParts: [],
        payments: [{
          successBonus: false,
          bonusPercentage: 0,
          bonusPrice: 0,
          bonusCausationDate: '',
          bonusPaymentDate: '',
          notes: '',
          paymentValues: []
        }],
        files: [], // Asegurar que files existe
        filesMetadata: JSON.stringify({ 
          totalFiles: 0, 
          fileNames: [],
          createdAt: new Date().toISOString() 
        }),
      };

      console.log('🚀 [CREATE_CASO_FORM] Payload enviado:', casoData);
      // No pasar token personalizado, dejar que HttpClient use las cookies automáticamente
      const response = await createCaso(casoData);
      console.log('🚀 [CREATE_CASO_FORM] Respuesta recibida:', response);
      
      if ('record' in response) {
        toast.success('Caso creado exitosamente', { position: "top-right" });
        console.log('✅ [CREATE_CASO_FORM] Caso creado exitosamente, redirigiendo...');
        router.push(`/dashboard/informacion-caso?mode=view&id=${response.record._id}`);
      } else {
        const errorMsg = Array.isArray(response.message) ? response.message.join(", ") : response.message;
        console.error('❌ [CREATE_CASO_FORM] Error en respuesta:', errorMsg);
        toast.error(errorMsg, { position: "top-right" });
      }
    } catch (error) {
      console.error('❌ [CREATE_CASO_FORM] Error inesperado:', error);
      toast.error('Error inesperado al crear el caso', { position: "top-right" });
    } finally {
      console.log('🏁 [CREATE_CASO_FORM] Submit finalizado, reseteando estado...');
      setIsSubmitting(false);
    }
  };

  if (loading && mode === 'edit') {
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
              {mode === 'edit' ? 'Editar Caso' : 'Crear Nuevo Caso'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'edit' ? 'Modifica la información del caso' : 'Completa la información para crear un nuevo caso'}
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
                  value={formData.internalCode}
                  onChange={(e) => handleInputChange('internalCode', e.target.value)}
                  placeholder="Ej: EXP-2024-001"
                  required
                />
              </div>

              {/* Tipo de Cliente */}
              <div className="space-y-2">
                <Label htmlFor="clientType">Tipo de Cliente *</Label>
                <Select value={formData.clientType} onValueChange={(value) => handleInputChange('clientType', value)}>
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
                <Select value={formData.documentType} onValueChange={(value) => handleInputChange('documentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Demanda">Demanda</SelectItem>
                    <SelectItem value="Memorial">Memorial</SelectItem>
                    <SelectItem value="Concepto">Concepto</SelectItem>
                    <SelectItem value="Derecho de petición">Derecho de petición</SelectItem>
                    <SelectItem value="Notificación personal">Notificación personal</SelectItem>
                    <SelectItem value="Poder">Poder</SelectItem>
                    <SelectItem value="Tutela">Tutela</SelectItem>
                    <SelectItem value="Acta de Conciliación">Acta de Conciliación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nombre de documento */}
              <div className="space-y-2">
                <Label htmlFor="documentName">Nombre de documento *</Label>
                <Input
                  id="documentName"
                  value={formData.documentName}
                  onChange={(e) => handleInputChange('documentName', e.target.value)}
                  placeholder="Ej: Demanda inicial"
                  required
                />
              </div>
              {/* Tipo de Documento */}
              <div className="space-y-2">
                <Label htmlFor="documentType">Tipo de Documento *</Label>
                <Select value={formData.documentType} onValueChange={(value) => handleInputChange('documentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Escrito">Escrito</SelectItem>
                    <SelectItem value="Documento del proceso">Documento del proceso</SelectItem>
                    <SelectItem value="Documento contraparte">Documento contraparte</SelectItem>
                    <SelectItem value="Documento general">Documento general</SelectItem>
                    <SelectItem value="Documento juzgado">Documento juzgado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Departamento */}
              <div className="space-y-2">
                <Label htmlFor="department">Departamento *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
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
                  onChange={(e) => handleInputChange('city', e.target.value)}
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
                  onChange={(e) => handleInputChange('numeroRadicado', e.target.value)}
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
                <Select value={formData.jurisdiction} onValueChange={(value) => handleInputChange('jurisdiction', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la jurisdicción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIUGJ">SIUGJ</SelectItem>
                    <SelectItem value="BUSQUEDA DE CONSULTA NACIONAL">BUSQUEDA DE CONSULTA NACIONAL</SelectItem>
                    <SelectItem value="SAMAI">SAMAI</SelectItem>
                    <SelectItem value="SIC">SIC</SelectItem>                      
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
                <Label className='w-full' htmlFor="processType">Tipo de Proceso *</Label>
                <Select value={formData.processType} onValueChange={(value) => handleInputChange('processType', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona el tipo de proceso" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* ADMINISTRATIVO */}
                    <SelectItem value="Acción de nulidad y restablecimiento del derecho">Acción de nulidad y restablecimiento del derecho</SelectItem>
                    <SelectItem value="Acciones de cumplimiento">Acciones de cumplimiento</SelectItem>
                    <SelectItem value="Acciones de grupo">Acciones de grupo</SelectItem>
                    <SelectItem value="Acciones populares">Acciones populares</SelectItem>
                    <SelectItem value="Aprobación conciliaciones extrajudiciales">Aprobación conciliaciones extrajudiciales</SelectItem>
                    <SelectItem value="Comisiones (Despachos comisorios)">Comisiones (Despachos comisorios)</SelectItem>
                    <SelectItem value="Negación copias, consultas y certificaciones (artículos 21 y 24 de la Ley 57 de 1985)">Negación copias, consultas y certificaciones (artículos 21 y 24 de la Ley 57 de 1985)</SelectItem>
                    <SelectItem value="Residuales (diferentes a temas laborales, contractuales o tributarios)">Residuales (diferentes a temas laborales, contractuales o tributarios)</SelectItem>
                    <SelectItem value="Sección 1a electorales">Sección 1a electorales</SelectItem>
                    <SelectItem value="Sección 1a nulidad simple (otros asuntos)">Sección 1a nulidad simple (otros asuntos)</SelectItem>
                    <SelectItem value="Sección 1a nulidad y restablecimiento del derecho (otros asuntos)">Sección 1a nulidad y restablecimiento del derecho (otros asuntos)</SelectItem>
                    <SelectItem value="Sección 2a ejecutivos (laboral)">Sección 2a ejecutivos (laboral)</SelectItem>
                    <SelectItem value="Sección 2a lesividad">Sección 2a lesividad</SelectItem>
                    <SelectItem value="Sección 2a nulidad y restablecimiento del derecho (asuntos laborales)">Sección 2a nulidad y restablecimiento del derecho (asuntos laborales)</SelectItem>
                    <SelectItem value="Sección 3a acción de repetición">Sección 3a acción de repetición</SelectItem>
                    <SelectItem value="Sección 3a contractuales">Sección 3a contractuales</SelectItem>
                    <SelectItem value="Sección 3a ejecutivos (contractual)">Sección 3a ejecutivos (contractual)</SelectItem>
                    <SelectItem value="Sección 3a reparación directa">Sección 3a reparación directa</SelectItem>
                    <SelectItem value="Sección 3a restitución de inmueble">Sección 3a restitución de inmueble</SelectItem>
                    <SelectItem value="Sección 4a jurisdicción coactiva">Sección 4a jurisdicción coactiva</SelectItem>
                    <SelectItem value="Sección 4a nulidad simple (asuntos tributarios)">Sección 4a nulidad simple (asuntos tributarios)</SelectItem>
                    <SelectItem value="Sección 4a nulidad y restablecimiento del derecho (asuntos tributarios)">Sección 4a nulidad y restablecimiento del derecho (asuntos tributarios)</SelectItem>
                    
                    {/* CIVIL CIRCUITO - MAYOR CUANTÍA */}
                    <SelectItem value="Procesos verbales (mayor cuantía)">Procesos verbales (mayor cuantía)</SelectItem>
                    <SelectItem value="Proceso nulidad, disolución y liquidación sociedad civil y comercia">Proceso nulidad, disolución y liquidación sociedad civil y comercia</SelectItem>
                    <SelectItem value="Proceso pertenencia, divisorios, deslinde, amojonamiento">Proceso pertenencia, divisorios, deslinde, amojonamiento</SelectItem>
                    <SelectItem value="Procesos de insolvencia">Procesos de insolvencia</SelectItem>
                    <SelectItem value="Acciones populares y de grupo">Acciones populares y de grupo</SelectItem>
                    <SelectItem value="Procesos ejecutivos">Procesos ejecutivos</SelectItem>
                    <SelectItem value="Pruebas extraprocesales designación árbitros">Pruebas extraprocesales designación árbitros</SelectItem>
                    <SelectItem value="Otros procesos (exhortos, recusaciones, etc.)">Otros procesos (exhortos, recusaciones, etc.)</SelectItem>
                    
                    {/* CIVIL MUNICIPAL - MENOR CUANTÍA */}
                    <SelectItem value="Verbal de menor cuantía">Verbal de menor cuantía</SelectItem>
                    <SelectItem value="Verbal sumario menor cuantía">Verbal sumario</SelectItem>
                    <SelectItem value="Monitorio menor cuantía">Monitorio</SelectItem>
                    <SelectItem value="Pertenencia divisorios deslinde amojonamiento menor cuantía">Pertenencia – divisorios – deslinde y amojonamiento</SelectItem>
                    <SelectItem value="Ejecutivo de menor cuantía">Ejecutivo de menor cuantía</SelectItem>
                    <SelectItem value="Sucesión">Sucesión</SelectItem>
                    <SelectItem value="Pruebas extraprocesales menor cuantía">Pruebas extraprocesales – otros requerimientos – diligencias varias</SelectItem>
                    <SelectItem value="Matrimonio civil">Matrimonio civil</SelectItem>
                    <SelectItem value="Proceso de insolvencia menor cuantía">Proceso de insolvencia</SelectItem>
                    <SelectItem value="Medidas cautelares anticipadas menor cuantía">Medidas cautelares anticipadas</SelectItem>
                    <SelectItem value="Despacho comisorio menor cuantía">Despacho comisorio</SelectItem>
                    
                    {/* CIVIL MUNICIPAL DE PEQUEÑAS CAUSAS Y COMPETENCIA MÚLTIPLE - MÍNIM */}
                    <SelectItem value="Verbal de mínima cuantía">Verbal de mínima cuantía</SelectItem>
                    <SelectItem value="Monitorio mínima cuantía">Monitorio</SelectItem>
                    <SelectItem value="Sucesión de mínima cuantía">Sucesión de mínima cuantía</SelectItem>
                    <SelectItem value="Celebración matrimonio civil mínima cuantía">Celebración matrimonio civil – mínima cuantía</SelectItem>
                    <SelectItem value="Despacho comisorio mínima cuantía">Despacho comisorio</SelectItem>
                    <SelectItem value="Otros procesos de mínima cuantía">Otros procesos de mínima cuantía</SelectItem>
                    <SelectItem value="Ejecutivo de mínima cuantía">Ejecutivo de mínima cuantía</SelectItem>
                    <SelectItem value="Verbal sumario mínima cuantía">Verbal sumario</SelectItem>
                    <SelectItem value="Pertenencia divisorios deslinde amojonamiento mínima cuantía">Pertenencia – divisorios – deslinde y amojonamiento</SelectItem>
                    <SelectItem value="Pruebas extraprocesales mínima cuantía">Pruebas extraprocesales – otros requerimientos – diligencias varias</SelectItem>
                    <SelectItem value="Proceso de insolvencia mínima cuantía">Proceso de insolvencia</SelectItem>
                    <SelectItem value="Medidas cautelares anticipadas mínima cuantía">Medidas cautelares anticipadas</SelectItem>
                    
                    {/* CONSEJO DE ESTADO */}
                    <SelectItem value="Otros">Otros</SelectItem>
                    
                    {/* FAMILIA */}
                    <SelectItem value="Verbales familia">Verbales</SelectItem>
                    <SelectItem value="Verbales sumarios familia">Verbales sumarios</SelectItem>
                    <SelectItem value="Sucesión y cualquier otro de naturaleza liquidatoria">Sucesión y cualquier otro de naturaleza liquidatoria</SelectItem>
                    <SelectItem value="Jurisdicción voluntaria">Jurisdicción voluntaria</SelectItem>
                    <SelectItem value="Adopciones">Adopciones</SelectItem>
                    <SelectItem value="Derechos menores permisos especiales salidas del país">Derechos menores / permisos especiales salidas del país</SelectItem>
                    <SelectItem value="Ejecutivo de alimentos ejecutivo">Ejecutivo de alimentos – ejecutivo</SelectItem>
                    <SelectItem value="Homologaciones familia">Homologaciones</SelectItem>
                    <SelectItem value="Restablecimiento de derechos">Restablecimiento de derechos</SelectItem>
                    <SelectItem value="Otros procesos y actuaciones familia">Otros procesos y actuaciones (comisarías, ICBF, Cancillería, etc.)</SelectItem>
                    
                    {/* LABORAL CIRCUITO */}
                    <SelectItem value="Ordinario laboral">Ordinario</SelectItem>
                    <SelectItem value="Fuero sindical acción de reintegro">Fuero sindical – acción de reintegro</SelectItem>
                    <SelectItem value="Cancelación personería jurídica">Cancelación personería jurídica</SelectItem>
                    <SelectItem value="Ejecutivos laboral">Ejecutivos</SelectItem>
                    <SelectItem value="Pago por consignación">Pago por consignación</SelectItem>
                    <SelectItem value="Residual otros procesos laboral">Residual – otros procesos</SelectItem>
                    <SelectItem value="Homologaciones laboral">Homologaciones</SelectItem>
                    <SelectItem value="Despachos comisorios de laborales">Despachos comisorios de laborales</SelectItem>
                    
                    {/* PEQUEÑAS CAUSAS LABORALES */}
                    <SelectItem value="Ordinario de única instancia">Ordinario de única instancia</SelectItem>
                    <SelectItem value="Ejecutivos pequeñas causas">Ejecutivos</SelectItem>
                    <SelectItem value="Pago por consignación oficina de depósitos judiciales">Pago por consignación – oficina de depósitos judiciales</SelectItem>
                    <SelectItem value="Residual otros procesos pequeñas causas">Residual – otros procesos</SelectItem>
                    
                    {/* TRIBUNAL ADMINISTRATIVO - SECCIÓN PRIMERA */}
                    <SelectItem value="Electorales">Electorales</SelectItem>
                    <SelectItem value="Nulidad simple (otros asuntos)">Nulidad simple (otros asuntos)</SelectItem>
                    <SelectItem value="Nulidad y restablecimiento del derecho (otros asuntos)">Nulidad y restablecimiento del derecho (otros asuntos)</SelectItem>
                    
                    {/* TRIBUNAL ADMINISTRATIVO - SECCIÓN SEGUNDA */}
                    <SelectItem value="Ejecutivos (laboral)">Ejecutivos (laboral)</SelectItem>
                    <SelectItem value="Lesividad">Lesividad</SelectItem>
                    <SelectItem value="Nulidad y restablecimiento del derecho (asuntos laborales)">Nulidad y restablecimiento del derecho (asuntos laborales)</SelectItem>
                    
                    {/* TRIBUNAL ADMINISTRATIVO - SECCIÓN TERCERA */}
                    <SelectItem value="Acción de repetición">Acción de repetición</SelectItem>
                    <SelectItem value="Ejecutivos (contractual)">Ejecutivos (contractual)</SelectItem>
                    <SelectItem value="Reparación directa">Reparación directa</SelectItem>
                    <SelectItem value="Restitución de inmueble">Restitución de inmueble</SelectItem>
                    
                    {/* TRIBUNAL ADMINISTRATIVO - SECCIÓN CUARTA */}
                    <SelectItem value="Jurisdicción coactiva">Jurisdicción coactiva</SelectItem>
                    <SelectItem value="Nulidad simple (asuntos tributarios)">Nulidad simple (asuntos tributarios)</SelectItem>
                    <SelectItem value="Nulidad y restablecimiento del derecho (asuntos tributarios)">Nulidad y restablecimiento del derecho (asuntos tributarios)</SelectItem>
                  
                    {/* OTROS */}
                  </SelectContent>
                </Select>
              </div>

              {/* Oficina */}
              <div className="space-y-2">
                <Label htmlFor="office">Oficina *</Label>
                <Input
                  id="office"
                  value={formData.office}
                  onChange={(e) => handleInputChange('office', e.target.value)}
                  placeholder="Ej: Juzgado 1 Civil del Circuito de Bogotá"
                  required
                />
              </div>

              {/* Ubicación del Expediente */}
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación del Expediente *</Label>
                <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la ubicación del expediente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIUGJ">SIUGJ</SelectItem>
                    <SelectItem value="BUSQUEDA DE CONSULTA NACIONAL">BUSQUEDA DE CONSULTA NACIONAL</SelectItem>
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
                onClick={() => console.log('🔥 [CREATE_CASO_FORM] Botón submit clickeado!')}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'edit' ? 'Actualizar Caso' : 'Crear Caso'}
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