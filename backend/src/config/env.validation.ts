import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === '1';
const toNumber = ({ value }: { value: unknown }) => Number(value);

/** Valores usados quando a variável não é informada. */
const DEFAULTS = {
  NODE_ENV: 'development',
  PORT: '3000',
  DATABASE_PORT: '5432',
  DATABASE_MIGRATE_ON_START: 'true',
  SESSION_IDLE_MINUTES: '120',
  SESSION_MAX_HOURS: '12',
  COOKIE_SECURE: 'false',
  CORS_ORIGINS: 'http://localhost:5173',
  TRUST_PROXY: 'false',
  APP_TIMEZONE: 'America/Fortaleza',
  SWAGGER_ENABLED: 'true',
};

/**
 * Contrato das variáveis de ambiente. A API não sobe com configuração
 * inválida: o erro aparece na inicialização, não no primeiro request.
 */
export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV!: 'development' | 'production' | 'test';

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_HOST!: string;

  @Transform(toNumber)
  @IsInt()
  DATABASE_PORT!: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_USER!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME!: string;

  @Transform(toBoolean)
  @IsBoolean()
  DATABASE_MIGRATE_ON_START!: boolean;

  @IsOptional()
  @IsString()
  MIGRATIONS_DIR?: string;

  @Transform(toNumber)
  @IsInt()
  @Min(5)
  SESSION_IDLE_MINUTES!: number;

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  SESSION_MAX_HOURS!: number;

  @Transform(toBoolean)
  @IsBoolean()
  COOKIE_SECURE!: boolean;

  @IsString()
  CORS_ORIGINS!: string;

  @Transform(toBoolean)
  @IsBoolean()
  TRUST_PROXY!: boolean;

  @IsString()
  APP_TIMEZONE!: string;

  @Transform(toBoolean)
  @IsBoolean()
  SWAGGER_ENABLED!: boolean;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const definidas = Object.fromEntries(
    Object.entries(config).filter(([, v]) => v !== undefined && v !== ''),
  );
  const env = plainToInstance(EnvironmentVariables, { ...DEFAULTS, ...definidas });
  const errors = validateSync(env);
  if (errors.length > 0) {
    const detalhes = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n  ');
    throw new Error(`Configuração de ambiente inválida:\n  ${detalhes}`);
  }
  return env;
}
