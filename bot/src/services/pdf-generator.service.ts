import puppeteer, { Browser } from "puppeteer-core";
import Handlebars from "handlebars";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
  readdirSync,
  statSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "../config/env.js";
import {
  ProcessDetails,
  PdfTemplateData,
  ProcessData,
} from "../interfaces/index.js";
import "../utils/template-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Configuración de Puppeteer optimizada para Docker
 * Basada en la configuración probada que ya funciona
 */
function getBrowserConfig() {
  const isDocker = process.env.DOCKER === "true";
  const isLocal = config.nodeEnv === "development";

  const baseArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
  ];

  // Determinar la ruta del ejecutable
  let executablePath: string;
  if (isDocker) {
    // Configuración para Docker
    executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser";
  } else {
    // Configuración original para desarrollo local
    executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || findChrome();
  }

  return {
    args: baseArgs,
    executablePath,
    headless: true,
    timeout: 60000,
    protocolTimeout: 60000,
    ignoreHTTPSErrors: true,
  };
}

/**
 * Busca Chrome en el sistema local
 */
function findChrome(): string {
  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  throw new Error(
    "Chrome no encontrado. Instala Google Chrome o configura PUPPETEER_EXECUTABLE_PATH"
  );
}

/**
 * Opciones por defecto para la generación de PDF
 */
const defaultPdfOptions = {
  format: "A4" as const,
  margin: {
    top: "20mm",
    right: "20mm",
    bottom: "20mm",
    left: "20mm",
  },
  printBackground: true,
  displayHeaderFooter: false,
  preferCSSPageSize: true,
  landscape: false,
};

/**
 * Servicio para generar PDFs de procesos legales
 */
export class PdfGeneratorService {
  private browser: Browser | null = null;

  /**
   * Inicializa el navegador Puppeteer
   */
  private async initBrowser(): Promise<void> {
    if (this.browser) return;

    try {
      const browserConfig = getBrowserConfig();
      this.browser = await puppeteer.launch(browserConfig);
    } catch (error) {
      console.error("❌ [PDF_GENERATOR] Error inicializando navegador:", error);
      throw new Error(`Error inicializando navegador: ${error}`);
    }
  }

