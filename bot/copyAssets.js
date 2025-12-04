/**
 * Script para copiar archivos estáticos a la carpeta de distribución
 * Se ejecuta después del build para preparar los archivos para producción
 */

import { mkdirSync, copyFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const sourcePath = join(__dirname, 'assets', 'Reporte.pdf');
const destDir = join(__dirname, 'dist', 'public');
const destPath = join(destDir, 'Reporte.pdf');

// Template paths
const templateSourcePath = join(__dirname, 'src', 'templates', 'process-report.hbs');
const templateDestDir = join(__dirname, 'dist', 'templates');
const templateDestPath = join(templateDestDir, 'process-report.hbs');

try {
  console.log('🔧 [COPY_ASSETS] Iniciando copia de archivos estáticos...');
  console.log('🔧 [COPY_ASSETS] Directorio actual:', __dirname);
  console.log('🔧 [COPY_ASSETS] Ruta fuente:', sourcePath);
  console.log('🔧 [COPY_ASSETS] Directorio destino:', destDir);
  console.log('🔧 [COPY_ASSETS] Ruta destino:', destPath);

  // Verificar que el archivo fuente existe
  if (!existsSync(sourcePath)) {
    console.error('❌ [COPY_ASSETS] Archivo fuente no encontrado:', sourcePath);
    console.error('❌ [COPY_ASSETS] Asegúrate de que el archivo Reporte.pdf esté en la carpeta assets/');
    
    // Listar archivos en assets para debugging
    const assetsDir = join(__dirname, 'assets');
    if (existsSync(assetsDir)) {
      const files = readdirSync(assetsDir);
      console.log('📁 [COPY_ASSETS] Archivos en assets/:', files);
    } else {
      console.log('📁 [COPY_ASSETS] La carpeta assets/ no existe');
    }
    
    process.exit(1);
  }

  // Crear la carpeta dist/public si no existe
  if (!existsSync(destDir)) {
    console.log('🔧 [COPY_ASSETS] Creando directorio:', destDir);
    mkdirSync(destDir, { recursive: true });
  }

  // Copiar el archivo
  console.log('🔧 [COPY_ASSETS] Copiando archivo...');
  copyFileSync(sourcePath, destPath);
  
  // Verificar que se copió correctamente
  if (existsSync(destPath)) {
    console.log('✅ [COPY_ASSETS] Archivo Reporte.pdf copiado exitosamente a dist/public.');
    console.log('📁 [COPY_ASSETS] Archivo fuente:', sourcePath);
    console.log('📁 [COPY_ASSETS] Archivo destino:', destPath);
  } else {
    console.error('❌ [COPY_ASSETS] Error: El archivo no se copió correctamente');
    process.exit(1);
  }

  // Copiar template Handlebars
  console.log('🔧 [COPY_ASSETS] Copiando template Handlebars...');
  console.log('🔧 [COPY_ASSETS] Template fuente:', templateSourcePath);
  console.log('🔧 [COPY_ASSETS] Template destino:', templateDestPath);

  // Verificar que el template fuente existe
  if (!existsSync(templateSourcePath)) {
    console.error('❌ [COPY_ASSETS] Template fuente no encontrado:', templateSourcePath);
    console.error('❌ [COPY_ASSETS] Asegúrate de que el archivo process-report.hbs esté en src/templates/');
    process.exit(1);
  }

  // Crear la carpeta dist/templates si no existe
  if (!existsSync(templateDestDir)) {
    console.log('🔧 [COPY_ASSETS] Creando directorio de templates:', templateDestDir);
    mkdirSync(templateDestDir, { recursive: true });
  }

  // Copiar el template
  copyFileSync(templateSourcePath, templateDestPath);
  
  // Verificar que se copió correctamente
  if (existsSync(templateDestPath)) {
    console.log('✅ [COPY_ASSETS] Template process-report.hbs copiado exitosamente a dist/templates.');
    console.log('📁 [COPY_ASSETS] Template fuente:', templateSourcePath);
    console.log('📁 [COPY_ASSETS] Template destino:', templateDestPath);
  } else {
    console.error('❌ [COPY_ASSETS] Error: El template no se copió correctamente');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ [COPY_ASSETS] Error copiando archivos estáticos:', error);
  process.exit(1);
}
