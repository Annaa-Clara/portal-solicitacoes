import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatarDiaCurto } from '@/lib/formatacao';
import type { Dashboard } from '@/types/api';

const SERIES = [
  { chave: 'abertas', rotulo: 'Registradas', cor: '#2563eb' },
  { chave: 'concluidas', rotulo: 'Concluídas', cor: '#10b981' },
] as const;

interface DicaProps {
  active?: boolean;
  label?: string;
  payload?: { dataKey: string; value: number }[];
}

function Dica({ active, label, payload }: DicaProps) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-xl border border-borda bg-superficie px-3 py-2 text-xs shadow-flutuante">
      <p className="mb-1 font-medium">{formatarDiaCurto(label)}</p>
      {SERIES.map((s) => (
        <p key={s.chave} className="flex items-center gap-2 text-suave">
          <span className="h-2 w-2 rounded-full" style={{ background: s.cor }} aria-hidden />
          {s.rotulo}
          <span className="ml-auto pl-3 font-semibold tabular-nums text-texto">
            {payload.find((p) => p.dataKey === s.chave)?.value ?? 0}
          </span>
        </p>
      ))}
    </div>
  );
}

export function GraficoEvolucao({ dados }: { dados: Dashboard['evolucao'] }) {
  const totais = SERIES.map((s) => dados.reduce((soma, d) => soma + d[s.chave], 0));

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1" aria-hidden>
        {SERIES.map((s, i) => (
          <span key={s.chave} className="flex items-center gap-2 text-xs text-suave">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.cor }} />
            {s.rotulo}
            <span className="font-semibold tabular-nums text-texto">{totais[i]}</span>
          </span>
        ))}
      </div>
      <div
        className="h-56"
        role="img"
        aria-label={`Nos últimos ${dados.length} dias: ${totais[0]} solicitações registradas e ${totais[1]} concluídas.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dados} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.chave} id={`grad-${s.chave}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.cor} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.cor} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--borda))" strokeDasharray="3 3" />
            <XAxis
              dataKey="dia"
              tickFormatter={formatarDiaCurto}
              tick={{ fontSize: 11, fill: 'hsl(var(--suave))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--suave))' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<Dica />} cursor={{ stroke: 'hsl(var(--suave))', strokeDasharray: '3 3' }} />
            {SERIES.map((s) => (
              <Area
                key={s.chave}
                type="monotone"
                dataKey={s.chave}
                name={s.rotulo}
                stroke={s.cor}
                strokeWidth={2}
                fill={`url(#grad-${s.chave})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--superficie))' }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