  /**
   * Cierra el navegador
   */
  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;      
    }
  }

  /**
   * Valida los datos del template
   */
  private validateTemplateData(data: PdfTemplateData): void {
    if (!data.internalCode) {
      throw new Error("internalCode es requerido");
    }
    if (!data.clientName) {
      throw new Error("clientName es requerido");
    }
    if (!data.processes || data.processes.length === 0) {
      throw new Error("processes array es requerido y no puede estar vacío");
    }

    // Validar cada proceso
    data.processes.forEach((process, index) => {
      if (!process.etiqueta) {
        throw new Error(`Process ${index}: internalCode es requerido`);
      }

      if (!process.despachoJudicial) {
        throw new Error(`Process ${index}: jurisdiction es requerido`);
      }
    });
  }

  /**
   * Construye los datos del template para múltiples procesos
   */
  private buildTemplateData(
    processesData: ProcessDetails[],
    clientName: string
  ): PdfTemplateData {
    // Convertir array de ProcessDetails a ProcessData
    const processes: ProcessData[] = processesData.map((data) => ({
      etiqueta: (data as any).etiqueta || "",
      radicado: (data as any).radicado || "N/A",
      despachoJudicial: (data as any).despachoJudicial || "No especificado",
      city: (data as any).city || "No especificada",
      ultimaActuacion: (data as any).ultimaActuacion || "Sin información",
      fechaUltimaActuacion: (data as any).fechaUltimaActuacion || "N/A",
      processType: data.processType,
      jurisdiction: data.jurisdiction,
      plaintiffs: data.plaintiffs.map((name) => ({ name, document: "N/A" })),
      defendants: data.defendants.map((name) => ({ name })),
      performances: data.performances.map((perf) => ({
        performanceType: perf.type,
        responsible: perf.responsible,
        observation: perf.observation,
        updatedAt: perf.updatedAt,
      })),
    }));

    // Para compatibilidad, usar el primer proceso
    const firstProcess = processesData[0];

    return {
      internalCode: firstProcess.etiqueta,
      clientName,
      radicado: firstProcess.radicado,
      processes, // Array de procesos para el template
      currentDate: new Date().toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      date: new Date()
        .toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, " de "),
    };
  }

  /**
   * Compila un template Handlebars para múltiples procesos
   */
  private compileTemplate(
    templatePath: string,
    processesData: ProcessDetails[],
    clientName: string
  ): string {
    try {
      if (!existsSync(templatePath)) {
        throw new Error(`Template no encontrado: ${templatePath}`);
      }

      const templateSource = readFileSync(templatePath, "utf-8");
      const template = Handlebars.compile(templateSource);

      // Construir datos del template usando la función helper
      const templateData = this.buildTemplateData(processesData, clientName);

      // Validar datos del template
      this.validateTemplateData(templateData);

      const html = template(templateData);

      return html;
    } catch (error) {
      console.error("❌ [PDF_GENERATOR] Error compilando template:", error);
      throw new Error(`Error compilando template: ${error}`);
    }
  }

  /**
   * Genera un PDF desde HTML
   */
  private async generatePdfFromHtml(
    html: string,
    options = defaultPdfOptions
  ): Promise<Uint8Array> {
    try {
      await this.initBrowser();

      if (!this.browser) {
        throw new Error("Navegador no inicializado");
      }

      const page = await this.browser.newPage();

      // Configurar viewport
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });

      // Cargar HTML
      await page.setContent(html, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Generar PDF con mejor calidad
      const pdfBuffer = await page.pdf({
        ...options,
        timeout: 30000,
        preferCSSPageSize: true,
        printBackground: true,
      });

      await page.close();

      return pdfBuffer;
    } catch (error) {
      console.error("❌ [PDF_GENERATOR] Error generando PDF:", error);
      throw new Error(`Error generando PDF: ${error}`);
    }
  }

  /**
   * Guarda el PDF en el sistema de archivos
   */
  private savePdf(pdfBuffer: Uint8Array, filename: string): string {
    try {
      // Crear directorio si no existe
      const reportsDir = join(process.cwd(), "dist", "public", "reports");
      if (!existsSync(reportsDir)) {
        mkdirSync(reportsDir, { recursive: true });
      }

      const filePath = join(reportsDir, filename);
      writeFileSync(filePath, new Uint8Array(pdfBuffer));

      return filePath;
    } catch (error) {
      console.error("❌ [PDF_GENERATOR] Error guardando PDF:", error);
      throw new Error(`Error guardando PDF: ${error}`);
    }
  }

  /**
   * Elimina un archivo PDF del servidor
   */
  deletePdf(filename: string): boolean {
    try {
      const reportsDir = join(__dirname, "..", "public", "reports");
      const filePath = join(reportsDir, filename);

      if (existsSync(filePath)) {
        unlinkSync(filePath);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("❌ [PDF_GENERATOR] Error eliminando PDF:", error);
      return false;
    }
  }

  /**
   * Limpia PDFs antiguos del servidor (más de 1 hora)
   */
  cleanupOldPdfs(): void {
    try {
      const reportsDir = join(__dirname, "..", "public", "reports");

      if (!existsSync(reportsDir)) {
        return;
      }

      const files = readdirSync(reportsDir);
      const oneHourAgo = Date.now() - 60 * 60 * 1000; // 1 hora en ms

      files.forEach((file) => {
        if (file.endsWith(".pdf")) {
          const filePath = join(reportsDir, file);
          const stats = statSync(filePath);
          const fileTime = stats.mtime.getTime();

          if (fileTime < oneHourAgo) {
            unlinkSync(filePath);
          }
        }
      });
    } catch (error) {
      console.error("❌ [PDF_GENERATOR] Error limpiando PDFs antiguos:", error);
    }
  }

  /**
   * Genera un PDF de proceso legal (soporta múltiples procesos)
   */
  async generateProcessReport(
    processesData: ProcessDetails | ProcessDetails[],
    clientName: string
  ): Promise<{ url: string; filename: string }> {
    try {
      // Limpiar PDFs antiguos al inicio      
      this.cleanupOldPdfs();

      // Normalizar a array
      const processesArray = Array.isArray(processesData)
        ? processesData
        : [processesData];      

      // Compilar template - usar ruta absoluta que sabemos que funciona
      const templatePath = join(
        process.cwd(),
        "dist",
        "templates",
        "process-report.hbs"
      );
      const html = this.compileTemplate(
        templatePath,
        processesArray,
        clientName
      );

      // Generar PDF
      const pdfBuffer = await this.generatePdfFromHtml(html);

      // Generar nombre de archivo con fecha
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const filename = `proceso-${processesArray[0].etiqueta}-${timestamp}.pdf`;

      // Guardar PDF
      const filePath = this.savePdf(pdfBuffer, filename);

      // Generar URL pública
      const publicUrl = `${config.baseUrl}/public/reports/${filename}`;

      return { url: publicUrl, filename };
    } catch (error) {
      console.error("❌ [PDF_GENERATOR] Error generando reporte:", error);
      throw error;
    } finally {
      // Cerrar navegador después de un delay para evitar cierres frecuentes
      setTimeout(() => {
        this.closeBrowser();
      }, 5000);
    }
  }

  /**
   * Limpia recursos
   */
  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
}

// Instancia singleton
export const pdfGeneratorService = new PdfGeneratorService();
