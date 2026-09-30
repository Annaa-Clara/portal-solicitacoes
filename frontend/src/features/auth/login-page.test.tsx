import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { LoginPage } from './login-page';

const entrar = vi.fn();
vi.mock('./use-auth', () => ({
  useAuth: () => ({
    // função própria (não o spy) para que a rejeição seja tratada só pelo componente
    entrar: async (usuario: string, senha: string) => {
      const resultado = entrar(usuario, senha);
      if (resultado instanceof Error) throw resultado;
      return resultado;
    },
    usuario: null,
    carregando: false,
    sair: vi.fn(),
    saindo: false,
  }),
}));

function renderizar() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => entrar.mockReset());

  it('valida campos obrigatórios sem chamar a API', async () => {
    renderizar();
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Informe o usuário.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
    expect(entrar).not.toHaveBeenCalled();
  });

  it('preenche uma conta de demonstração e autentica', async () => {
    entrar.mockReturnValue({ id: 3, nome: 'Joana Pereira', usuario: 'joana.pereira', perfil: 'ATENDENTE' });
    renderizar();

    await userEvent.click(screen.getByRole('button', { name: /joana pereira/i }));
    await userEvent.click(screen.getByRole('button', { name: /^entrar/i }));

    expect(entrar).toHaveBeenCalledWith('joana.pereira', 'Demo@123');
  });

  it('exibe a mensagem do servidor quando as credenciais são inválidas', async () => {
    entrar.mockReturnValue(
      new ApiError({ title: 'Não autenticado', status: 401, detail: 'Usuário ou senha inválidos.' }),
    );
    renderizar();

    await userEvent.type(screen.getByLabelText('Usuário'), 'ana.souza');
    await userEvent.type(screen.getByLabelText('Senha'), 'errada');
    await userEvent.click(screen.getByRole('button', { name: /^entrar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha inválidos.');
  });
});
