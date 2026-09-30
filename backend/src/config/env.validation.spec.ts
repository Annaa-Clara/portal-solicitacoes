import { validateEnv } from './env.validation';

const minimo = {
  DATABASE_HOST: 'localhost',
  DATABASE_USER: 'portal',
  DATABASE_PASSWORD: 'portal',
  DATABASE_NAME: 'portal',
};

describe('validateEnv', () => {
  it('aplica valores padrão e converte tipos', () => {
    const env = validateEnv({ ...minimo, PORT: '8081', COOKIE_SECURE: 'true' });
    expect(env.PORT).toBe(8081);
    expect(env.COOKIE_SECURE).toBe(true);
    expect(env.SESSION_IDLE_MINUTES).toBe(120);
    expect(env.APP_TIMEZONE).toBe('America/Fortaleza');
  });

  it('impede a inicialização sem as variáveis obrigatórias', () => {
    expect(() => validateEnv({ DATABASE_HOST: 'localhost' })).toThrow(/DATABASE_USER/);
  });

  it('rejeita valores inválidos', () => {
    expect(() => validateEnv({ ...minimo, PORT: 'abc' })).toThrow(/PORT/);
    expect(() => validateEnv({ ...minimo, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});
