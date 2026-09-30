import { existsSync } from 'node:fs';

/**
 * Carrega o arquivo .env (se existir) em process.env ANTES de qualquer módulo
 * da aplicação ser importado. Variáveis já definidas no ambiente (Docker, CI)
 * não são sobrescritas. Deve ser o primeiro import de main.ts.
 */
if (existsSync('.env')) process.loadEnvFile('.env');
