import { Perfil } from './enums';

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  usuario: string;
  perfil: Perfil;
  sessaoId: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    usuario?: UsuarioAutenticado;
    requestId?: string;
  }
}
