import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Perfil } from '../../common/enums';
import { UsuarioAutenticado } from '../../common/types';
import { EnvironmentVariables } from '../../config/env.validation';
import { FiltroSolicitacoesDto } from '../solicitacoes/dto/filtro-solicitacoes.dto';
import { SolicitacoesService } from '../solicitacoes/solicitacoes.service';
import {
  CategoriaIndicadorDto,
  DashboardDto,
  EvolucaoDiariaDto,
  IndicadoresDto,
} from './dto/dashboard.dto';

export const DIAS_EVOLUCAO = 14;

/**
 * Indicadores agregados diretamente no banco (COUNT ... FILTER), em poucas
 * consultas, em vez de carregar registros para contar em memória.
 * O escopo respeita o perfil: solicitante vê apenas os próprios números.
 */
@Injectable()
export class DashboardService {
  private readonly tz: string;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly solicitacoes: SolicitacoesService,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.tz = config.get('APP_TIMEZONE', { infer: true });
  }

  async obter(ator: UsuarioAutenticado): Promise<DashboardDto> {
    const escopo = ator.perfil === Perfil.SOLICITANTE ? ator.id : null;

    const filtroRecentes = Object.assign(new FiltroSolicitacoesDto(), { tamanho: 5 });
    const [indicadores, porCategoria, evolucao, recentes] = await Promise.all([
      this.indicadores(escopo),
      this.porCategoria(escopo),
      this.evolucao(escopo),
      this.solicitacoes.listar(filtroRecentes, ator),
    ]);

    return { indicadores, porCategoria, evolucao, recentes: recentes.itens };
  }

  private async indicadores(escopo: number | null): Promise<IndicadoresDto> {
    const [linha] = await this.dataSource.query(
      `SELECT COUNT(*)                                           AS total,
              COUNT(*) FILTER (WHERE status = 'ABERTO')          AS abertas,
              COUNT(*) FILTER (WHERE status = 'EM_ATENDIMENTO')  AS em_atendimento,
              COUNT(*) FILTER (WHERE status = 'CONCLUIDO')       AS concluidas,
              ROUND(AVG(EXTRACT(EPOCH FROM (concluido_em - criado_em)) / 3600)
                    FILTER (WHERE status = 'CONCLUIDO')::numeric, 1) AS tempo_medio
         FROM solicitacao
        WHERE ($1::bigint IS NULL OR solicitante_id = $1)`,
      [escopo],
    );
    return {
      total: Number(linha.total),
      abertas: Number(linha.abertas),
      emAtendimento: Number(linha.em_atendimento),
      concluidas: Number(linha.concluidas),
      tempoMedioConclusaoHoras: linha.tempo_medio === null ? null : Number(linha.tempo_medio),
    };
  }

  private async porCategoria(escopo: number | null): Promise<CategoriaIndicadorDto[]> {
    const linhas: Record<string, string | number>[] = await this.dataSource.query(
      `SELECT c.id AS categoria_id, c.nome AS categoria,
              COUNT(s.id)                                          AS total,
              COUNT(s.id) FILTER (WHERE s.status = 'ABERTO')         AS abertas,
              COUNT(s.id) FILTER (WHERE s.status = 'EM_ATENDIMENTO') AS em_atendimento,
              COUNT(s.id) FILTER (WHERE s.status = 'CONCLUIDO')      AS concluidas
         FROM categoria c
         LEFT JOIN solicitacao s
           ON s.categoria_id = c.id AND ($1::bigint IS NULL OR s.solicitante_id = $1)
        WHERE c.ativa
        GROUP BY c.id, c.nome
        ORDER BY total DESC, c.nome`,
      [escopo],
    );
    return linhas.map((l) => ({
      categoriaId: Number(l.categoria_id),
      categoria: String(l.categoria),
      total: Number(l.total),
      abertas: Number(l.abertas),
      emAtendimento: Number(l.em_atendimento),
      concluidas: Number(l.concluidas),
    }));
  }

  /** Solicitações abertas e concluídas por dia nos últimos 14 dias (dias civis no fuso da empresa). */
  private async evolucao(escopo: number | null): Promise<EvolucaoDiariaDto[]> {
    const linhas: { dia: string; abertas: string; concluidas: string }[] =
      await this.dataSource.query(
        `WITH dias AS (
           SELECT generate_series(
                    (NOW() AT TIME ZONE $2)::date - ($3::int - 1),
                    (NOW() AT TIME ZONE $2)::date,
                    INTERVAL '1 day')::date AS dia
         ),
         base AS (
           SELECT (criado_em AT TIME ZONE $2)::date   AS aberta_em,
                  (concluido_em AT TIME ZONE $2)::date AS concluida_em
             FROM solicitacao
            WHERE ($1::bigint IS NULL OR solicitante_id = $1)
         )
         SELECT TO_CHAR(d.dia, 'YYYY-MM-DD') AS dia,
                (SELECT COUNT(*) FROM base b WHERE b.aberta_em = d.dia)    AS abertas,
                (SELECT COUNT(*) FROM base b WHERE b.concluida_em = d.dia) AS concluidas
           FROM dias d
          ORDER BY d.dia`,
        [escopo, this.tz, DIAS_EVOLUCAO],
      );
    return linhas.map((l) => ({
      dia: l.dia,
      abertas: Number(l.abertas),
      concluidas: Number(l.concluidas),
    }));
  }
}
