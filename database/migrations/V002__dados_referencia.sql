-- =============================================================================
-- V002 - Dados de referência: categorias e usuários de demonstração
-- =============================================================================
-- Senha de todos os usuários de demonstração: Demo@123 (hash bcrypt, custo 10)
-- Em produção, estes usuários NÃO devem existir (ver Memorial Técnico).
-- =============================================================================

INSERT INTO categoria (nome, descricao) VALUES
    ('TI',             'Equipamentos, acessos, sistemas e suporte técnico'),
    ('RH',             'Férias, benefícios, documentos e questões de pessoal'),
    ('Compras',        'Aquisição de materiais, equipamentos e serviços'),
    ('Financeiro',     'Reembolsos, pagamentos e notas fiscais'),
    ('Infraestrutura', 'Manutenção predial, mobiliário, limpeza e segurança');

INSERT INTO usuario (nome, usuario, senha_hash, perfil) VALUES
    ('Ana Souza',    'ana.souza',   '$2b$10$GVjMI3sLRTCFmSkh8p7/PekR17f9OUWplmP34Fklf3Tqpn13Lcwvu', 'SOLICITANTE'),
    ('Carlos Lima',  'carlos.lima', '$2b$10$GVjMI3sLRTCFmSkh8p7/PekR17f9OUWplmP34Fklf3Tqpn13Lcwvu', 'SOLICITANTE'),
    ('Joana Pereira','joana.pereira','$2b$10$GVjMI3sLRTCFmSkh8p7/PekR17f9OUWplmP34Fklf3Tqpn13Lcwvu', 'ATENDENTE');
