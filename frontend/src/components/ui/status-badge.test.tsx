import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it.each([
    ['ABERTO', 'Aberto'],
    ['EM_ATENDIMENTO', 'Em Atendimento'],
    ['CONCLUIDO', 'Concluído'],
  ] as const)('exibe o rótulo em texto para %s (a cor nunca é a única pista)', (status, rotulo) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(rotulo)).toBeInTheDocument();
  });
});
