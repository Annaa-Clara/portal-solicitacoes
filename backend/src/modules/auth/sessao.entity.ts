import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Entity({ name: 'sessao' })
export class Sessao {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'bigint' })
  usuarioId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'token_hash', type: 'char', length: 64 })
  tokenHash: string;

  @Column({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @Column({ name: 'ultimo_acesso_em', type: 'timestamptz' })
  ultimoAcessoEm: Date;

  @Column({ name: 'expira_em', type: 'timestamptz' })
  expiraEm: Date;

  @Column({ name: 'revogada_em', type: 'timestamptz', nullable: true })
  revogadaEm: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;
}
