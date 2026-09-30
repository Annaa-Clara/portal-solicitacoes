import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusSolicitacao } from '../../common/enums';
import { Categoria } from '../categorias/categoria.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { HistoricoStatus } from './historico-status.entity';

@Entity({ name: 'solicitacao' })
export class Solicitacao {
  @PrimaryGeneratedColumn('identity', { type: 'bigint', generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ length: 120 })
  titulo: string;

  @Column({ length: 2000 })
  descricao: string;

  @Column({ name: 'categoria_id', type: 'smallint' })
  categoriaId: number;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @Column({ name: 'solicitante_id', type: 'bigint' })
  solicitanteId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'solicitante_id' })
  solicitante: Usuario;

  @Column({ type: 'varchar', length: 20, default: StatusSolicitacao.ABERTO })
  status: StatusSolicitacao;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;

  @Column({ name: 'concluido_em', type: 'timestamptz', nullable: true })
  concluidoEm: Date | null;

  @OneToMany(() => HistoricoStatus, (h) => h.solicitacao)
  historico: HistoricoStatus[];
}
