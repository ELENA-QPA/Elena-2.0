import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Compilar solo los archivos necesarios
console.log('🔧 [TEST] Compilando archivos necesarios...');

try {
  // Crear directorio dist/services si no existe
  const servicesDir = join(process.cwd(), 'dist', 'services');
  if (!existsSync(servicesDir)) {
    mkdirSync(servicesDir, { recursive: true });
  }

  // Compilar con tsc usando la configuración del proyecto
  execSync('npx tsc src/services/pdf-generator.service.ts src/utils/template-helpers.ts --outDir dist --target es2020 --module esnext --moduleResolution node --allowSyntheticDefaultImports --esModuleInterop', { stdio: 'inherit' });
  
  console.log('✅ [TEST] Archivos compilados correctamente');
} catch (error) {
  console.error('❌ [TEST] Error compilando archivos:', error);
  process.exit(1);
}

// Verificar que los archivos se compilaron
const pdfServicePath = join(process.cwd(), 'dist', 'services', 'pdf-generator.service.js');
const templateHelpersPath = join(process.cwd(), 'dist', 'utils', 'template-helpers.js');

if (!existsSync(pdfServicePath) || !existsSync(templateHelpersPath)) {
  console.error('❌ [TEST] Archivos compilados no encontrados');
  process.exit(1);
}

console.log('✅ [TEST] Archivos compilados encontrados');

// Siempre copiar assets y templates para asegurar que estén actualizados
console.log('🔧 [TEST] Copiando assets y templates...');
execSync('node copyAssets.js', { stdio: 'inherit' });

// Ahora ejecutar la prueba
console.log('🧪 [TEST] Ejecutando prueba de generación de PDF...');

try {
  // Importar el servicio
  const { pdfGeneratorService } = await import('./dist/services/pdf-generator.service.js');
  
  // Simular datos como los devolvería toProcessDetails - Array de múltiples procesos
  const processesDetails = [
    {
      id: '68b6862ec9ca124d3f7c13cd',
      internalCode: 'R200',
      clientName: 'Juan Pérez',
      processType: 'Proceso Ejecutivo',
      jurisdiction: 'PENAL CIRCUITO',
      settled: '567',
      status: 'SENTENCIA',
      responsible: 'Juez Penal del Circuito',
      nextMilestone: 'Se profiere sentencia condenatoria por el monto de $567.000.000',
      plaintiffs: ['Juan Pérez'],
      defendants: ['Empresa S.A.'],
      performances: [
        {
          type: 'RADICADO',
          responsible: 'Juan Pérez',
          observation: 'Radicación de demanda ejecutiva',
          updatedAt: '2024-06-06T14:48:08.689Z'
        },
        {
          type: 'AUTO QUE FIJA FECHA',
          responsible: 'Juez Penal del Circuito',
          observation: 'Se fija como fecha de audiencia el día 20 de Agosto del 2024 a las 2:00pm de manera virtual.',
          updatedAt: '2024-08-15T13:22:06.227Z'
        }
      ]
    },
    {
      id: '68b6862ec9ca124d3f7c13ce',
      internalCode: 'R201',
      clientName: 'Juan Pérez',
      processType: 'Ordinario Laboral',
      jurisdiction: 'LABORAL CIRCUITO',
      settled: '1200',
      status: 'EN_CURSO',
      responsible: 'Juez Laboral del Circuito',
      nextMilestone: 'Audiencia de conciliación programada',
      plaintiffs: ['Juan Pérez'],
      defendants: ['Corporación XYZ'],
      performances: [
        {
          type: 'RADICADO',
          responsible: 'Juan Pérez',
          observation: 'Radicación de demanda laboral por despido injustificado',
          updatedAt: '2024-07-10T10:30:15.456Z'
        },
        {
          type: 'CITACIÓN A AUDIENCIA',
          responsible: 'Juez Laboral del Circuito',
          observation: 'Se cita a las partes para audiencia de conciliación el 15 de septiembre de 2024',
          updatedAt: '2024-08-05T16:45:22.789Z'
        },
        {
          type: 'RECEPCIÓN DE MEMORIAL',
          responsible: 'Secretaría',
          observation: 'Contestación de demanda laboral - Corporación XYZ',
          updatedAt: '2024-08-25T11:20:45.321Z'
        }
      ]
    },
    {
      id: '68b6862ec9ca124d3f7c13cf',
      internalCode: 'R202',
      clientName: 'Juan Pérez',
      processType: 'Proceso Verbal',
      jurisdiction: 'CIVIL MUNICIPAL',
      settled: '89',
      status: 'FINALIZADO',
      responsible: 'Juez Civil Municipal',
      nextMilestone: 'Proceso finalizado - Sentencia favorable',
      plaintiffs: ['Juan Pérez'],
      defendants: ['María González'],
      performances: [
        {
          type: 'RADICADO',
          responsible: 'Juan Pérez',
          observation: 'Radicación de demanda verbal por incumplimiento de contrato',
          updatedAt: '2024-05-15T08:15:30.123Z'
        },
        {
          type: 'AUDIENCIA INICIAL',
          responsible: 'Juez Civil Municipal',
          observation: 'Se realiza audiencia inicial, se declara procedente la demanda',
          updatedAt: '2024-06-20T14:30:45.789Z'
        },
        {
          type: 'SENTENCIA',
          responsible: 'Juez Civil Municipal',
          observation: 'Se profiere sentencia favorable al demandante por $89.000.000',
          updatedAt: '2024-07-25T16:45:12.456Z'
        }
      ]
    }
  ];
  
  const clientName = 'Juan Pérez';

  console.log('📊 [TEST] Datos de prueba - Múltiples procesos:', {
    processesCount: processesDetails.length,
    clientName: clientName,
    processes: processesDetails.map(p => ({
      internalCode: p.internalCode,
      processType: p.processType,
      performancesCount: p.performances.length
    })),
    totalPerformances: processesDetails.reduce((total, p) => total + p.performances.length, 0)
  });

  const pdfResult = await pdfGeneratorService.generateProcessReport(processesDetails, clientName);
  
  console.log('✅ [TEST] PDF con múltiples procesos generado exitosamente!');
  console.log('🔗 [TEST] URL del PDF:', pdfResult.url);
  console.log('📁 [TEST] Nombre del archivo:', pdfResult.filename);
  console.log('📁 [TEST] El archivo se guardó en: dist/public/reports/');
  console.log('📄 [TEST] El PDF contiene 3 procesos en páginas separadas:');
  console.log('  - Proceso R200: Proceso Ejecutivo (PENAL CIRCUITO)');
  console.log('  - Proceso R201: Ordinario Laboral (LABORAL CIRCUITO)');
  console.log('  - Proceso R202: Proceso Verbal (CIVIL MUNICIPAL)');
  console.log('💡 [TEST] Para ver el PDF, abre la URL en tu navegador');
  
} catch (error) {
  console.error('❌ [TEST] Error generando PDF:', error);
  console.error('Stack trace:', error.stack);
} finally {
  // Limpiar recursos
  try {
    const { pdfGeneratorService } = await import('./dist/services/pdf-generator.service.js');
    await pdfGeneratorService.cleanup();
    console.log('🧹 [TEST] Recursos limpiados');
  } catch (cleanupError) {
    console.log('⚠️ [TEST] Error limpiando recursos:', cleanupError.message);
  }
}
