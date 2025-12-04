import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, ObjectId, Connection } from 'mongoose';
import { CreatePaymentDto, CreatePaymentValueDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentValue } from './entities/payment-value.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
    @InjectModel(PaymentValue.name)
    private readonly paymentValueModel: Model<PaymentValue>,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  async create(createPaymentDto: CreatePaymentDto) {
    const session = await this.connection.startSession();

    try {
      return await session.withTransaction(async () => {
        const { paymentValues, ...paymentData } = createPaymentDto;

        // 1. Crear el payment principal
        const [paymentCreated] = await this.paymentModel.create([paymentData], { session });
        console.log(`Payment created: ${paymentCreated._id}`);

        // 2. Crear los payment values si existen
        if (paymentValues && paymentValues.length > 0) {
          const paymentValueData = paymentValues.map(pv => ({
            ...pv,
            payment: paymentCreated._id,
            causationDate: new Date(pv.causationDate),
            paymentDate: new Date(pv.paymentDate),
          }));

          await this.paymentValueModel.insertMany(paymentValueData, { session });
          console.log(`Created ${paymentValues.length} payment values`);
        }

        return {
          message: 'Payment y payment values creados exitosamente',
          payment: paymentCreated,
          paymentValuesCount: paymentValues?.length || 0
        };
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new BadRequestException(`Error al crear el payment: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  async createMany(createPaymentDtos: CreatePaymentDto[], recordId: ObjectId, session?: any) {
    try {
      const paymentsToCreate = [];
      const paymentValuesToCreate = [];

      for (const dto of createPaymentDtos) {
        const { paymentValues, ...paymentData } = dto;

        // Preparar payment
        const paymentDoc = {
          ...paymentData,
          record: recordId,
          ...(paymentData.bonusCausationDate && { bonusCausationDate: new Date(paymentData.bonusCausationDate) }),
          ...(paymentData.bonusPaymentDate && { bonusPaymentDate: new Date(paymentData.bonusPaymentDate) }),
        };

        paymentsToCreate.push(paymentDoc);
      }

      // Crear payments
      const options = session ? { session } : {};
      const createdPayments = await this.paymentModel.insertMany(paymentsToCreate, options);

      // Crear payment values para cada payment
      for (let i = 0; i < createPaymentDtos.length; i++) {
        const { paymentValues } = createPaymentDtos[i];
        const paymentId = createdPayments[i]._id;

        if (paymentValues && paymentValues.length > 0) {
          const paymentValueData = paymentValues.map(pv => ({
            ...pv,
            payment: paymentId,
            causationDate: new Date(pv.causationDate),
            paymentDate: new Date(pv.paymentDate),
          }));

          paymentValuesToCreate.push(...paymentValueData);
        }
      }

      // Crear todos los payment values
      if (paymentValuesToCreate.length > 0) {
        await this.paymentValueModel.insertMany(paymentValuesToCreate, options);
      }

      return createdPayments;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Algunos datos de payment ya existen');
      }
      throw new BadRequestException('Error al crear los payments');
    }
  }

  async findAll() {
    return await this.paymentModel.find({ deletedAt: { $exists: false } })
      .populate('record')
      .exec();
  }

  async findByRecord(recordId: string) {
    const payments = await this.paymentModel.find({
      record: recordId,
      deletedAt: { $exists: false }
    }).exec();

    // Para cada payment, buscar sus paymentValues asociados
    const paymentsWithValues = await Promise.all(
      payments.map(async payment => {
        const paymentValues = await this.paymentValueModel.find({
          payment: payment._id,
          deletedAt: { $exists: false }
        }).exec();
        return {
          ...payment.toObject(),
          paymentValues
        };
      })
    );

    return paymentsWithValues;
  }

  // async findOne(id: string) {
  //   const payment = await this.paymentModel.findById(id)
  //     .populate('record')
  //     .exec();
  //   if (!payment || payment.deletedAt) {
  //     throw new NotFoundException('Payment no encontrado');
  //   }

  //   // Buscar payment values asociados
  //   const paymentValues = await this.paymentValueModel.find({
  //     payment: id,
  //     deletedAt: { $exists: false }
  //   }).exec();

  //   return {
  //     ...payment.toObject(),
  //     paymentValues
  //   };
  // }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    try {
      const payment = await this.paymentModel.findByIdAndUpdate(
        id,
        {
          ...updatePaymentDto,
          ...(updatePaymentDto.bonusCausationDate && { bonusCausationDate: new Date(updatePaymentDto.bonusCausationDate) }),
          ...(updatePaymentDto.bonusPaymentDate && { bonusPaymentDate: new Date(updatePaymentDto.bonusPaymentDate) }),
        },
        { new: true }
      );
      if (!payment || payment.deletedAt) {
        throw new NotFoundException('Payment no encontrado');
      }
      return payment;
    } catch (error) {
      throw new BadRequestException('Error al actualizar el payment');
    }
  }

  async remove(id: string) {
    const payment = await this.paymentModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!payment) {
      throw new NotFoundException('Payment no encontrado');
    }

    // También marcar como eliminados los payment values asociados
    await this.paymentValueModel.updateMany(
      { payment: id },
      { deletedAt: new Date() }
    );

    return { message: 'Payment eliminado correctamente' };
  }
}
