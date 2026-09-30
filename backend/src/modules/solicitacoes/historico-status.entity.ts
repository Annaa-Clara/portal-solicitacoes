import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusSolicitacao } from '../../common/enums';
import { Usuario } from '../usuarios/usuario.entity';
import { Solicitacao } from './solicitacao.entity';

@Entity({ name: 'historico_status' })
export class HistoricoStatus {
  @PrimaryGeneratedColumn('identity', { type: 'bigint', generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ name: 'solicitacao_id', type: 'bigint' })
  solicitacaoId: number;

  @ManyToOne(() => Solicitacao, (s) => s.historico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitacao_id' })
  solicitacao: Solicitacao;

  @Column({ name: 'status_anterior', type: 'varchar', length: 20, nullable: true })
  statusAnterior: StatusSolicitacao | null;

  @Column({ name: 'status_novo', type: 'varchar', length: 20 })
  statusNovo: StatusSolicitacao;

  @Column({ name: 'usuario_id', type: 'bigint' })
  usuarioId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observacao: string | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;
}
