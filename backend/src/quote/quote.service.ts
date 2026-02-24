import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateQuoteDto } from './dto/create-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { Quote, QuoteDocument } from './entities/quote.entity';
import { IQuote, IQuoteTotals, QUOTE_STATUS } from './types/quote.types';
import { User } from 'src/auth/entities/user.entity';
import { QuotePdfService } from './pdf/quote-pdf.service';

@Injectable()
export class QuoteService {
  constructor(
    @InjectModel(Quote.name) private readonly quoteModel: Model<QuoteDocument>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly pdfService: QuotePdfService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Calcula los totales de la cotización
   */
  calculateTotals(quote: Partial<Quote>): IQuoteTotals {
    const standardSubtotalUSD = quote.standardLicenses?.totalLicensesPrice ?? 0;
    const premiumSubtotalUSD = quote.premiumLicenses?.totalLicensesPrice ?? 0;
    const implementationPriceUSD = quote.implementationPriceUSD ?? 0;

    return {
      standardSubtotalUSD,
      premiumSubtotalUSD,
      implementationPriceUSD,
      totalQuoteUSD:
        standardSubtotalUSD + premiumSubtotalUSD + implementationPriceUSD,
    };
  }

  private async resolveActorName(userId: string): Promise<string> {
    try {
      const user = await this.userModel
        .findById(userId)
        .select('name lastname')
        .lean();
      return user ? `${user.name} ${user.lastname}`.trim() : userId;
    } catch {
      return userId;
    }
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: CreateQuoteDto, userId: string): Promise<QuoteDocument> {
    const actorName = await this.resolveActorName(userId);

    const quote = new this.quoteModel({
      ...dto,
      createdBy: userId,
      timeline: [
        {
          type: 'created',
          date: new Date(),
          actor: actorName,
          detail: `Cotización ${dto.quoteId} creada`,
        },
      ],
    });

    return quote.save() as unknown as QuoteDocument;
  }

  async findAll(query: QueryQuoteDto): Promise<{ data: any[]; total: number }> {
    const { status, search, createdBy, page = 1, limit = 10 } = query;
    const filter: Record<string, any> = {};

    if (status) filter.quoteStatus = status;
    if (createdBy) filter.createdBy = createdBy;
    if (search) filter.$text = { $search: search };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.quoteModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.quoteModel.countDocuments(filter),
    ]);

    const dataWithTotals = data.map((quote) => ({
      ...quote,
      ...this.calculateTotals(quote),
    }));

    return { data: dataWithTotals, total };
  }

  async findOne(id: string): Promise<QuoteDocument> {
    const quote = await this.quoteModel.findById(id).lean();
    if (!quote) throw new NotFoundException(`Cotización ${id} no encontrada`);
    return quote as unknown as QuoteDocument;
  }

  async findByQuoteId(quoteId: string): Promise<QuoteDocument> {
    const quote = await this.quoteModel.findOne({ quoteId }).lean();
    if (!quote)
      throw new NotFoundException(`Cotización ${quoteId} no encontrada`);
    return quote as unknown as QuoteDocument;
  }

  async update(
    id: string,
    dto: UpdateQuoteDto,
    userId?: string,
  ): Promise<QuoteDocument> {
    const actorName = userId ? await this.resolveActorName(userId) : 'system';

    const timelineEvent = {
      type: 'draft_saved',
      date: new Date(),
      actor: actorName,
      detail: 'Borrador actualizado',
    };

    const quote = await this.quoteModel
      .findByIdAndUpdate(
        id,
        {
          $set: dto,
          $push: { timeline: timelineEvent },
        },
        { new: true, runValidators: true },
      )
      .lean();

    if (!quote) throw new NotFoundException(`Cotización ${id} no encontrada`);
    return quote as unknown as QuoteDocument;
  }

  async updateStatus(
    id: string,
    status: QUOTE_STATUS,
    userId?: string,
  ): Promise<QuoteDocument> {
    const actorName = userId ? await this.resolveActorName(userId) : 'system';

    const eventTypeMap: Record<string, string> = {
      [QUOTE_STATUS.SENT]: 'sent',
      [QUOTE_STATUS.ACCEPTED]: 'accepted',
      [QUOTE_STATUS.REJECTED]: 'rejected',
    };

    const timelineEvent = {
      type: eventTypeMap[status] ?? 'status_changed',
      date: new Date(),
      actor: actorName,
      detail: `Estado cambiado a ${status}`,
    };

    const quote = await this.quoteModel
      .findByIdAndUpdate(
        id,
        {
          $set: { quoteStatus: status },
          $push: { timeline: timelineEvent },
        },
        { new: true, runValidators: true },
      )
      .lean();

    if (!quote) throw new NotFoundException(`Cotización ${id} no encontrada`);
    return quote as unknown as QuoteDocument;
  }
  async remove(id: string): Promise<void> {
    const result = await this.quoteModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`Cotización ${id} no encontrada`);
  }

  async addTimelineEvent(
    id: string,
    type: string,
    detail: string,
    userId?: string,
  ): Promise<QuoteDocument> {
    const actorName = userId ? await this.resolveActorName(userId) : 'system';

    const quote = await this.quoteModel
      .findByIdAndUpdate(
        id,
        {
          $push: {
            timeline: {
              type,
              date: new Date(),
              actor: actorName,
              detail,
            },
          },
        },
        { new: true },
      )
      .lean();

    if (!quote) throw new NotFoundException(`Cotización ${id} no encontrada`);
    return quote as unknown as QuoteDocument;
  }

  async generatePdf(id: string): Promise<Buffer> {
    const quote = await this.findOne(id);
    const totals = this.calculateTotals(quote);
    return this.pdfService.generatePdf(quote, totals);
  }

  // ─── Totales enriquecidos ─────────────────────────────────────────────────

  async findOneWithTotals(id: string): Promise<IQuote> {
    const quote = await this.findOne(id);
    const totals = this.calculateTotals(quote);

    return {
      ...(quote as any),
      ...totals,
    };
  }
}
