import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParametersService } from './parameters.service';
import { ParametersController } from './parameters.controller';
import { Parameter, ParameterSchema } from './entities/parameter.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Parameter.name,
        schema: ParameterSchema,
      },
    ]),
  ],
  controllers: [ParametersController],
  providers: [ParametersService],
  exports: [ParametersService],
})
export class ParametersModule { }
