import { Transform } from 'class-transformer';

/** Remove espaços nas pontas e normaliza espaços/quebras de linha excessivos. */
export const Aparar = () =>
  Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .replace(/\r\n/g, '\n')
          // eslint-disable-next-line no-control-regex
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
      : value,
  );

/** Converte "" em undefined (útil para parâmetros de filtro opcionais). */
export const VazioParaUndefined = () =>
  Transform(({ value }) => (value === '' || value === null ? undefined : value));
