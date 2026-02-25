import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export enum PipedriveItemType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
}

export class SearchByTermDto {
  @ApiProperty({
    description: 'Termino de busqueda (Nombre empresa, Nombre contacto)',
  })
  @IsString()
  searchTerm: string;

  @ApiPropertyOptional({
    description: 'Tipos de busqueda (Persona, Empresa/organizacion)',
    enum: PipedriveItemType,
    isArray: true,
    default: [PipedriveItemType.PERSON, PipedriveItemType.ORGANIZATION],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PipedriveItemType, { each: true })
  item_types?: PipedriveItemType[];
}
