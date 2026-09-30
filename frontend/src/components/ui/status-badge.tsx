import { STATUS } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { Status } from '@/types/api';

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const info = STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        info.classe,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', info.ponto)} aria-hidden />
      {info.rotulo}
    </span>
  );
}
