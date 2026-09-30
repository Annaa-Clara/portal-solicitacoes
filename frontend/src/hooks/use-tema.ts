import { useCallback, useState } from 'react';

type Tema = 'claro' | 'escuro';

function temaAtual(): Tema {
  return document.documentElement.classList.contains('dark') ? 'escuro' : 'claro';
}

/**
 * Tema claro/escuro. Sem escolha explícita, segue o sistema operacional
 * (aplicado em index.html antes da primeira pintura); a escolha manual é salva.
 */
export function useTema() {
  const [tema, setTema] = useState<Tema>(temaAtual);

  const alternar = useCallback(() => {
    const proximo: Tema = temaAtual() === 'escuro' ? 'claro' : 'escuro';
    document.documentElement.classList.toggle('dark', proximo === 'escuro');
    try {
      localStorage.setItem('tema', proximo);
    } catch {
      /* armazenamento indisponível: o tema vale só para esta sessão */
    }
    setTema(proximo);
  }, []);

  return { tema, alternar };
}
