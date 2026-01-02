import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class EmailToUserDto {
  @IsEmail()
  readonly email: string;

  @IsString()
  readonly title: string;

  @IsString()
  readonly message: string;

  @IsString()
  readonly subject: string;

  @IsString()
  readonly response: string;
}
