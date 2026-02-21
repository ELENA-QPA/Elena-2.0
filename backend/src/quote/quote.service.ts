import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateQuoteDto } from './dto/create-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { Quote, QuoteDocument } from './entities/quote.entity';
import { IQuote, IQuoteTotals, QUOTE_STATUS } from './types/quote.types';

@Injectable()
export class QuoteService {
  constructor(
    @InjectModel(Quote.name) private readonly quoteModel: Model<QuoteDocument>,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Calcula los totales de la cotización
   */
  calculateTotals(quote: Partial<Quote>): IQuoteTotals {
    const standardSubtotalUSD =
      (quote.standardLicensesCount ?? 0) * (quote.standardLicensePriceUSD ?? 0);
    const premiumSubtotalUSD =
      (quote.premiumLicensesCount ?? 0) * (quote.premiumLicensePriceUSD ?? 0);
    const implementationPriceUSD = quote.implementationPriceUSD ?? 0;

    return {
      standardSubtotalUSD,
      premiumSubtotalUSD,
      implementationPriceUSD,
      totalQuoteUSD:
        standardSubtotalUSD + premiumSubtotalUSD + implementationPriceUSD,
    };
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: CreateQuoteDto, userId: string): Promise<QuoteDocument> {
    const quote = new this.quoteModel({
      ...dto,
      createdBy: userId,
    });

    return quote.save() as unknown as QuoteDocument;
  }

  async findAll(
    query: QueryQuoteDto,
  ): Promise<{ data: QuoteDocument[]; total: number }> {
    const { status, search, createdBy, page = 1, limit = 10 } = query;
    const filter: Record<string, any> = {};

    if (status) filter.status = status;
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

    return { data: data as unknown as QuoteDocument[], total };
  }

  async findOne(id: string): Promise<QuoteDocument> {
    const quote = await this.quoteModel.findById(id).lean();
    if (!quote) throw new NotFoundException(`Cotización ${id} no encontrada`);
    return quote as unknown as QuoteDocument;
  }

  async findByQuoteNumber(quoteNumber: string): Promise<QuoteDocument> {
    const quote = await this.quoteModel.findOne({ quoteNumber }).lean();
    if (!quote)
      throw new NotFoundException(`Cotización ${quoteNumber} no encontrada`);
    return quote as unknown as QuoteDocument;
  }

  async update(id: string, dto: UpdateQuoteDto): Promise<QuoteDocument> {
    const quote = await this.quoteModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .lean();

    if (!quote) throw new NotFoundException(`Cotización ${id} no encontrada`);
    return quote as unknown as QuoteDocument;
  }

  async updateStatus(id: string, status: QUOTE_STATUS): Promise<QuoteDocument> {
    return this.update(id, { status });
  }

  async remove(id: string): Promise<void> {
    const result = await this.quoteModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`Cotización ${id} no encontrada`);
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
