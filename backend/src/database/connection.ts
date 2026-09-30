import { ClientConfig } from 'pg';
import { EnvironmentVariables } from '../config/env.validation';

export function pgConfigFromEnv(env: EnvironmentVariables): ClientConfig {
  return {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
  };
}
