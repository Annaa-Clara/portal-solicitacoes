/**
 * Executado antes de qualquer import dos testes e2e: define o ambiente de
 * teste, apontando SEMPRE para um banco separado do de desenvolvimento.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_HOST ??= 'localhost';
process.env.DATABASE_PORT ??= '5432';
process.env.DATABASE_USER ??= 'portal';
process.env.DATABASE_PASSWORD ??= 'portal';
process.env.DATABASE_NAME = process.env.DATABASE_NAME_TEST ?? 'portal_solicitacoes_test';
process.env.SWAGGER_ENABLED = 'false';
