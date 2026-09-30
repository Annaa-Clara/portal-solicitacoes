import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { LessThan, Repository } from 'typeorm';
import { UsuarioAutenticado } from '../../common/types';
import { EnvironmentVariables } from '../../config/env.validation';
import { Usuario } from '../usuarios/usuario.entity';
import { INTERVALO_RENOVACAO_MS } from './auth.constants';
import { Sessao } from './sessao.entity';

export interface NovaSessao {
  token: string;
  expiraEm: Date;
}

/**
 * Sessões server-side com token opaco:
 * - o token (256 bits aleatórios) só existe no cookie HttpOnly do navegador;
 * - o banco guarda apenas o SHA-256 do token (vazamento do banco não expõe sessões);
 * - expiração deslizante por inatividade, com teto de duração absoluta;
 * - logout revoga a sessão de verdade, algo que um JWT puro não oferece.
 */
@Injectable()
export class SessaoService {
  private readonly inatividadeMs: number;
  private readonly duracaoMaximaMs: number;

  constructor(
    @InjectRepository(Sessao) private readonly sessoes: Repository<Sessao>,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.inatividadeMs = config.get('SESSION_IDLE_MINUTES', { infer: true }) * 60_000;
    this.duracaoMaximaMs = config.get('SESSION_MAX_HOURS', { infer: true }) * 3_600_000;
  }

  get duracaoMaximaEmMs(): number {
    return this.duracaoMaximaMs;
  }

  static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async criar(usuario: Usuario, ip?: string, userAgent?: string): Promise<NovaSessao> {
    const agora = new Date();
    const token = randomBytes(32).toString('base64url');
    const expiraEm = new Date(agora.getTime() + this.inatividadeMs);

    // Limpeza oportunista: remove sessões antigas do próprio usuário.
    await this.sessoes.delete({
      usuarioId: usuario.id,
      expiraEm: LessThan(new Date(agora.getTime() - 7 * 86_400_000)),
    });

    await this.sessoes.insert({
      id: randomUUID(),
      usuarioId: usuario.id,
      tokenHash: SessaoService.hash(token),
      criadoEm: agora,
      ultimoAcessoEm: agora,
      expiraEm,
      ip: ip?.slice(0, 45) ?? null,
      userAgent: userAgent?.slice(0, 255) ?? null,
    });

    return { token, expiraEm };
  }

  async validar(token: string): Promise<UsuarioAutenticado | null> {
    if (!token || token.length > 100) return null;

    const sessao = await this.sessoes
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.usuario', 'u')
      .where('s.tokenHash = :hash', { hash: SessaoService.hash(token) })
      .andWhere('s.revogadaEm IS NULL')
      .andWhere('s.expiraEm > NOW()')
      .andWhere('u.ativo = TRUE')
      .getOne();

    if (!sessao) return null;

    const agora = Date.now();
    if (agora - sessao.ultimoAcessoEm.getTime() > INTERVALO_RENOVACAO_MS) {
      const limite = sessao.criadoEm.getTime() + this.duracaoMaximaMs;
      await this.sessoes.update(sessao.id, {
        ultimoAcessoEm: new Date(agora),
        expiraEm: new Date(Math.min(agora + this.inatividadeMs, limite)),
      });
    }

    return {
      id: sessao.usuario.id,
      nome: sessao.usuario.nome,
      usuario: sessao.usuario.usuario,
      perfil: sessao.usuario.perfil,
      sessaoId: sessao.id,
    };
  }

  async revogar(sessaoId: string): Promise<void> {
    await this.sessoes.update({ id: sessaoId }, { revogadaEm: new Date() });
  }
}
