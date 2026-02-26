import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { IQuoteTotals } from '../types/quote.types';

// ── IVA fijo del 19% ─────────────────────────────────────────────────────────
const IVA_RATE = 0.19;

// ── Labels ────────────────────────────────────────────────────────────────────

const TECH_LABELS: Record<string, string> = {
  excel: 'Excel',
  software: 'Software',
  erp_mrp: 'ERP / MRP',
  none: 'Ninguna',
  other: 'Otra',
};

const MODULE_LABELS: Record<string, string> = {
  production: 'Producción',
  inventory: 'Inventarios y Stock',
  purchasing: 'Compras',
  commercial: 'Gestión Comercial',
  hr: 'Talento Humano',
  analytics: 'Tableros y Analítica',
};

const BILLING_LABELS: Record<string, string> = {
  monthly: 'Mensual',
  annual: 'Anual',
};

@Injectable()
export class QuotePdfService {
  // ── Helpers ─────────────────────────────────────────────────────────────────

  private fmt(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  private fmtDate(dateStr: string | Date): string {
    if (!dateStr) return '—';
    const date = new Date(
      String(dateStr).replace('T00:00:00.000Z', 'T12:00:00'),
    );
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  private fmtNit(nit: number): string {
    const str = nit.toString();
    if (str.length <= 1) return str;
    const body = str.slice(0, -1);
    const dv = str.slice(-1);
    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
  }

  /** Fecha de vencimiento: override o createdAt + 30 días */
  private getExpirationDate(quote: any): string {
    if (quote.expirationDateOverride) {
      return this.fmtDate(quote.expirationDateOverride);
    }
    const created = new Date(quote.createdAt);
    created.setDate(created.getDate() + 30);
    return this.fmtDate(created);
  }

  /** Datos del asesor: override > User (createdByUser) */
  private getAdvisor(quote: any): {
    name: string;
    position: string;
    email: string;
  } {
    const override = quote.advisorOverride || {};
    const user = quote.createdByUser || {}; // populado en el service
    return {
      name: override.name || user.fullName || user.name || '—',
      position: override.position || user.position || user.role || '—',
      email: override.email || user.email || '—',
    };
  }

  // ── Cálculos derivados ──────────────────────────────────────────────────────

  private computeExtendedTotals(quote: any, totals: IQuoteTotals) {
    const implPrice = totals.implementationPriceUSD || 0;
    const implTax = implPrice * IVA_RATE;
    const implTotal = implPrice + implTax;

    const licensesSubtotal =
      (totals.standardSubtotalUSD || 0) + (totals.premiumSubtotalUSD || 0);

    const billingPeriod = quote.licenseBillingPeriod || 'monthly';
    const licensesMonthly =
      billingPeriod === 'annual' ? licensesSubtotal / 12 : licensesSubtotal;
    const licensesAnnual =
      billingPeriod === 'annual' ? licensesSubtotal : licensesSubtotal * 12;

    const subtotalAll = implPrice + licensesSubtotal;
    const ivaAll = subtotalAll * IVA_RATE;
    const grandTotal = subtotalAll + ivaAll;

    return {
      implPrice,
      implTax,
      implTotal,
      licensesSubtotal,
      licensesMonthly,
      licensesAnnual,
      subtotalAll,
      ivaAll,
      grandTotal,
      billingLabel: BILLING_LABELS[billingPeriod] || 'Mensual',
    };
  }

  // ── Build HTML ──────────────────────────────────────────────────────────────

  private buildHtml(quote: any, totals: IQuoteTotals): string {
    const ext = this.computeExtendedTotals(quote, totals);
    const advisor = this.getAdvisor(quote);

    // Tecnología
    const techList = (quote.currentTechnology || [])
      .map((t: string) => TECH_LABELS[t] ?? t)
      .join(', ');
    const techDisplay =
      techList +
      (quote.otherTechnologyDetail ? ` (${quote.otherTechnologyDetail})` : '');

    // Módulos
    const modulesList = (quote.includedModules || [])
      .map((m: string) => MODULE_LABELS[m] ?? m);
    const modulesDisplay =
      modulesList.join(', ') +
      (quote.additionalModulesDetail
        ? `. ${quote.additionalModulesDetail}`
        : '');

    // Emails de notificación
    const notifEmails =
      (quote.notificationEmails || []).length > 0
        ? quote.notificationEmails.join('; ')
        : quote.email;

    // ── Items table rows ──────────────────────────────────────────────────
    let itemsRows = '';

    // Implementación
    itemsRows += `
      <tr>
        <td>
          <div class="item-name">Implementación</div>
          <div class="item-desc">${quote.implementationDescription || 'Servicio de implementación del ecosistema Quanta según alcance definido.'}</div>
        </td>
        <td class="price">${this.fmt(ext.implPrice)}</td>
        <td class="qty">1</td>
        <td class="total-cell">${this.fmt(ext.implPrice)}</td>
      </tr>`;

    // Licencias
    if (quote.includeLicenses) {
      if (quote.standardLicenses?.quantity) {
        const sl = quote.standardLicenses;
        itemsRows += `
          <tr>
            <td>
              <div class="item-name">Licencia Estándar</div>
              <div class="item-desc">Licencia estándar Quanta — facturación ${ext.billingLabel.toLowerCase()}.</div>
            </td>
            <td class="price">${this.fmt(sl.unitPrice)}</td>
            <td class="qty">${sl.quantity}</td>
            <td class="total-cell">${this.fmt(sl.totalLicensesPrice ?? 0)}</td>
          </tr>`;
      }
      if (quote.premiumLicenses?.quantity) {
        const pl = quote.premiumLicenses;
        itemsRows += `
          <tr>
            <td>
              <div class="item-name">Licencia Premium</div>
              <div class="item-desc">Licencia premium Quanta — facturación ${ext.billingLabel.toLowerCase()}.</div>
            </td>
            <td class="price">${this.fmt(pl.unitPrice)}</td>
            <td class="qty">${pl.quantity}</td>
            <td class="total-cell">${this.fmt(pl.totalLicensesPrice ?? 0)}</td>
          </tr>`;
      }
    }

    return /* html */ `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    :root {
      --pink: #e91e8c;
      --pink-light: #fce4f3;
      --dark: #111111;
      --gray: #555;
      --light: #f8f8f8;
      --white: #ffffff;
      --border: #e5e5e5;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: var(--dark);
      line-height: 1.6;
      font-size: 13px;
    }

    .page { max-width: 860px; margin: 0 auto; background: white; }

    /* ─── HEADER ─── */
    .header { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 3px solid var(--pink); }
    .header-left { padding: 36px 36px 24px; border-right: 1px solid var(--border); }
    .header-right { padding: 36px 36px 24px; }

    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
    .logo-icon { width: 42px; height: 42px; background: var(--pink); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .logo-icon svg { width: 26px; height: 26px; fill: white; }
    .logo-text .brand { font-size: 22px; font-weight: 700; color: var(--dark); letter-spacing: -0.5px; }
    .logo-text .sub { font-size: 10px; color: var(--gray); letter-spacing: 0.5px; }

    .date-group { display: flex; gap: 32px; }
    .date-item label { font-size: 10px; font-weight: 600; color: var(--pink); text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 2px; }
    .date-item span { font-size: 13px; color: var(--dark); font-weight: 500; }

    .quote-number { background: var(--light); border-left: 4px solid var(--pink); padding: 12px 16px; margin-top: 20px; }
    .quote-number .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--gray); }
    .quote-number .value { font-size: 22px; font-weight: 700; color: var(--pink); letter-spacing: 1px; }

    .quote-title { font-size: 28px; font-weight: 700; color: var(--dark); text-align: right; margin-bottom: 16px; }
    .client-name { font-size: 18px; font-weight: 700; text-align: right; }
    .client-contact-name { font-size: 15px; font-weight: 700; text-align: right; }
    .client-role { font-size: 13px; color: var(--gray); text-align: right; margin-bottom: 16px; }
    .client-details { text-align: right; }
    .client-details .detail-row { font-size: 12px; margin-bottom: 4px; }
    .client-details .detail-row strong { color: var(--pink); font-weight: 600; }

    /* ─── INTRO ─── */
    .intro-message { padding: 32px 36px; background: linear-gradient(135deg, #fff5fb 0%, #fff 100%); border-bottom: 1px solid var(--border); }
    .intro-message h3 { color: var(--pink); font-size: 16px; font-weight: 700; margin-bottom: 12px; }
    .intro-message p { font-size: 13.5px; color: var(--gray); line-height: 1.7; }
    .intro-message p + p { margin-top: 10px; }

    /* ─── TABLE ─── */
    .table-section { padding: 0 36px 32px; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 28px; }
    .items-table thead th { background: var(--dark); color: white; padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
    .items-table thead th:first-child { text-align: left; }
    .items-table thead th:not(:first-child) { text-align: right; }
    .items-table tbody tr { border-bottom: 1px solid var(--border); }
    .items-table td { padding: 16px; vertical-align: top; }
    .items-table td:not(:first-child) { text-align: right; }
    .item-name { font-weight: 700; font-size: 14px; color: var(--dark); margin-bottom: 4px; }
    .item-desc { font-size: 12px; color: var(--gray); line-height: 1.5; }
    .price { font-weight: 600; font-size: 14px; }
    .qty { font-weight: 500; }
    .total-cell { font-weight: 700; font-size: 14px; color: var(--pink); }

    .totals { border-top: 2px solid var(--dark); }
    .totals-row { display: flex; justify-content: flex-end; padding: 8px 16px; font-size: 13px; border-bottom: 1px solid var(--border); }
    .totals-row .label { color: var(--gray); margin-right: 60px; font-weight: 500; }
    .totals-row .amount { font-weight: 600; min-width: 120px; text-align: right; }
    .totals-row.grand-total { background: var(--dark); padding: 14px 16px; }
    .totals-row.grand-total .label { color: white; font-weight: 700; font-size: 15px; }
    .totals-row.grand-total .amount { color: var(--pink); font-size: 22px; font-weight: 700; }

    /* ─── SECTIONS ─── */
    .section { padding: 36px; border-top: 1px solid var(--border); }
    .section-header { display: inline-flex; background: var(--pink); color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 8px 18px; margin-bottom: 24px; clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%); padding-right: 28px; }
    .section h3 { font-size: 15px; font-weight: 700; color: var(--dark); margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid var(--pink-light); }
    .section p { font-size: 13.5px; color: var(--gray); line-height: 1.7; margin-bottom: 12px; }

    .highlight-box { background: linear-gradient(135deg, #fff0f8, #fff5fb); border-left: 4px solid var(--pink); padding: 16px 20px; margin: 16px 0; font-size: 13.5px; color: var(--dark); font-style: italic; line-height: 1.7; }

    .modules-list { list-style: none; }
    .modules-list li { padding: 10px 0 10px 20px; border-bottom: 1px solid var(--border); font-size: 13.5px; color: var(--gray); position: relative; line-height: 1.6; }
    .modules-list li::before { content: ''; position: absolute; left: 0; top: 18px; width: 8px; height: 8px; background: var(--pink); border-radius: 50%; }
    .modules-list li strong { color: var(--dark); font-weight: 600; }

    .before-after { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .ba-card { border-radius: 4px; overflow: hidden; }
    .ba-card .ba-header { padding: 12px 16px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; text-align: center; }
    .ba-card.before .ba-header { background: #f0f0f0; color: var(--gray); }
    .ba-card.after .ba-header { background: var(--pink); color: white; }
    .ba-card .ba-body { padding: 16px; background: var(--light); }
    .ba-card.after .ba-body { background: #fff5fb; }
    .ba-card .ba-item { font-size: 12.5px; color: var(--gray); padding: 6px 0 6px 18px; border-bottom: 1px solid var(--border); position: relative; line-height: 1.5; }
    .ba-card.after .ba-item { color: var(--dark); }
    .ba-card .ba-item::before { content: '•'; position: absolute; left: 4px; color: var(--gray); }
    .ba-card.after .ba-item::before { color: var(--pink); }
    .ba-card .ba-item:last-child { border-bottom: none; }

    .context-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .context-table tr:nth-child(even) { background: var(--light); }
    .context-table td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid var(--border); }
    .context-table td:first-child { font-weight: 600; color: white; background: var(--pink); width: 45%; }
    .context-table td:last-child { color: var(--gray); font-style: italic; }

    .deliverables-list { list-style: none; counter-reset: step; }
    .deliverables-list li { counter-increment: step; padding: 10px 10px 10px 52px; position: relative; font-size: 13.5px; color: var(--gray); border-bottom: 1px solid var(--border); }
    .deliverables-list li::before { content: counter(step); position: absolute; left: 10px; top: 10px; width: 26px; height: 26px; background: var(--pink); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }

    .inv-block { background: var(--light); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 20px; }
    .inv-block .inv-title { background: var(--dark); color: white; padding: 10px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .inv-row { display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--border); font-size: 13px; }
    .inv-row .inv-label { color: var(--gray); }
    .inv-row .inv-value { font-weight: 600; color: var(--dark); }

    .inv-summary { background: var(--dark); color: white; padding: 20px 16px; display: flex; justify-content: space-around; margin-top: 20px; border-radius: 4px; }
    .inv-summary-item { text-align: center; }
    .inv-summary-item .s-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #aaa; margin-bottom: 4px; }
    .inv-summary-item .s-value { font-size: 20px; font-weight: 700; color: var(--pink); }

    .steps-list { list-style: none; counter-reset: step2; }
    .steps-list li { counter-increment: step2; padding: 14px 14px 14px 56px; position: relative; font-size: 13.5px; color: var(--gray); border-bottom: 1px solid var(--border); line-height: 1.6; }
    .steps-list li::before { content: counter(step2); position: absolute; left: 10px; top: 14px; width: 30px; height: 30px; background: var(--pink); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; }

    .contract-section h4 { font-size: 14px; font-weight: 700; color: var(--dark); margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 1px solid var(--pink-light); }
    .contract-section h4:first-child { margin-top: 0; }

    .acceptance-box { background: var(--dark); color: white; padding: 24px; margin-top: 20px; border-left: 4px solid var(--pink); font-size: 13.5px; line-height: 1.7; }
    .acceptance-box strong { color: var(--pink); }

    .footer { background: var(--dark); color: white; display: grid; grid-template-columns: 1fr 1fr 1fr; }
    .footer-col { padding: 24px; border-right: 1px solid #333; text-align: center; }
    .footer-col:last-child { border-right: none; }
    .footer-col .f-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--pink); margin-bottom: 8px; }
    .footer-col .f-value { font-size: 12.5px; color: #ccc; line-height: 1.6; }

    @media print { body { background: white; } .page { box-shadow: none; margin: 0; } }
  </style>
</head>
<body>
<div class="page">

  <!-- ═══════════ HEADER ═══════════ -->
  <div class="header">
    <div class="header-left">
      <div class="logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div class="logo-text">
          <div class="brand">Quanta</div>
          <div class="sub">Empowered by qpalliance</div>
        </div>
      </div>
      <div class="date-group">
        <div class="date-item">
          <label>Fecha de Emisión</label>
          <span>${this.fmtDate(quote.createdAt)}</span>
        </div>
        <div class="date-item">
          <label>Fecha de Vencimiento</label>
          <span>${this.getExpirationDate(quote)}</span>
        </div>
      </div>
      <div class="quote-number">
        <div class="label">Número de Cotización</div>
        <div class="value">${quote.quoteId}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="quote-title">Cotización Proforma</div>
      <div class="client-name">${quote.companyName.toUpperCase()}</div>
      <br>
      <div class="client-contact-name">${quote.contactName}</div>
      <div class="client-role">${quote.contactPosition}</div>
      <div class="client-details">
        ${quote.companyAddress ? `<div class="detail-row"><strong>Dirección:</strong> ${quote.companyAddress}</div>` : ''}
        <div class="detail-row"><strong>NIT:</strong> ${this.fmtNit(quote.nit)}</div>
        <div class="detail-row"><strong>Email:</strong> ${quote.email}</div>
        <div class="detail-row"><strong>Teléfono:</strong> ${(quote.phones || []).join(' · ')}</div>
      </div>
    </div>
  </div>

  <!-- ═══════════ INTRO ═══════════ -->
  <div class="intro-message">
    <h3>Estimado(a) ${quote.contactName},</h3>
    <p>Gracias por su interés en conocer nuestras soluciones. Nos complace invitarlo a descubrir una propuesta única e innovadora. Quanta es un software inteligente diseñado para acompañar a las empresas manufactureras en su transición hacia la Industria 4.0.</p>
    <p>Esta propuesta explica cómo implementaremos Quanta en <strong>${quote.companyName}</strong> para ayudarte a organizar mejor la operación diaria. El objetivo es que tu equipo tenga control real de lo que está pasando en producción, inventarios, compras y ventas, y pueda tomar decisiones rápidas con información confiable desde el primer día de uso.</p>
  </div>

  <!-- ═══════════ ITEMS TABLE ═══════════ -->
  <div class="table-section">
    <table class="items-table">
      <thead>
        <tr>
          <th>Producto / Descripción</th>
          <th>Precio Unitario</th>
          <th>Cantidad</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="totals">
      <div class="totals-row">
        <span class="label">Subtotal</span>
        <span class="amount">${this.fmt(ext.subtotalAll)}</span>
      </div>
      <div class="totals-row">
        <span class="label">IVA del 19%</span>
        <span class="amount">${this.fmt(ext.ivaAll)}</span>
      </div>
      <div class="totals-row grand-total">
        <span class="label">Total</span>
        <span class="amount">${this.fmt(ext.grandTotal)}</span>
      </div>
    </div>
  </div>

  <!-- ═══════════ ASESOR QUANTA ═══════════ -->
  <div class="section" style="background:#f9f9f9; border-top:3px solid var(--pink);">
    <div class="section-header">Asesor Quanta</div>
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px;">
      <div>
        <div style="font-size:10px; color:var(--pink); font-weight:700; text-transform:uppercase; letter-spacing:.8px; margin-bottom:4px;">Nombre</div>
        <div style="font-size:13px; color:var(--gray);">${advisor.name}</div>
      </div>
      <div>
        <div style="font-size:10px; color:var(--pink); font-weight:700; text-transform:uppercase; letter-spacing:.8px; margin-bottom:4px;">Cargo</div>
        <div style="font-size:13px; color:var(--gray);">${advisor.position}</div>
      </div>
      <div>
        <div style="font-size:10px; color:var(--pink); font-weight:700; text-transform:uppercase; letter-spacing:.8px; margin-bottom:4px;">Email</div>
        <div style="font-size:13px; color:var(--gray);">${advisor.email}</div>
      </div>
    </div>
  </div>

  <!-- ═══════════ QUÉ ES QUANTA ═══════════ -->
  <div class="section">
    <div class="section-header">Quanta: Módulos y Enfoque de Valor</div>

    <h3>¿Qué es Quanta?</h3>
    <p>Quanta es una plataforma modular en la nube para operación industrial y manufactura. Integra ejecución operativa, control productivo y analítica para que la información de la planta y del negocio esté alineada con lo que se decide y lo que se ejecuta.</p>

    <h3>Módulos y Capacidades</h3>
    <p>Según el alcance contratado en esta propuesta, Quanta puede habilitar módulos y capacidades como:</p>
    <ul class="modules-list">
      <li><strong>Producción:</strong> creación, seguimiento y control de órdenes, registros de producción y trazabilidad operativa.</li>
      <li><strong>Inventarios y stock:</strong> movimientos, consulta de existencias y control por ubicaciones.</li>
      <li><strong>Compras:</strong> planeación y ejecución del ciclo de compras, según parámetros definidos.</li>
      <li><strong>Gestión comercial:</strong> seguimiento de clientes y actividades relacionadas con pedidos/cotizaciones, según configuración.</li>
      <li><strong>Talento Humano:</strong> gestiona de manera fácil y sencilla todo lo que sucede con tu capital humano, desde nómina, eficiencia productiva, hasta procesos disciplinarios.</li>
      <li><strong>Tableros y analítica:</strong> indicadores, reportes consolidados y análisis para control y toma de decisiones, según licenciamiento y módulos contratados.</li>
    </ul>
    <p style="margin-top:12px; font-size:12px; color:#999;">Los módulos exactos incluidos en esta propuesta se detallan en el apartado "Módulos incluidos".</p>

    <h3 style="margin-top:24px;">¿Cómo Quanta generará valor para <span style="color:var(--pink)">${quote.companyName}</span>?</h3>
    <p>En operaciones industriales como la tuya, el retorno se captura en disciplina operativa, trazabilidad y control. El cambio típico se observa así:</p>

    <div class="before-after">
      <div class="ba-card before">
        <div class="ba-header">Antes</div>
        <div class="ba-body">
          <div class="ba-item">Información dispersa y múltiples versiones de la verdad.</div>
          <div class="ba-item">Reprocesos entre ventas, producción e inventarios.</div>
          <div class="ba-item">Compras urgentes por falta de visibilidad de existencias y consumos.</div>
          <div class="ba-item">Seguimiento productivo reactivo y reportes tardíos.</div>
          <div class="ba-item">Indicadores manuales, difíciles de sostener y comparar.</div>
          <div class="ba-item">Incumplimiento de planes de producción.</div>
        </div>
      </div>
      <div class="ba-card after">
        <div class="ba-header">Después con Quanta</div>
        <div class="ba-body">
          <div class="ba-item">Una fuente confiable de ejecución y control.</div>
          <div class="ba-item">Trazabilidad de órdenes, consumos y movimientos.</div>
          <div class="ba-item">Inventarios con lectura operable para planear y priorizar.</div>
          <div class="ba-item">Producción con seguimiento y control oportunos.</div>
          <div class="ba-item">Reportes y tableros que facilitan priorización y decisiones con información consistente.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════ RETORNO ═══════════ -->
  <div class="section">
    <div class="section-header">Cómo se Mide el Retorno</div>
    <p>Estos son indicadores que suelen medirse desde el Go-Live y que normalmente se reflejan en ahorros de tiempo, reducción de costos operativos y mayor capacidad de respuesta:</p>
    <ul class="modules-list">
      <li>Ahorro de horas hombre por menos reprocesos, doble digitación y conciliaciones manuales.</li>
      <li>Menos compras urgentes y sobrecostos por imprevistos, gracias a mayor visibilidad de consumos, existencias y necesidades.</li>
      <li>Reducción de desperdicios y pérdidas por errores de registro, desorden en inventarios o falta de trazabilidad.</li>
      <li>Mejor cumplimiento de fechas y priorización de la producción, con impacto directo en servicio al cliente y confiabilidad operativa.</li>
      <li>Mayor capacidad para atender pedidos que antes se rechazaban por falta de información, control o planeación.</li>
    </ul>
    <div class="highlight-box">
      En la práctica, Quanta no solo organiza la operación: libera tiempo del equipo, reduce costos por urgencias y habilita crecimiento con control, porque permite decir "sí" con información y capacidad real de cumplir.
    </div>
  </div>

  <!-- ═══════════ ALCANCE PROPUESTO ═══════════ -->
  <div class="section">
    <div class="section-header">Alcance Propuesto</div>

    <h3>Contexto Operativo</h3>
    <table class="context-table">
      <tr><td>Tecnología actual</td><td>${techDisplay || '—'}</td></tr>
      <tr><td>Número de trabajadores</td><td>${quote.totalWorkers?.toLocaleString() ?? '—'}</td></tr>
      <tr><td>Trabajadores en producción</td><td>${quote.productionWorkers?.toLocaleString() ?? '—'}</td></tr>
      <tr><td>Sedes o plantas</td><td>${quote.numberOfLocations ?? '—'}</td></tr>
      <tr><td>Observaciones operativas</td><td>${quote.operationalNotes || '—'}</td></tr>
    </table>

    <h3 style="margin-top:24px;">Módulos Incluidos</h3>
    <div style="background:var(--light); border:1px dashed var(--pink); padding:16px; margin-top:8px; font-size:13px; color:var(--gray);">
      ${modulesDisplay || 'A definir durante la implementación.'}
    </div>
  </div>

  <!-- ═══════════ ENTREGABLES ═══════════ -->
  <div class="section">
    <div class="section-header">Entregables e Hitos de Implementación</div>
    <ol class="deliverables-list">
      <li>Kickoff y levantamiento de información</li>
      <li>Parametrización y configuración según alcance</li>
      <li>Carga inicial y validaciones, cuando aplique</li>
      <li>Pruebas operativas y ajustes</li>
      <li>Capacitación a usuarios clave</li>
      <li>Go-Live y acompañamiento inicial</li>
    </ol>

    <h3 style="margin-top:24px;">Supuestos y Responsabilidades del Cliente</h3>
    <p>Para cumplir el cronograma y lograr una implementación exitosa, el cliente se compromete a:</p>
    <ul class="modules-list">
      <li>Designar responsables internos y asegurar disponibilidad para sesiones de trabajo.</li>
      <li>Entregar información veraz, completa y oportuna.</li>
      <li>Validar decisiones, catálogos y parámetros en tiempos acordados.</li>
      <li>Facilitar accesos y soportes necesarios para configuración y pruebas.</li>
    </ul>

    <h3 style="margin-top:24px;">Exclusiones</h3>
    <p>Salvo que se coticen expresamente, quedan por fuera:</p>
    <ul class="modules-list">
      <li>Desarrollos a la medida o personalizaciones de código.</li>
      <li>Integraciones no incluidas en esta propuesta.</li>
      <li>Migraciones masivas o depuración avanzada de históricos.</li>
      <li>Consultoría especializada no prevista.</li>
      <li>Administración de infraestructura, redes o herramientas internas del cliente.</li>
    </ul>
  </div>

  <!-- ═══════════ CRONOGRAMA ═══════════ -->
  <div class="section">
    <div class="section-header">Cronograma Estimado</div>
    <table class="context-table">
      <tr><td>Duración estimada de implementación</td><td>${quote.implementationDurationWeeks ? `${quote.implementationDurationWeeks} semanas` : '—'}</td></tr>
      <tr><td>Fecha estimada de inicio</td><td>${this.fmtDate(quote.estimatedStartDate)}</td></tr>
      <tr><td>Fecha estimada de Go-Live</td><td>${this.fmtDate(quote.estimatedGoLiveDate)}</td></tr>
    </table>
    <p style="margin-top:14px; font-size:12.5px;">Las fechas estimadas podrán ajustarse si la aceptación ocurre después de la fecha proyectada o si el cliente no cumple oportunamente obligaciones previas necesarias para avanzar.</p>
  </div>

  <!-- ═══════════ INVERSIÓN ═══════════ -->
  <div class="section">
    <div class="section-header">Inversión</div>

    <div class="inv-block">
      <div class="inv-title">Implementación</div>
      <div class="inv-row"><span class="inv-label">Valor</span><span class="inv-value">${this.fmt(ext.implPrice)}</span></div>
      <div class="inv-row"><span class="inv-label">IVA (19%)</span><span class="inv-value">${this.fmt(ext.implTax)}</span></div>
      <div class="inv-row"><span class="inv-label">Total implementación</span><span class="inv-value">${this.fmt(ext.implTotal)}</span></div>
      <div class="inv-row"><span class="inv-label">Forma de pago</span><span class="inv-value">${quote.paymentTerms || 'A convenir'}</span></div>
    </div>

    ${quote.includeLicenses ? `
    <div class="inv-block">
      <div class="inv-title">Licenciamiento</div>
      <div class="inv-row"><span class="inv-label">Tipo de licencia</span><span class="inv-value">${[quote.standardLicenses?.quantity ? 'Estándar' : '', quote.premiumLicenses?.quantity ? 'Premium' : ''].filter(Boolean).join(' + ')}</span></div>
      <div class="inv-row"><span class="inv-label">Número de licencias</span><span class="inv-value">${(quote.standardLicenses?.quantity || 0) + (quote.premiumLicenses?.quantity || 0)}</span></div>
      <div class="inv-row"><span class="inv-label">Valor periódico (${ext.billingLabel.toLowerCase()})</span><span class="inv-value">${this.fmt(ext.licensesSubtotal)} USD</span></div>
      <div class="inv-row"><span class="inv-label">Inicio de cobro</span><span class="inv-value">Desde Go-Live · ${this.fmtDate(quote.estimatedGoLiveDate)}</span></div>
    </div>
    <p style="font-size:12.5px; color:var(--gray); margin-bottom:16px;">El licenciamiento se factura conforme a la estructura comercial definida para el servicio.</p>
    ` : ''}

    <div class="inv-summary">
      <div class="inv-summary-item">
        <div class="s-label">Total inversión inicial</div>
        <div class="s-value">${this.fmt(ext.implTotal)}</div>
      </div>
      ${quote.includeLicenses ? `
      <div class="inv-summary-item">
        <div class="s-label">Total recurrente (${ext.billingLabel.toLowerCase()})</div>
        <div class="s-value">${this.fmt(ext.licensesSubtotal)}</div>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- ═══════════ PRÓXIMOS PASOS ═══════════ -->
  <div class="section">
    <div class="section-header">Próximos Pasos</div>
    <ol class="steps-list">
      <li>Revisar la propuesta en la página web y seleccionar <strong>"Aceptar propuesta"</strong>.</li>
      <li>Cargar documentos obligatorios para aprobar: <strong>RUT</strong>, Cámara de Comercio, Certificación bancaria.</li>
      <li>Coordinación de kickoff y alistamiento para iniciar implementación según cronograma.</li>
    </ol>
  </div>

  <!-- ═══════════ INFORMACIÓN CONTRACTUAL ═══════════ -->
  <div class="section">
    <div class="section-header">Información Contractual Clave y Aceptación</div>

    <div class="contract-section">
      <h4>A. Aceptación y perfeccionamiento del acuerdo</h4>
      <p>Al hacer clic en "Aceptar propuesta", el cliente acepta esta cotización y se perfecciona el acuerdo con QUANTA de manera electrónica, dejando evidencia de aceptación y trazabilidad.</p>

      <h4>B. Términos y Condiciones incorporados por referencia</h4>
      <p>La aceptación de esta cotización implica la aceptación íntegra de los Términos y Condiciones del Ecosistema QUANTA, incorporados por referencia como parte integral del acuerdo.</p>

      <h4>C. Prelación documental</h4>
      <p>Esta cotización prevalece respecto de alcance y valores específicos. Para lo demás, rigen los Términos y Condiciones.</p>

      <h4>D. Inicio del licenciamiento</h4>
      <p>El licenciamiento inicia desde Go-Live, entendido como la finalización de la implementación y la habilitación para uso productivo${quote.estimatedGoLiveDate ? `, en la fecha <strong>${this.fmtDate(quote.estimatedGoLiveDate)}</strong>` : ''}.</p>

      <h4>E. Resumen de temas clave</h4>
      <p>Renovación, permanencia mínima, terminación anticipada, mora, suspensión del servicio, reajustes, cláusula compromisoria, limitación de responsabilidad e indemnidad se rigen por los Términos y Condiciones.</p>

      <h4>F. Notificaciones</h4>
      <p>Correos válidos del cliente: <strong>${notifEmails}</strong> &nbsp;|&nbsp; Correos válidos de QUANTA: <strong>legal@quanta.com</strong>; <strong>soporte@quanta.com</strong></p>

      <h4>G. Texto final de aceptación</h4>
      <div class="acceptance-box">
        Al seleccionar <strong>"Aceptar propuesta"</strong>, declaro que tengo capacidad para obligar a <strong>${quote.companyName}</strong> y acepto de forma expresa esta cotización y los Términos y Condiciones del Ecosistema QUANTA, incorporados por referencia y vinculantes desde este momento.
      </div>
    </div>
  </div>

  <!-- ═══════════ FOOTER ═══════════ -->
  <div class="footer">
    <div class="footer-col">
      <div class="f-label">Oficina</div>
      <div class="f-value">Av. El Dorado # 68c - 61<br>Oficinas 909 y 910</div>
    </div>
    <div class="footer-col">
      <div class="f-label">Contacto</div>
      <div class="f-value">info@quanta.com<br>+57 601 XXX XXXX</div>
    </div>
    <div class="footer-col">
      <div class="f-label">Web</div>
      <div class="f-value">www.quanta.com</div>
    </div>
  </div>

</div>
</body>
</html>`;
  }

  // ── Generate PDF ────────────────────────────────────────────────────────────

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
      margin: { top: '10px', right: '0', bottom: '10px', left: '0' },
    });

    await browser.close();

    return Buffer.from(pdf);
  }
}