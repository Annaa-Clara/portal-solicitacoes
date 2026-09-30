import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { types } from 'pg';
import { EnvironmentVariables } from '../config/env.validation';
import { Sessao } from '../modules/auth/sessao.entity';
import { Categoria } from '../modules/categorias/categoria.entity';
import { HistoricoStatus } from '../modules/solicitacoes/historico-status.entity';
import { Solicitacao } from '../modules/solicitacoes/solicitacao.entity';
import { Usuario } from '../modules/usuarios/usuario.entity';

// BIGINT (OID 20) e COUNT(*) chegam como string no driver pg; os ids deste
// sistema cabem com folga em Number.MAX_SAFE_INTEGER, então convertemos para number.
types.setTypeParser(20, (valor) => Number.parseInt(valor, 10));

export const ENTIDADES = [Usuario, Sessao, Categoria, Solicitacao, HistoricoStatus];

type OpcoesBanco = Pick<
  EnvironmentVariables,
  | 'NODE_ENV'
  | 'DATABASE_HOST'
  | 'DATABASE_PORT'
  | 'DATABASE_USER'
  | 'DATABASE_PASSWORD'
  | 'DATABASE_NAME'
>;

export function typeOrmOptions(env: OpcoesBanco): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    entities: ENTIDADES,
    // O esquema é controlado exclusivamente pelos scripts SQL versionados.
    synchronize: false,
    migrationsRun: false,
    logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    extra: { max: 10 },
  };
}
