import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { LoginDto } from './dto/login.dto';
import { UsuarioSessaoDto } from './dto/usuario-sessao.dto';
import { NovaSessao, SessaoService } from './sessao.service';

/**
 * Hash de uma senha qualquer: quando o usuário não existe, a comparação
 * acontece mesmo assim, para que o tempo de resposta não revele se o login existe.
 */
const HASH_FICTICIO = '$2b$10$7vjW5.KXNIo0cr87cMM6cONYluuOC7NVq7hvpVKIanG7FfL7njlA.';

export interface ResultadoLogin {
  sessao: NovaSessao;
  usuario: UsuarioSessaoDto;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly sessoes: SessaoService,
  ) {}

  async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<ResultadoLogin> {
    const usuario = await this.usuarios
      .createQueryBuilder('u')
      .addSelect('u.senhaHash')
      .where('u.usuario = :usuario', { usuario: dto.usuario })
      .getOne();

    const senhaConfere = await bcrypt.compare(dto.senha, usuario?.senhaHash ?? HASH_FICTICIO);

    // Mensagem única para usuário inexistente, senha errada ou conta inativa.
    if (!usuario || !senhaConfere || !usuario.ativo) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    const sessao = await this.sessoes.criar(usuario, ip, userAgent);
    return { sessao, usuario: AuthService.paraDto(usuario) };
  }

  static paraDto(u: Pick<Usuario, 'id' | 'nome' | 'usuario' | 'perfil'>): UsuarioSessaoDto {
    return { id: u.id, nome: u.nome, usuario: u.usuario, perfil: u.perfil };
  }
}
