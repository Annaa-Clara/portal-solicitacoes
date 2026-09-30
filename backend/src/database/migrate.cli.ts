/**
 * Executa as migrations manualmente: npm run db:migrate
 * (a API também as executa na inicialização quando DATABASE_MIGRATE_ON_START=true).
 */
import '../config/load-env';
import { validateEnv } from '../config/env.validation';
import { pgConfigFromEnv } from './connection';
import { executarMigrations, resolverDiretorioMigrations } from './migration-runner';

async function main() {
  const env = validateEnv(process.env);
  const diretorio = resolverDiretorioMigrations(env.MIGRATIONS_DIR);
  const resultado = await executarMigrations(pgConfigFromEnv(env), diretorio);
  console.log(`[migrations] concluído: ${resultado.aplicadas.length} nova(s) aplicada(s).`);
}

main().catch((erro: Error) => {
  console.error(`[migrations] ${erro.message}`);
  process.exit(1);
});
