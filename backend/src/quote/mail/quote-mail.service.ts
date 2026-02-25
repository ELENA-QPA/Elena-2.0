import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface SendQuoteEmailParams {
  to: string;
  quoteId: string;
  companyName: string;
  contactName: string;
  pdfBuffer: Buffer;
  totalQuoteUSD: number;
  includeLicenses: boolean;
  implementationPriceUSD: number;
  estimatedStartDate?: string | Date;
  advisor: {
    name: string;
    email: string;
    phone?: string;
    position?: string;
  };
}

@Injectable()
export class QuoteMailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  private formatDate(dateStr: string | Date | undefined): string {
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

  async sendQuoteEmail(params: SendQuoteEmailParams): Promise<void> {
    const {
      to,
      quoteId,
      companyName,
      contactName,
      pdfBuffer,
      totalQuoteUSD,
      includeLicenses,
      implementationPriceUSD,
      estimatedStartDate,
      advisor,
    } = params;

    const serviceType = includeLicenses
      ? 'Implementación + Licenciamiento'
      : 'Implementación';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #e91e7a 0%, #c2185b 100%); padding: 32px 40px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 26px; margin: 0; letter-spacing: 1px;">QUANTA</h1>
                  <p style="color: rgba(255,255,255,0.85); font-size: 12px; margin: 6px 0 0; letter-spacing: 0.5px;">Plataforma de Gestión Comercial</p>
                </td>
              </tr>

              <!-- Saludo -->
              <tr>
                <td style="padding: 36px 40px 0;">
                  <p style="font-size: 15px; color: #333; margin: 0;">Hola <strong>${contactName}</strong>,</p>
                </td>
              </tr>

              <!-- Mensaje principal -->
              <tr>
                <td style="padding: 16px 40px 0;">
                  <p style="font-size: 14px; color: #555; line-height: 1.7; margin: 0 0 12px;">
                    Hemos preparado una propuesta de inversión para <strong style="color: #333;">${companyName}</strong>. 
                    A continuación encontrará un resumen de los aspectos clave de la cotización 
                    <strong style="color: #e91e7a;">${quoteId}</strong>.
                  </p>
                  <p style="font-size: 14px; color: #555; line-height: 1.7; margin: 0;">
                    El documento completo se encuentra adjunto a este correo en formato PDF.
                  </p>
                </td>
              </tr>

              <!-- Resumen -->
              <tr>
                <td style="padding: 24px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf2f8; border-radius: 10px; border: 1px solid #fce7f3;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="font-size: 11px; color: #e91e7a; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 14px;">
                          Resumen de la propuesta
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 6px 0; font-size: 13px; color: #666;">Inversión total</td>
                            <td style="padding: 6px 0; font-size: 16px; color: #e91e7a; font-weight: 700; text-align: right;">${this.formatCurrency(
                              totalQuoteUSD,
                            )}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; font-size: 13px; color: #666; border-top: 1px solid #fce7f3;">Tipo de servicio</td>
                            <td style="padding: 6px 0; font-size: 13px; color: #333; font-weight: 500; text-align: right; border-top: 1px solid #fce7f3;">${serviceType}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; font-size: 13px; color: #666; border-top: 1px solid #fce7f3;">Fecha estimada de inicio</td>
                            <td style="padding: 6px 0; font-size: 13px; color: #333; font-weight: 500; text-align: right; border-top: 1px solid #fce7f3;">${this.formatDate(
                              estimatedStartDate,
                            )}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 40px 8px; text-align: center;">
                  <p style="font-size: 13px; color: #888; margin: 0 0 12px;">
                    El PDF de la cotización completa se encuentra adjunto a este correo.
                  </p>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 8px 40px;">
                  <hr style="border: none; border-top: 1px solid #eee; margin: 0;">
                </td>
              </tr>

              <!-- Asesor comercial -->
              <tr>
                <td style="padding: 20px 40px;">
                  <p style="font-size: 11px; color: #e91e7a; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 10px;">
                    Su asesor comercial
                  </p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right: 16px; vertical-align: top;">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #e91e7a, #c2185b); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                          <span style="color: white; font-size: 18px; font-weight: 600; line-height: 48px; text-align: center; display: block; width: 48px;">${advisor.name
                            .charAt(0)
                            .toUpperCase()}</span>
                        </div>
                      </td>
                      <td style="vertical-align: top;">
                        <p style="font-size: 14px; font-weight: 600; color: #333; margin: 0;">${
                          advisor.name
                        }</p>
                        ${
                          advisor.position
                            ? `<p style="font-size: 12px; color: #888; margin: 2px 0 0;">${advisor.position}</p>`
                            : ''
                        }
                        <p style="font-size: 12px; color: #888; margin: 2px 0 0;">${
                          advisor.email
                        }</p>
                        ${
                          advisor.phone
                            ? `<p style="font-size: 12px; color: #888; margin: 2px 0 0;">Tel: ${advisor.phone}</p>`
                            : ''
                        }
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Confidencialidad -->
              <tr>
                <td style="padding: 16px 40px; background-color: #fafafa; border-top: 1px solid #eee;">
                  <p style="font-size: 11px; color: #999; line-height: 1.6; margin: 0;">
                    🔒 Este correo contiene información confidencial dirigida exclusivamente a 
                    <strong>${contactName}</strong> de <strong>${companyName}</strong>. 
                    No comparta este contenido sin autorización. La cotización adjunta tiene una 
                    vigencia de 30 días calendario a partir de la fecha de envío.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px 28px; background-color: #1a1a1a; text-align: center;">
                  <p style="font-size: 13px; font-weight: 600; color: #ffffff; margin: 0;">QP Alliance</p>
                  <p style="font-size: 11px; color: rgba(255,255,255,0.5); margin: 6px 0 0;">
                    Plataforma Quanta · Gestión Comercial Inteligente
                  </p>
                  <p style="font-size: 10px; color: rgba(255,255,255,0.35); margin: 12px 0 0; line-height: 1.5;">
                    Este es un correo automático generado por la plataforma Quanta.<br>
                    Por favor no responda directamente a este mensaje.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: `Propuesta de inversión Quanta – ${companyName}`,
      html,
      attachments: [
        {
          filename: `cotizacion-${quoteId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }
}