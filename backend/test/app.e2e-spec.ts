import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Agente, autenticar, criarAppDeTeste } from './utils';

/**
 * Testes de ponta a ponta: HTTP -> guards -> validação -> serviço -> PostgreSQL.
 * Cobrem os requisitos funcionais do enunciado e as regras de segurança.
 * Executados em sequência (--runInBand) sobre um banco recriado a cada execução.
 */
describe('Portal de Solicitações (e2e)', () => {
  let app: INestApplication;
  let ana: Agente; // solicitante
  let carlos: Agente; // outro solicitante
  let joana: Agente; // atendente

  const novaSolicitacao = {
    titulo: 'Teclado com teclas travando',
    descricao: 'As teclas A e S travam com frequência durante a digitação.',
    categoriaId: 1,
  };

  beforeAll(async () => {
    app = await criarAppDeTeste();
    ana = await autenticar(app, 'ana.souza');
    carlos = await autenticar(app, 'carlos.lima');
    joana = await autenticar(app, 'joana.pereira');
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('1. Autenticação', () => {
    it('bloqueia rotas protegidas sem sessão', async () => {
      const res = await request(app.getHttpServer()).get('/api/solicitacoes').expect(401);
      expect(res.headers['content-type']).toContain('application/problem+json');
      expect(res.body.detail).toMatch(/Sessão inválida/);
    });

    it('recusa credenciais inválidas com mensagem genérica', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ usuario: 'ana.souza', senha: 'errada' })
        .expect(401);
      expect(res.body.detail).toBe('Usuário ou senha inválidos.');
    });

    it('emite cookie HttpOnly e SameSite=Strict, sem expor o token no corpo', async () => {
      const agente = request.agent(app.getHttpServer());
      const res = await agente
        .post('/api/auth/login')
        .send({ usuario: '  CARLOS.LIMA ', senha: 'Demo@123' })
        .expect(200);

      const cookie = String(res.headers['set-cookie']);
      expect(cookie).toMatch(/portal_sessao=/);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Strict/);
      expect(res.body).toEqual({
        id: expect.any(Number),
        nome: 'Carlos Lima',
        usuario: 'carlos.lima',
        perfil: 'SOLICITANTE',
      });

      // logout revoga a sessão no servidor: o mesmo cookie deixa de valer
      await agente.get('/api/auth/me').expect(200);
      await agente.post('/api/auth/logout').expect(204);
      await agente.get('/api/auth/me').expect(401);
    });

    it('limita tentativas de login por minuto', async () => {
      const servidor = app.getHttpServer();
      let ultima = 0;
      for (let i = 0; i < 6; i++) {
        const res = await request(servidor)
          .post('/api/auth/login')
          .send({ usuario: 'inexistente', senha: 'x' });
        ultima = res.status;
      }
      expect(ultima).toBe(429);
    });
  });

  describe('2. Cadastro de solicitações', () => {
    let id: number;

    it('cria com status Aberto, solicitante e data automáticos', async () => {
      const res = await ana.post('/api/solicitacoes').send(novaSolicitacao).expect(201);
      id = res.body.id;
      expect(res.body).toMatchObject({
        codigo: `SOL-${String(id).padStart(6, '0')}`,
        titulo: novaSolicitacao.titulo,
        status: 'ABERTO',
        solicitante: { nome: 'Ana Souza' },
        categoria: { id: 1, nome: 'TI' },
        permissoes: { podeEditar: true, podeExcluir: true, transicoesPermitidas: [] },
      });
      expect(new Date(res.body.criadoEm).getTime()).toBeGreaterThan(Date.now() - 60_000);
      expect(res.body.historico).toHaveLength(1);
    });

    it('valida campos obrigatórios com mensagens por campo', async () => {
      const res = await ana
        .post('/api/solicitacoes')
        .send({ titulo: 'Oi', descricao: '', categoriaId: 'x' })
        .expect(400);
      const campos = res.body.erros.map((e: { campo: string }) => e.campo);
      expect(campos).toEqual(expect.arrayContaining(['titulo', 'descricao', 'categoriaId']));
    });

    it('não permite forçar campos automáticos (status, solicitante)', async () => {
      const res = await ana
        .post('/api/solicitacoes')
        .send({ ...novaSolicitacao, status: 'CONCLUIDO', solicitanteId: 99 })
        .expect(400);
      expect(res.body.erros).toEqual(
        expect.arrayContaining([{ campo: 'status', mensagem: 'Campo não permitido.' }]),
      );
    });

    it('rejeita categoria inexistente', async () => {
      const res = await ana
        .post('/api/solicitacoes')
        .send({ ...novaSolicitacao, categoriaId: 999 })
        .expect(400);
      expect(res.body.erros[0].campo).toBe('categoriaId');
    });

    it('permite ao solicitante editar a própria solicitação aberta', async () => {
      const res = await ana
        .put(`/api/solicitacoes/${id}`)
        .send({ ...novaSolicitacao, titulo: 'Teclado sem fio travando', categoriaId: 3 })
        .expect(200);
      expect(res.body.titulo).toBe('Teclado sem fio travando');
      expect(res.body.categoria.nome).toBe('Compras');
    });

    it('impede que outro usuário edite ou sequer veja a solicitação', async () => {
      await carlos.get(`/api/solicitacoes/${id}`).expect(404);
      await carlos.put(`/api/solicitacoes/${id}`).send(novaSolicitacao).expect(404);
      await joana.put(`/api/solicitacoes/${id}`).send(novaSolicitacao).expect(403);
    });

    it('permite excluir solicitação aberta', async () => {
      const criada = await ana.post('/api/solicitacoes').send(novaSolicitacao).expect(201);
      await ana.delete(`/api/solicitacoes/${criada.body.id}`).expect(204);
      await ana.get(`/api/solicitacoes/${criada.body.id}`).expect(404);
    });
  });

  describe('3. Gerenciamento de status', () => {
    let id: number;

    beforeAll(async () => {
      const res = await ana.post('/api/solicitacoes').send(novaSolicitacao).expect(201);
      id = res.body.id;
    });

    it('apenas atendentes alteram status', async () => {
      await ana
        .patch(`/api/solicitacoes/${id}/status`)
        .send({ status: 'EM_ATENDIMENTO' })
        .expect(403);
    });

    it('não permite pular etapas (Aberto -> Concluído)', async () => {
      const res = await joana
        .patch(`/api/solicitacoes/${id}/status`)
        .send({ status: 'CONCLUIDO' })
        .expect(409);
      expect(res.body.detail).toMatch(/Aberto para Concluído/);
    });

    it('inicia o atendimento e bloqueia edição/exclusão pelo solicitante', async () => {
      const res = await joana
        .patch(`/api/solicitacoes/${id}/status`)
        .send({ status: 'EM_ATENDIMENTO', observacao: 'Analisando' })
        .expect(200);
      expect(res.body.status).toBe('EM_ATENDIMENTO');
      expect(res.body.permissoes.transicoesPermitidas).toEqual(['CONCLUIDO', 'ABERTO']);

      await ana.put(`/api/solicitacoes/${id}`).send(novaSolicitacao).expect(409);
      await ana.delete(`/api/solicitacoes/${id}`).expect(409);
    });

    it('exige motivo ao devolver para Aberto', async () => {
      const res = await joana
        .patch(`/api/solicitacoes/${id}/status`)
        .send({ status: 'ABERTO' })
        .expect(400);
      expect(res.body.erros[0].campo).toBe('observacao');
    });

    it('conclui, registra data de conclusão e mantém o histórico completo', async () => {
      const res = await joana
        .patch(`/api/solicitacoes/${id}/status`)
        .send({ status: 'CONCLUIDO', observacao: 'Teclado substituído' })
        .expect(200);

      expect(res.body.status).toBe('CONCLUIDO');
      expect(res.body.concluidoEm).not.toBeNull();
      expect(
        res.body.historico.map((h: { statusAnterior: string | null; statusNovo: string }) => [
          h.statusAnterior,
          h.statusNovo,
        ]),
      ).toEqual([
        [null, 'ABERTO'],
        ['ABERTO', 'EM_ATENDIMENTO'],
        ['EM_ATENDIMENTO', 'CONCLUIDO'],
      ]);
      expect(res.body.historico[2].usuario.nome).toBe('Joana Pereira');
    });

    it('trata Concluído como estado final', async () => {
      await joana
        .patch(`/api/solicitacoes/${id}/status`)
        .send({ status: 'ABERTO', observacao: 'Reabrir' })
        .expect(409);
    });

    it('permite ao solicitante consultar detalhes, sem ações de status', async () => {
      const res = await ana.get(`/api/solicitacoes/${id}`).expect(200);
      expect(res.body.permissoes).toEqual({
        podeEditar: false,
        podeExcluir: false,
        transicoesPermitidas: [],
      });
    });
  });

  describe('4. Consulta e filtros', () => {
    it('lista com paginação e os campos exigidos', async () => {
      const res = await joana.get('/api/solicitacoes?tamanho=5').expect(200);
      expect(res.body.itens).toHaveLength(5);
      expect(res.body.totalPaginas).toBeGreaterThan(1);
      expect(Object.keys(res.body.itens[0])).toEqual(
        expect.arrayContaining([
          'codigo',
          'titulo',
          'categoria',
          'solicitante',
          'criadoEm',
          'status',
        ]),
      );
    });

    it('solicitante enxerga somente as próprias solicitações', async () => {
      const res = await carlos.get('/api/solicitacoes?tamanho=50').expect(200);
      expect(res.body.total).toBeGreaterThan(0);
      for (const item of res.body.itens) expect(item.solicitante.nome).toBe('Carlos Lima');
    });

    it('filtra por status e categoria', async () => {
      const res = await joana.get('/api/solicitacoes?status=CONCLUIDO&categoriaId=1').expect(200);
      expect(res.body.total).toBeGreaterThan(0);
      for (const item of res.body.itens) {
        expect(item.status).toBe('CONCLUIDO');
        expect(item.categoria.id).toBe(1);
      }
    });

    it('busca texto livre no título, sem diferenciar maiúsculas', async () => {
      const res = await joana.get('/api/solicitacoes?texto=NOTEBOOK').expect(200);
      expect(res.body.itens.map((i: { titulo: string }) => i.titulo)).toEqual([
        'Notebook não liga após atualização do Windows',
      ]);
    });

    it('trata curingas do SQL como texto literal', async () => {
      const res = await joana.get('/api/solicitacoes?texto=%25').expect(200);
      expect(res.body.total).toBe(0);
    });

    it('encontra pelo código da solicitação', async () => {
      const res = await joana.get('/api/solicitacoes?texto=SOL-000001').expect(200);
      expect(res.body.itens[0].codigo).toBe('SOL-000001');
    });

    it('filtra por período (datas inclusivas)', async () => {
      const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(
        new Date(),
      );
      const res = await joana
        .get(`/api/solicitacoes?dataInicio=${hoje}&dataFim=${hoje}&tamanho=50`)
        .expect(200);
      expect(res.body.total).toBeGreaterThan(0);
      const passado = await joana
        .get('/api/solicitacoes?dataInicio=2000-01-01&dataFim=2000-01-31')
        .expect(200);
      expect(passado.body.total).toBe(0);
    });

    it('valida período invertido e datas inexistentes', async () => {
      const invertido = await joana
        .get('/api/solicitacoes?dataInicio=2026-09-30&dataFim=2026-09-01')
        .expect(400);
      expect(invertido.body.erros[0].campo).toBe('dataFim');
      await joana.get('/api/solicitacoes?dataInicio=2026-02-31').expect(400);
    });
  });

  describe('5. Dashboard', () => {
    it('totaliza por status de forma consistente', async () => {
      const res = await joana.get('/api/dashboard').expect(200);
      const { total, abertas, emAtendimento, concluidas } = res.body.indicadores;
      expect(total).toBe(abertas + emAtendimento + concluidas);
      expect(res.body.porCategoria).toHaveLength(5);
      expect(res.body.evolucao).toHaveLength(14);
      expect(res.body.recentes.length).toBeLessThanOrEqual(5);
    });

    it('restringe os números do solicitante às próprias solicitações', async () => {
      const [geral, proprio] = await Promise.all([
        joana.get('/api/dashboard').expect(200),
        carlos.get('/api/dashboard').expect(200),
      ]);
      const lista = await carlos.get('/api/solicitacoes?tamanho=1').expect(200);
      expect(proprio.body.indicadores.total).toBe(lista.body.total);
      expect(proprio.body.indicadores.total).toBeLessThan(geral.body.indicadores.total);
    });
  });

  describe('Robustez e segurança', () => {
    it('responde erros no formato Problem Details com requestId', async () => {
      const res = await joana.get('/api/solicitacoes/999999').expect(404);
      expect(res.body).toMatchObject({
        status: 404,
        title: 'Recurso não encontrado',
        detail: 'Solicitação não encontrada.',
        requestId: expect.any(String),
      });
      expect(res.headers['x-request-id']).toBe(res.body.requestId);
    });

    it('valida identificadores de rota', async () => {
      await joana.get('/api/solicitacoes/abc').expect(400);
      await joana.get('/api/solicitacoes/0').expect(400);
    });

    it('bloqueia escrita vinda de origem não autorizada (CSRF)', async () => {
      await ana
        .post('/api/solicitacoes')
        .set('Origin', 'https://site-malicioso.com')
        .send(novaSolicitacao)
        .expect(403);
    });

    it('envia cabeçalhos de segurança', async () => {
      const res = await request(app.getHttpServer()).get('/api/health').expect(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });
});
