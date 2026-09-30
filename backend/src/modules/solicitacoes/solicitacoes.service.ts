import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager } from 'typeorm';
import { PaginaDto } from '../../common/dto/pagina.dto';
import { Perfil, StatusSolicitacao } from '../../common/enums';
import { ValidacaoException } from '../../common/filters/problem-details.filter';
import { UsuarioAutenticado } from '../../common/types';
import { EnvironmentVariables } from '../../config/env.validation';
import { Categoria } from '../categorias/categoria.entity';
import {
  Ator,
  exigeObservacao,
  extrairIdDoCodigo,
  podeAlterarStatus,
  podeVisualizar,
  ROTULO_STATUS,
  transicaoValida,
} from './domain/regras-solicitacao';
import { AlterarStatusDto } from './dto/alterar-status.dto';
import { CampoOrdenacao, FiltroSolicitacoesDto } from './dto/filtro-solicitacoes.dto';
import { SalvarSolicitacaoDto } from './dto/salvar-solicitacao.dto';
import { SolicitacaoDetalheDto, SolicitacaoItemDto } from './dto/solicitacao-resposta.dto';
import { HistoricoStatus } from './historico-status.entity';
import { Solicitacao } from './solicitacao.entity';
import { paraDetalhe, paraItem } from './solicitacao.mapper';

const COLUNAS_ORDENACAO: Record<CampoOrdenacao, string> = {
  criadoEm: 's.criadoEm',
  titulo: 's.titulo',
  status: 's.status',
  id: 's.id',
};

const NAO_ENCONTRADA = 'Solicitação não encontrada.';

