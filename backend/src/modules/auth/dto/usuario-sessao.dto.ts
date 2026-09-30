import { ApiProperty } from '@nestjs/swagger';
import { Perfil } from '../../../common/enums';

export class UsuarioSessaoDto {
  @ApiProperty() id: number;
  @ApiProperty() nome: string;
  @ApiProperty() usuario: string;
  @ApiProperty({ enum: Perfil }) perfil: Perfil;
}
