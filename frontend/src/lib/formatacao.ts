const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const diaMes = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

export const formatarDataHora = (iso: string) => dataHora.format(new Date(iso));
export const formatarData = (iso: string) => data.format(new Date(iso));

/** "2026-09-29" -> "29 de set." (data civil, sem conversão de fuso). */
export const formatarDiaCurto = (diaIso: string) =>
  diaMes.format(new Date(`${diaIso}T00:00:00Z`)).replace('.', '');

const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/** "há 3 horas", "ontem", "agora". */
export function formatarRelativo(iso: string, agora = Date.now()): string {
  const segundos = Math.round((new Date(iso).getTime() - agora) / 1000);
  for (const [unidade, tamanho] of UNIDADES) {
    if (Math.abs(segundos) >= tamanho) {
      return relativo.format(Math.round(segundos / tamanho), unidade);
    }
  }
  return 'agora';
}

/** 29.7 -> "1 d 5 h"; 3.2 -> "3,2 h". */
export function formatarDuracaoHoras(horas: number | null): string {
  if (horas === null) return '—';
  if (horas < 24) return `${horas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`;
  const dias = Math.floor(horas / 24);
  const resto = Math.round(horas % 24);
  return resto ? `${dias} d ${resto} h` : `${dias} d`;
}

/** Data de hoje no formato AAAA-MM-DD (fuso local), para inputs type="date". */
export function hojeIso(): string {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
