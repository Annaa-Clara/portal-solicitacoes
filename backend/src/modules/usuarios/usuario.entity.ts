import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Perfil } from '../../common/enums';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn('identity', { type: 'bigint', generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ length: 120 })
  nome: string;

  @Column({ length: 50, unique: true })
  usuario: string;

  @Column({ name: 'senha_hash', length: 72, select: false })
  senhaHash: string;

  @Column({ type: 'varchar', length: 20 })
  perfil: Perfil;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
