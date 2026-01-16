import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'sync_logs' })
export class SyncLog extends Document {
  @Prop({ required: true, default: 'monolegal' })
  type: string;

  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  completedAt: Date;

  @Prop({
    type: String,
    enum: ['pending', 'success', 'partial', 'error'], 
    default: 'pending',
  })
  status: 'pending' | 'success' | 'partial' | 'error';

  @Prop({ type: Object })
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };

  @Prop()
  errorMessage: string;

  @Prop({ type: [Object], default: [] })  
  errorDetails: Array<{
    radicado: string;
    message: string;
  }>;

  @Prop({
    type: String,
    enum: ['cron', 'manual', 'startup'],
    required: true,
  })
  triggeredBy: 'cron' | 'manual' | 'startup';

  @Prop()
  userId: string;
}

export const SyncLogSchema = SchemaFactory.createForClass(SyncLog);