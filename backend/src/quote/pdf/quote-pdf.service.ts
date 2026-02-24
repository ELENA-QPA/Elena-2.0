import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { IQuoteTotals } from '../types/quote.types';

@Injectable()
export class QuotePdfService {
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  private formatDate(dateStr: string | Date): string {
    if (!dateStr) return '—';
    const date = new Date(String(dateStr).replace('T00:00:00.000Z', 'T12:00:00'));
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  private formatNit(nit: number): string {
    const str = nit.toString();
    if (str.length <= 1) return str;
    const body = str.slice(0, -1);
    const dv = str.slice(-1);
    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
  }

  private buildHtml(quote: any, totals: IQuoteTotals): string {
    const techLabels: Record<string, string> = {
      excel: 'Excel',
      software: 'Software',
      erp_mrp: 'ERP / MRP',
      none: 'Ninguna',
      other: 'Otra',
    };

    const operationLabels: Record<string, string> = {
      make_to_order: 'Make to Order',
      make_to_stock: 'Make to Stock',
      hybrid: 'Híbrido',
    };

    const techTags = (quote.currentTechnology || [])
      .map((t: string) => `<span class="tag">${techLabels[t] ?? t}</span>`)
      .join(' ');

    const otherTech = quote.otherTechnologyDetail
      ? `<span class="tag tag-other">${quote.otherTechnologyDetail}</span>`
      : '';

    let licensesSection = '';
    if (quote.includeLicenses) {
      let rows = '';
      if (quote.standardLicenses?.quantity) {
        rows += `
          <tr>
            <td>Licencia Estándar</td>
            <td class="center">${quote.standardLicenses.quantity}</td>
            <td class="right">${this.formatCurrency(quote.standardLicenses.unitPrice)}</td>
            <td class="right bold">${this.formatCurrency(quote.standardLicenses.totalLicensesPrice ?? 0)}</td>
          </tr>`;
      }
      if (quote.premiumLicenses?.quantity) {
        rows += `
          <tr>
            <td>Licencia Premium</td>
            <td class="center">${quote.premiumLicenses.quantity}</td>
            <td class="right">${this.formatCurrency(quote.premiumLicenses.unitPrice)}</td>
            <td class="right bold">${this.formatCurrency(quote.premiumLicenses.totalLicensesPrice ?? 0)}</td>
          </tr>`;
      }

      licensesSection = `
        <div class="section">
          <h2>LICENCIAMIENTO</h2>
          <table class="licenses-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th class="center">Cantidad</th>
                <th class="right">Precio unitario</th>
                <th class="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="right">Subtotal licencias:</td>
                <td class="right bold">${this.formatCurrency(totals.standardSubtotalUSD + totals.premiumSubtotalUSD)}</td>
              </tr>
            </tfoot>
          </table>
        </div>`;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 40px; font-size: 13px; line-height: 1.5; }

        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e91e7a; padding-bottom: 20px; margin-bottom: 30px; }
        .logo h1 { font-size: 22px; color: #e91e7a; margin: 0; }
        .logo p { font-size: 11px; color: #888; }
        .quote-info { text-align: right; }
        .quote-info .label { font-size: 12px; font-weight: 600; color: #333; }
        .quote-info .id { font-size: 18px; font-weight: 700; color: #e91e7a; font-family: monospace; }
        .quote-info .date { font-size: 11px; color: #888; margin-top: 4px; }

        .section { margin-bottom: 24px; }
        .section h2 { font-size: 11px; font-weight: 600; color: #e91e7a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }

        .info-grid { background: #f8f8f8; border-radius: 8px; padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
        .info-grid .field span { font-size: 10px; color: #888; display: block; }
        .info-grid .field p { font-size: 13px; font-weight: 500; margin: 2px 0 0; }
        .info-grid .field.full { grid-column: 1 / -1; }

        .tag { display: inline-block; padding: 2px 10px; border-radius: 4px; border: 1px solid #ddd; background: #fff; font-size: 11px; font-weight: 500; margin-right: 4px; margin-top: 4px; }
        .tag-other { font-style: italic; color: #666; }

        .licenses-table { width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
        .licenses-table th { background: #f3f3f3; padding: 8px 12px; font-size: 12px; font-weight: 500; color: #555; text-align: left; }
        .licenses-table td { padding: 10px 12px; border-top: 1px solid #eee; }
        .licenses-table tfoot td { background: #f8f8f8; font-size: 12px; }

        .summary { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
        .summary-row { display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 13px; }
        .summary-row:last-child { border-bottom: none; }
        .summary-row.total { background: #fdf2f8; }
        .summary-row.total span { color: #e91e7a; font-weight: 700; }
        .summary-row.total .amount { font-size: 18px; }

        .terms { border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; }
        .terms h2 { font-size: 11px; font-weight: 600; color: #e91e7a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .terms p { font-size: 11px; color: #888; margin-bottom: 4px; }

        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">
          <h1>QUANTA COTIZACIONES</h1>
          <p>Plataforma de Gestión Comercial</p>
        </div>
        <div class="quote-info">
          <div class="label">COTIZACIÓN</div>
          <div class="id">${quote.quoteId}</div>
          <div class="date">Fecha: ${this.formatDate(quote.createdAt)}</div>
        </div>
      </div>

      <div class="section">
        <h2>Información del Cliente</h2>
        <div class="info-grid">
          <div class="field"><span>Empresa</span><p>${quote.companyName}</p></div>
          <div class="field"><span>NIT</span><p>${this.formatNit(quote.nit)}</p></div>
          <div class="field"><span>Industria</span><p>${quote.industry || '—'}</p></div>
          <div class="field"><span>Tipo de operación</span><p>${operationLabels[quote.operationType] ?? '—'}</p></div>
        </div>
      </div>

      <div class="section">
        <h2>Datos de Contacto</h2>
        <div class="info-grid">
          <div class="field"><span>Nombre completo</span><p>${quote.contactName}</p></div>
          <div class="field"><span>Cargo</span><p>${quote.contactPosition}</p></div>
          <div class="field"><span>Correo electrónico</span><p>${quote.email}</p></div>
          <div class="field"><span>Teléfonos</span><p>${(quote.phones || []).join(' · ')}</p></div>
        </div>
      </div>

      <div class="section">
        <h2>Contexto Operativo</h2>
        <div class="info-grid">
          <div class="field"><span>Total trabajadores</span><p>${quote.totalWorkers?.toLocaleString() ?? '—'}</p></div>
          <div class="field"><span>Trabajadores en producción</span><p>${quote.productionWorkers?.toLocaleString() ?? '—'}</p></div>
          <div class="field full"><span>Tecnología actual</span><div style="margin-top:4px">${techTags} ${otherTech}</div></div>
        </div>
      </div>

      ${licensesSection}

      <div class="section">
        <h2>Resumen Económico</h2>
        <div class="summary">
          ${quote.includeLicenses ? `<div class="summary-row"><span>Subtotal licencias</span><span>${this.formatCurrency(totals.standardSubtotalUSD + totals.premiumSubtotalUSD)}</span></div>` : ''}
          <div class="summary-row"><span>Implementación</span><span>${this.formatCurrency(totals.implementationPriceUSD)}</span></div>
          <div class="summary-row total"><span>Total cotización (USD)</span><span class="amount">${this.formatCurrency(totals.totalQuoteUSD)}</span></div>
        </div>
      </div>

      <div class="section">
        <h2>Fechas</h2>
        <div class="info-grid">
          <div class="field"><span>Fecha estimada de inicio</span><p>${this.formatDate(quote.estimatedStartDate)}</p></div>
          <div class="field"><span>Fecha de creación</span><p>${this.formatDate(quote.createdAt)}</p></div>
        </div>
      </div>

      <div class="terms">
        <h2>Condiciones Comerciales</h2>
        <p>• Los precios están expresados en dólares americanos (USD).</p>
        <p>• Esta cotización tiene una validez de 30 días calendario.</p>
        <p>• Los precios no incluyen impuestos aplicables según la legislación vigente.</p>
        <p>• La fecha de inicio está sujeta a la aceptación formal de la cotización.</p>
      </div>
    </body>
    </html>`;
  }

  async generatePdf(quote: any, totals: IQuoteTotals): Promise<Buffer> {
    const html = this.buildHtml(quote, totals);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    await browser.close();

    return Buffer.from(pdf);
  }
}