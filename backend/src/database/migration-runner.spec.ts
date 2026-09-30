import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { carregarMigrations, resolverDiretorioMigrations } from './migration-runner';

describe('Runner de migrations', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'migrations-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('carrega os scripts ordenados pela versão numérica', () => {
    writeFileSync(join(dir, 'V010__dez.sql'), 'SELECT 10;');
    writeFileSync(join(dir, 'V002__dois.sql'), 'SELECT 2;');
    writeFileSync(join(dir, 'LEIAME.txt'), 'ignorado');

    const migrations = carregarMigrations(dir);

    expect(migrations.map((m) => m.versao)).toEqual([2, 10]);
    expect(migrations[0].descricao).toBe('dois');
    expect(migrations[0].checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it('gera o mesmo checksum independentemente de quebras de linha CRLF/LF', () => {
    writeFileSync(join(dir, 'V001__a.sql'), 'SELECT 1;\nSELECT 2;');
    const lf = carregarMigrations(dir)[0].checksum;
    writeFileSync(join(dir, 'V001__a.sql'), 'SELECT 1;\r\nSELECT 2;');
    expect(carregarMigrations(dir)[0].checksum).toBe(lf);
  });

  it('rejeita nomes fora do padrão', () => {
    writeFileSync(join(dir, 'criar_tabelas.sql'), 'SELECT 1;');
    expect(() => carregarMigrations(dir)).toThrow(/fora do padrão/);
  });

  it('rejeita versões duplicadas', () => {
    writeFileSync(join(dir, 'V001__a.sql'), 'SELECT 1;');
    writeFileSync(join(dir, 'V0001__b.sql'), 'SELECT 1;');
    expect(() => carregarMigrations(dir)).toThrow(/duplicada/);
  });

  it('falha com mensagem clara quando o diretório não existe', () => {
    const original = process.cwd();
    process.chdir(dir);
    try {
      expect(() => resolverDiretorioMigrations('/nao/existe')).toThrow(/não encontrado/);
    } finally {
      process.chdir(original);
    }
  });
});
