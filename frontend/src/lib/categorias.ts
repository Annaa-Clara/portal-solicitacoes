import { Building2, Monitor, ShoppingCart, Tag, Users, Wallet, type LucideIcon } from 'lucide-react';

const ICONES: Record<string, LucideIcon> = {
  TI: Monitor,
  RH: Users,
  Compras: ShoppingCart,
  Financeiro: Wallet,
  Infraestrutura: Building2,
};

/** Ícone da categoria; categorias novas (cadastradas no banco) recebem um ícone genérico. */
export const iconeCategoria = (nome: string): LucideIcon => ICONES[nome] ?? Tag;
