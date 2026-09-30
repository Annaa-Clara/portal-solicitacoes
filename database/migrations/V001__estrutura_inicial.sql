-- =============================================================================
-- Portal de Solicitações Internas
-- V001 - Estrutura inicial do banco de dados (PostgreSQL 16)
-- =============================================================================
-- Este script cria todas as tabelas, restrições e índices do sistema.
-- Ele é executado automaticamente pelo backend na inicialização (runner de
-- migrations próprio, controlado pela tabela schema_migrations), mas também
-- pode ser executado manualmente:
--   psql -U portal -d portal_solicitacoes -f database/migrations/V001__estrutura_inicial.sql
-- =============================================================================

-- Extensão para busca textual eficiente (ILIKE '%termo%') no título.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- usuario: pessoas que acessam o portal
-- -----------------------------------------------------------------------------
CREATE TABLE usuario (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome           VARCHAR(120) NOT NULL,
    usuario        VARCHAR(50)  NOT NULL,
    senha_hash     VARCHAR(72)  NOT NULL,
    perfil         VARCHAR(20)  NOT NULL,
    ativo          BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_usuario_usuario UNIQUE (usuario),
    CONSTRAINT ck_usuario_perfil  CHECK (perfil IN ('SOLICITANTE', 'ATENDENTE')),
    CONSTRAINT ck_usuario_login   CHECK (usuario = LOWER(usuario))
);

COMMENT ON TABLE  usuario            IS 'Usuários autorizados a acessar o portal.';
COMMENT ON COLUMN usuario.usuario    IS 'Login do usuário (sempre em minúsculas).';
COMMENT ON COLUMN usuario.senha_hash IS 'Hash bcrypt da senha. A senha em texto puro nunca é armazenada.';
COMMENT ON COLUMN usuario.perfil     IS 'SOLICITANTE registra demandas; ATENDENTE gerencia o atendimento.';

-- -----------------------------------------------------------------------------
-- sessao: controle de sessão server-side (permite logout real e revogação)
-- -----------------------------------------------------------------------------
CREATE TABLE sessao (
    id               UUID         PRIMARY KEY,
    usuario_id       BIGINT       NOT NULL,
    token_hash       CHAR(64)     NOT NULL,
    criado_em        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ultimo_acesso_em TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expira_em        TIMESTAMPTZ  NOT NULL,
    revogada_em      TIMESTAMPTZ,
    ip               VARCHAR(45),
    user_agent       VARCHAR(255),
    CONSTRAINT uk_sessao_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_sessao_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE INDEX ix_sessao_usuario ON sessao (usuario_id);

COMMENT ON TABLE  sessao            IS 'Sessões autenticadas. O token só existe no cookie do navegador; aqui fica apenas seu hash SHA-256.';
COMMENT ON COLUMN sessao.expira_em  IS 'Expiração deslizante: renovada enquanto houver atividade, limitada a uma duração máxima.';
COMMENT ON COLUMN sessao.revogada_em IS 'Preenchido no logout. Sessão revogada nunca volta a ser aceita.';

-- -----------------------------------------------------------------------------
-- categoria: áreas responsáveis pelas solicitações
-- -----------------------------------------------------------------------------
CREATE TABLE categoria (
    id         SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome       VARCHAR(40)  NOT NULL,
    descricao  VARCHAR(160),
    ativa      BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_categoria_nome UNIQUE (nome)
);

COMMENT ON TABLE categoria IS 'Categorias de solicitação (TI, RH, Compras...). Tabela em vez de enum para permitir inclusão sem alterar código.';

-- -----------------------------------------------------------------------------
-- solicitacao: demanda interna registrada por um colaborador
-- -----------------------------------------------------------------------------
CREATE TABLE solicitacao (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo          VARCHAR(120)  NOT NULL,
    descricao       VARCHAR(2000) NOT NULL,
    categoria_id    SMALLINT      NOT NULL,
    solicitante_id  BIGINT        NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'ABERTO',
    criado_em       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    concluido_em    TIMESTAMPTZ,
    CONSTRAINT ck_solicitacao_status CHECK (status IN ('ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO')),
    CONSTRAINT ck_solicitacao_titulo CHECK (LENGTH(TRIM(titulo)) >= 5),
    CONSTRAINT ck_solicitacao_conclusao CHECK (
        (status = 'CONCLUIDO' AND concluido_em IS NOT NULL) OR
        (status <> 'CONCLUIDO' AND concluido_em IS NULL)
    ),
    CONSTRAINT fk_solicitacao_categoria FOREIGN KEY (categoria_id)
        REFERENCES categoria (id),
    CONSTRAINT fk_solicitacao_solicitante FOREIGN KEY (solicitante_id)
        REFERENCES usuario (id)
);

-- Índices alinhados aos filtros da tela de consulta
CREATE INDEX ix_solicitacao_status      ON solicitacao (status);
CREATE INDEX ix_solicitacao_categoria   ON solicitacao (categoria_id);
CREATE INDEX ix_solicitacao_solicitante ON solicitacao (solicitante_id);
CREATE INDEX ix_solicitacao_criado_em   ON solicitacao (criado_em DESC);
CREATE INDEX ix_solicitacao_titulo_trgm ON solicitacao USING GIN (titulo gin_trgm_ops);

COMMENT ON TABLE  solicitacao              IS 'Solicitações internas registradas pelos colaboradores.';
COMMENT ON COLUMN solicitacao.id           IS 'Identificador. Exibido ao usuário como código no formato SOL-000001.';
COMMENT ON COLUMN solicitacao.status       IS 'ABERTO -> EM_ATENDIMENTO -> CONCLUIDO (regras de transição no backend).';
COMMENT ON COLUMN solicitacao.concluido_em IS 'Momento da conclusão; usado no indicador de tempo médio de atendimento.';

-- -----------------------------------------------------------------------------
-- historico_status: trilha de auditoria da evolução de cada solicitação
-- -----------------------------------------------------------------------------
CREATE TABLE historico_status (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitacao_id   BIGINT       NOT NULL,
    status_anterior  VARCHAR(20),
    status_novo      VARCHAR(20)  NOT NULL,
    usuario_id       BIGINT       NOT NULL,
    observacao       VARCHAR(500),
    criado_em        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_historico_status_anterior CHECK (status_anterior IN ('ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO')),
    CONSTRAINT ck_historico_status_novo     CHECK (status_novo     IN ('ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO')),
    CONSTRAINT fk_historico_solicitacao FOREIGN KEY (solicitacao_id)
        REFERENCES solicitacao (id) ON DELETE CASCADE,
    CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario (id)
);

CREATE INDEX ix_historico_solicitacao ON historico_status (solicitacao_id, criado_em);

COMMENT ON TABLE  historico_status                 IS 'Linha do tempo de cada solicitação: criação e cada mudança de status.';
COMMENT ON COLUMN historico_status.status_anterior IS 'Nulo no registro de criação da solicitação.';
