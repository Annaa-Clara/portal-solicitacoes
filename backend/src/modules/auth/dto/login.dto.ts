import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ana.souza' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'Informe o usuário.' })
  @IsNotEmpty({ message: 'Informe o usuário.' })
  @MaxLength(50, { message: 'Usuário deve ter no máximo 50 caracteres.' })
  usuario: string;

  @ApiProperty({ example: 'Demo@123' })
  @IsString({ message: 'Informe a senha.' })
  @IsNotEmpty({ message: 'Informe a senha.' })
  @MaxLength(72, { message: 'Senha deve ter no máximo 72 caracteres.' })
  senha: string;
}
