import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Sessao } from './sessao.entity';
import { SessaoGuard } from './sessao.guard';
import { SessaoService } from './sessao.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Sessao])],
  controllers: [AuthController],
  providers: [AuthService, SessaoService, SessaoGuard],
  exports: [SessaoService, SessaoGuard],
})
export class AuthModule {}
