-- =============================================================================
-- V003 - Solicitações de demonstração
-- =============================================================================
-- Popula o portal com solicitações em todos os status, com datas relativas à
-- data de instalação, para que o dashboard e os filtros tenham dados reais
-- logo na primeira execução. Cada solicitação recebe seu histórico coerente.
-- =============================================================================

DO $$
DECLARE
    r            RECORD;
    v_id         BIGINT;
    v_criado     TIMESTAMPTZ;
    v_inicio     TIMESTAMPTZ;
    v_fim        TIMESTAMPTZ;
    v_atendente  BIGINT := (SELECT id FROM usuario WHERE usuario = 'joana.pereira');
BEGIN
    FOR r IN
        SELECT * FROM (VALUES
            ('Notebook não liga após atualização do Windows'::TEXT,
             'Desde a atualização de ontem o notebook fica na tela preta após o logo. Já tentei reiniciar e desconectar da energia.'::TEXT,
             'TI'::TEXT, 'ana.souza'::TEXT, 'CONCLUIDO'::TEXT, 26, 2, 5,
             'Equipamento recolhido para diagnóstico.'::TEXT, 'Driver de vídeo revertido. Equipamento devolvido funcionando.'::TEXT),
            ('Acesso à pasta compartilhada do Financeiro',
             'Preciso de acesso de leitura à pasta \\servidor\financeiro\relatorios para consolidar o fechamento mensal.',
             'TI', 'carlos.lima', 'CONCLUIDO', 21, 1, 3,
             'Validando autorização com a gestora da área.', 'Acesso concedido após aprovação da gestora.'),
            ('Solicitação de férias para dezembro',
             'Gostaria de confirmar o saldo de férias e agendar 15 dias a partir de 15/12.',
             'RH', 'ana.souza', 'CONCLUIDO', 18, 20, 28,
             'Conferindo saldo no sistema de folha.', 'Férias agendadas e aviso emitido.'),
            ('Compra de monitores para o time de suporte',
             'O time de suporte precisa de 4 monitores de 24" para uso com dois monitores por estação.',
             'Compras', 'carlos.lima', 'CONCLUIDO', 16, 6, 70,
             'Cotação solicitada a três fornecedores.', 'Pedido de compra emitido. Previsão de entrega em 10 dias.'),
            ('Reembolso de despesa com deslocamento',
             'Reembolso de táxi referente à visita ao cliente em Campina Grande. Nota fiscal anexada ao e-mail.',
             'Financeiro', 'ana.souza', 'CONCLUIDO', 12, 4, 30,
             'Conferindo comprovantes.', 'Reembolso aprovado e programado para o próximo pagamento.'),
            ('Ar-condicionado da sala 3 com vazamento',
             'O aparelho da sala de reuniões 3 está pingando água sobre a mesa.',
             'Infraestrutura', 'carlos.lima', 'CONCLUIDO', 9, 1, 8,
             'Técnico de manutenção acionado.', 'Dreno desobstruído e aparelho higienizado.'),
            ('Instalação do software de modelagem de dados',
             'Preciso do DBeaver instalado na minha estação para atividades de análise.',
             'TI', 'ana.souza', 'EM_ATENDIMENTO', 6, 3, 0,
             'Aguardando janela de manutenção para instalação.', NULL),
            ('Atualização de dados bancários para pagamento',
             'Troquei de banco e preciso atualizar a conta de recebimento de salário.',
             'RH', 'carlos.lima', 'EM_ATENDIMENTO', 5, 5, 0,
             'Documentação recebida, em conferência.', NULL),
            ('Cadeira ergonômica para estação 12',
             'A cadeira atual está com o mecanismo de altura quebrado.',
             'Compras', 'ana.souza', 'EM_ATENDIMENTO', 4, 8, 0,
             'Verificando disponibilidade em estoque antes de comprar.', NULL),
            ('Lâmpadas queimadas no corredor do 2º andar',
             'Três lâmpadas do corredor próximo às escadas estão queimadas, deixando o local escuro à noite.',
             'Infraestrutura', 'ana.souza', 'EM_ATENDIMENTO', 2, 2, 0,
             'Material separado para a troca.', NULL),
            ('VPN desconectando a cada 10 minutos',
             'Trabalhando em campo, a VPN cai com frequência e perco o acesso ao ERP.',
             'TI', 'carlos.lima', 'ABERTO', 3, 0, 0, NULL, NULL),
            ('Segunda via do informe de rendimentos',
             'Preciso da segunda via do informe de rendimentos do ano anterior.',
             'Financeiro', 'carlos.lima', 'ABERTO', 2, 0, 0, NULL, NULL),
            ('Declaração de vínculo empregatício',
             'Solicito declaração de vínculo para apresentação em financiamento imobiliário.',
             'RH', 'ana.souza', 'ABERTO', 1, 0, 0, NULL, NULL),
            ('Headset com defeito no microfone',
             'O microfone do headset não é reconhecido nas chamadas de vídeo.',
             'TI', 'ana.souza', 'ABERTO', 0, 0, 0, NULL, NULL)
        ) AS t(titulo, descricao, categoria, solicitante, status, dias, h_atend, h_concl, obs_atend, obs_concl)
    LOOP
        v_criado := date_trunc('minute', NOW())
                    - make_interval(days => r.dias)
                    - make_interval(hours => (r.dias * 7) % 5 + 1);
        v_inicio := CASE WHEN r.status IN ('EM_ATENDIMENTO', 'CONCLUIDO')
                         THEN v_criado + make_interval(hours => r.h_atend) END;
        v_fim    := CASE WHEN r.status = 'CONCLUIDO'
                         THEN v_inicio + make_interval(hours => r.h_concl) END;

        INSERT INTO solicitacao (titulo, descricao, categoria_id, solicitante_id, status,
                                 criado_em, atualizado_em, concluido_em)
        VALUES (r.titulo, r.descricao,
                (SELECT id FROM categoria WHERE nome = r.categoria),
                (SELECT id FROM usuario  WHERE usuario = r.solicitante),
                r.status, v_criado, COALESCE(v_fim, v_inicio, v_criado), v_fim)
        RETURNING id INTO v_id;

        INSERT INTO historico_status (solicitacao_id, status_anterior, status_novo, usuario_id, observacao, criado_em)
        VALUES (v_id, NULL, 'ABERTO', (SELECT id FROM usuario WHERE usuario = r.solicitante),
                'Solicitação registrada.', v_criado);

        IF v_inicio IS NOT NULL THEN
            INSERT INTO historico_status (solicitacao_id, status_anterior, status_novo, usuario_id, observacao, criado_em)
            VALUES (v_id, 'ABERTO', 'EM_ATENDIMENTO', v_atendente, r.obs_atend, v_inicio);
        END IF;

        IF v_fim IS NOT NULL THEN
            INSERT INTO historico_status (solicitacao_id, status_anterior, status_novo, usuario_id, observacao, criado_em)
            VALUES (v_id, 'EM_ATENDIMENTO', 'CONCLUIDO', v_atendente, r.obs_concl, v_fim);
        END IF;
    END LOOP;
END $$;
