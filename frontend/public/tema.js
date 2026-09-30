// Aplica o tema antes da primeira pintura (evita "flash" de tema claro).
// Arquivo externo (e não script inline) para permitir CSP script-src 'self'.
try {
  var t = localStorage.getItem('tema');
  var escuro = t ? t === 'escuro' : matchMedia('(prefers-color-scheme: dark)').matches;
  if (escuro) document.documentElement.classList.add('dark');
} catch (e) {}
