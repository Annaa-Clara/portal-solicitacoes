import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Client, ClientConfig } from 'pg';

/** Padrão de nome dos scripts: V001__descricao.sql */
const PADRAO_ARQUIVO = /^V(\d{3,})__([\w-]+)\.sql$/;

/** Chave arbitrária para o advisory lock que serializa execuções concorrentes. */
const LOCK_ID = 748_392_001;

export interface Migration {
  versao: number;
  descricao: string;
  arquivo: string;
  checksum: string;
  sql: string;
}

export interface MigrationResult {
  aplicadas: string[];
  jaAplicadas: number;
}

type Logger = Pick<Console, 'log' | 'error'>;

export function resolverDiretorioMigrations(configurado?: string): string {
  const candidatos = [
    configurado,
    resolve(process.cwd(), 'database/migrations'),
    resolve(process.cwd(), '../database/migrations'),
  ].filter((c): c is string => Boolean(c));

  const encontrado = candidatos.map((c) => resolve(c)).find((c) => existsSync(c));
  if (!encontrado) {
    throw new Error(
      `Diretório de migrations não encontrado. Procurado em: ${candidatos.join(', ')}`,
    );
  }
  return encontrado;
}

export function carregarMigrations(diretorio: string): Migration[] {
  const migrations = readdirSync(diretorio)
    .filter((arquivo) => arquivo.endsWith('.sql'))
    .map((arquivo) => {
      const match = PADRAO_ARQUIVO.exec(arquivo);
      if (!match) {
        throw new Error(`Nome de migration fora do padrão V001__descricao.sql: ${arquivo}`);
      }
      const sql = readFileSync(join(diretorio, arquivo), 'utf8');
      return {
        versao: Number(match[1]),
        descricao: match[2].replace(/_/g, ' '),
        arquivo,
        checksum: createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex'),
        sql,
      };
    })
    .sort((a, b) => a.versao - b.versao);

  const versoes = new Set<number>();
  for (const m of migrations) {
    if (versoes.has(m.versao)) {
      throw new Error(`Versão de migration duplicada: V${m.versao}`);
    }
    versoes.add(m.versao);
  }
  return migrations;
}

/**
 * Runner de migrations versionadas em SQL puro, no mesmo espírito do Flyway:
 * - cada script roda uma única vez, em transação própria;
 * - o checksum impede que um script já aplicado seja alterado silenciosamente;
 * - um advisory lock evita que duas instâncias migrem o banco ao mesmo tempo.
 */
export async function executarMigrations(
  conexao: ClientConfig,
  diretorio: string,
  logger: Logger = console,
): Promise<MigrationResult> {
  const migrations = carregarMigrations(diretorio);
  const client = new Client(conexao);
  await client.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        versao      INTEGER      PRIMARY KEY,
        descricao   VARCHAR(200) NOT NULL,
        checksum    CHAR(64)     NOT NULL,
        aplicado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        duracao_ms  INTEGER      NOT NULL
      )`);

    const { rows } = await client.query<{ versao: number; checksum: string }>(
      'SELECT versao, checksum FROM schema_migrations',
    );
    const aplicadas = new Map(rows.map((r) => [r.versao, r.checksum]));
    const resultado: MigrationResult = { aplicadas: [], jaAplicadas: 0 };

    for (const migration of migrations) {
      const checksumAplicado = aplicadas.get(migration.versao);
      if (checksumAplicado) {
        if (checksumAplicado !== migration.checksum) {
          throw new Error(
            `A migration ${migration.arquivo} foi alterada após ser aplicada. ` +
              'Crie uma nova versão em vez de editar scripts existentes.',
          );
        }
        resultado.jaAplicadas++;
        continue;
      }

      const inicio = Date.now();
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations (versao, descricao, checksum, duracao_ms) VALUES ($1, $2, $3, $4)',
          [migration.versao, migration.descricao, migration.checksum, Date.now() - inicio],
        );
        await client.query('COMMIT');
      } catch (erro) {
        await client.query('ROLLBACK');
        throw new Error(`Falha ao aplicar ${migration.arquivo}: ${(erro as Error).message}`);
      }
      resultado.aplicadas.push(migration.arquivo);
      logger.log(`[migrations] aplicada ${migration.arquivo} (${Date.now() - inicio} ms)`);
    }

    if (resultado.aplicadas.length === 0) {
      logger.log(`[migrations] banco atualizado (${resultado.jaAplicadas} versões aplicadas)`);
    }
    return resultado;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => undefined);
    await client.end();
  }
}
