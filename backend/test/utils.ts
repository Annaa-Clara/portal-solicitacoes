import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarAplicacao } from '../src/app.setup';
import { validateEnv } from '../src/config/env.validation';
import { pgConfigFromEnv } from '../src/database/connection';
import { executarMigrations, resolverDiretorioMigrations } from '../src/database/migration-runner';

/**
 * Sobe a aplicação real contra um banco PostgreSQL dedicado a testes,
 * recriado do zero e migrado pelos mesmos scripts usados em produção.
 */
export async function criarAppDeTeste(): Promise<INestApplication> {
  const env = validateEnv(process.env);
  const conexao = pgConfigFromEnv(env);

  const client = new Client(conexao);
  await client.connect();
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await client.end();

  const silencioso = { log: () => undefined, error: () => undefined };
  await executarMigrations(conexao, resolverDiretorioMigrations(env.MIGRATIONS_DIR), silencioso);

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ bodyParser: false, logger: false });
  configurarAplicacao(app);
  await app.init();
  return app;
}

export type Agente = ReturnType<typeof request.agent>;

export const SENHA_DEMO = 'Demo@123';

export async function autenticar(app: INestApplication, usuario: string): Promise<Agente> {
  const agente = request.agent(app.getHttpServer());
  await agente.post('/api/auth/login').send({ usuario, senha: SENHA_DEMO }).expect(200);
  return agente;
}