@Injectable()
export class SolicitacoesService {
  private readonly fusoHorario: string;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.fusoHorario = config.get('APP_TIMEZONE', { infer: true });
  }

  // ---------------------------------------------------------------------------
  // Consultas
  // ---------------------------------------------------------------------------

  async listar(
    filtro: FiltroSolicitacoesDto,
    ator: UsuarioAutenticado,
  ): Promise<PaginaDto<SolicitacaoItemDto>> {
    this.validarPeriodo(filtro);
    const pagina = filtro.pagina ?? 1;
    const tamanho = filtro.tamanho ?? 10;

    const qb = this.dataSource
      .getRepository(Solicitacao)
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.categoria', 'c')
      .innerJoinAndSelect('s.solicitante', 'u');

    // Visibilidade: solicitante enxerga apenas as próprias demandas.
    if (ator.perfil === Perfil.SOLICITANTE) {
      qb.andWhere('s.solicitanteId = :atorId', { atorId: ator.id });
    }
    if (filtro.status) qb.andWhere('s.status = :status', { status: filtro.status });
    if (filtro.categoriaId) {
      qb.andWhere('s.categoriaId = :categoriaId', { categoriaId: filtro.categoriaId });
    }
    // Datas do filtro são dias civis no fuso da empresa, convertidos para instantes.
    if (filtro.dataInicio) {
      qb.andWhere(`s.criadoEm >= (CAST(:dataInicio AS date)::timestamp AT TIME ZONE :tz)`, {
        dataInicio: filtro.dataInicio,
        tz: this.fusoHorario,
      });
    }
    if (filtro.dataFim) {
      qb.andWhere(`s.criadoEm < ((CAST(:dataFim AS date) + 1)::timestamp AT TIME ZONE :tz)`, {
        dataFim: filtro.dataFim,
        tz: this.fusoHorario,
      });
    }
    if (filtro.texto) {
      const termo = `%${filtro.texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      const idCodigo = extrairIdDoCodigo(filtro.texto);
      qb.andWhere(
        new Brackets((w) => {
          w.where('s.titulo ILIKE :termo', { termo });
          if (idCodigo !== null) w.orWhere('s.id = :idCodigo', { idCodigo });
        }),
      );
    }

    const direcao = filtro.direcao === 'asc' ? 'ASC' : 'DESC';
    qb.orderBy(COLUNAS_ORDENACAO[filtro.ordenarPor ?? 'criadoEm'], direcao)
      .addOrderBy('s.id', 'DESC')
      .skip((pagina - 1) * tamanho)
      .take(tamanho);

    const [itens, total] = await qb.getManyAndCount();
    return PaginaDto.de(itens.map(paraItem), total, pagina, tamanho);
  }

  async detalhar(id: number, ator: UsuarioAutenticado): Promise<SolicitacaoDetalheDto> {
    const solicitacao = await this.dataSource.getRepository(Solicitacao).findOne({
      where: { id },
      relations: { categoria: true, solicitante: true, historico: { usuario: true } },
    });
    // Recurso de outro usuário responde 404 (e não 403) para não revelar sua existência.
    if (!solicitacao || !podeVisualizar(ator, solicitacao)) {
      throw new NotFoundException(NAO_ENCONTRADA);
    }
    return paraDetalhe(solicitacao, ator);
  }

  // ---------------------------------------------------------------------------
  // Comandos
  // ---------------------------------------------------------------------------

  async criar(dto: SalvarSolicitacaoDto, ator: UsuarioAutenticado): Promise<SolicitacaoDetalheDto> {
    const id = await this.dataSource.transaction(async (em) => {
      await this.garantirCategoriaAtiva(em, dto.categoriaId);
      const { identifiers } = await em.insert(Solicitacao, {
        titulo: dto.titulo,
        descricao: dto.descricao,
        categoriaId: dto.categoriaId,
        solicitanteId: ator.id,
        status: StatusSolicitacao.ABERTO,
      });
      const novoId = Number(identifiers[0].id);
      await em.insert(HistoricoStatus, {
        solicitacaoId: novoId,
        statusAnterior: null,
        statusNovo: StatusSolicitacao.ABERTO,
        usuarioId: ator.id,
        observacao: 'Solicitação registrada.',
      });
      return novoId;
    });
    return this.detalhar(id, ator);
  }

  async atualizar(
    id: number,
    dto: SalvarSolicitacaoDto,
    ator: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    await this.dataSource.transaction(async (em) => {
      const solicitacao = await this.carregarParaModificacao(em, id, ator, 'editadas');
      await this.garantirCategoriaAtiva(em, dto.categoriaId);
      solicitacao.titulo = dto.titulo;
      solicitacao.descricao = dto.descricao;
      solicitacao.categoriaId = dto.categoriaId;
      await em.save(solicitacao);
    });
    return this.detalhar(id, ator);
  }

  async excluir(id: number, ator: UsuarioAutenticado): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      await this.carregarParaModificacao(em, id, ator, 'excluídas');
      await em.delete(Solicitacao, { id }); // histórico removido via ON DELETE CASCADE
    });
  }

  async alterarStatus(
    id: number,
    dto: AlterarStatusDto,
    ator: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    if (!podeAlterarStatus(ator)) {
      throw new ForbiddenException('Apenas atendentes podem alterar o status.');
    }

    await this.dataSource.transaction(async (em) => {
      // SELECT ... FOR UPDATE: duas alterações simultâneas não geram histórico inconsistente.
      const solicitacao = await em.findOne(Solicitacao, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!solicitacao) throw new NotFoundException(NAO_ENCONTRADA);

      const atual = solicitacao.status;
      if (atual === dto.status) {
        throw new ConflictException(`A solicitação já está com status ${ROTULO_STATUS[atual]}.`);
      }
      if (!transicaoValida(atual, dto.status)) {
        throw new ConflictException(
          `Não é permitido alterar o status de ${ROTULO_STATUS[atual]} para ${ROTULO_STATUS[dto.status]}.`,
        );
      }
      if (exigeObservacao(atual, dto.status) && !dto.observacao) {
        throw new ValidacaoException([
          {
            campo: 'observacao',
            mensagem: 'Informe o motivo ao devolver a solicitação para Aberto.',
          },
        ]);
      }

      solicitacao.status = dto.status;
      solicitacao.concluidoEm = dto.status === StatusSolicitacao.CONCLUIDO ? new Date() : null;
      await em.save(solicitacao);
      await em.insert(HistoricoStatus, {
        solicitacaoId: id,
        statusAnterior: atual,
        statusNovo: dto.status,
        usuarioId: ator.id,
        observacao: dto.observacao ?? null,
      });
    });
    return this.detalhar(id, ator);
  }

  // ---------------------------------------------------------------------------
  // Auxiliares
  // ---------------------------------------------------------------------------

  private async carregarParaModificacao(
    em: EntityManager,
    id: number,
    ator: Ator,
    acao: 'editadas' | 'excluídas',
  ): Promise<Solicitacao> {
    const solicitacao = await em.findOne(Solicitacao, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!solicitacao || !podeVisualizar(ator, solicitacao)) {
      throw new NotFoundException(NAO_ENCONTRADA);
    }
    if (solicitacao.solicitanteId !== ator.id) {
      throw new ForbiddenException(`Apenas o solicitante pode alterar esta solicitação.`);
    }
    if (solicitacao.status !== StatusSolicitacao.ABERTO) {
      throw new ConflictException(
        `Somente solicitações com status Aberto podem ser ${acao}. ` +
          `Status atual: ${ROTULO_STATUS[solicitacao.status]}.`,
      );
    }
    return solicitacao;
  }

  private async garantirCategoriaAtiva(em: EntityManager, categoriaId: number): Promise<void> {
    const existe = await em.exists(Categoria, { where: { id: categoriaId, ativa: true } });
    if (!existe) {
      throw new ValidacaoException([
        { campo: 'categoriaId', mensagem: 'Categoria não encontrada ou inativa.' },
      ]);
    }
  }

  private validarPeriodo(filtro: FiltroSolicitacoesDto): void {
    const erros: { campo: string; mensagem: string }[] = [];
    for (const campo of ['dataInicio', 'dataFim'] as const) {
      const valor = filtro[campo];
      if (valor && !dataExiste(valor)) {
        erros.push({ campo, mensagem: `Data ${valor} não existe no calendário.` });
      }
    }
    if (
      !erros.length &&
      filtro.dataInicio &&
      filtro.dataFim &&
      filtro.dataInicio > filtro.dataFim
    ) {
      erros.push({
        campo: 'dataFim',
        mensagem: 'Data final deve ser igual ou posterior à inicial.',
      });
    }
    if (erros.length) throw new ValidacaoException(erros);
  }
}

function dataExiste(iso: string): boolean {
  const [a, m, d] = iso.split('-').map(Number);
  const data = new Date(Date.UTC(a, m - 1, d));
  return data.getUTCFullYear() === a && data.getUTCMonth() === m - 1 && data.getUTCDate() === d;
}
