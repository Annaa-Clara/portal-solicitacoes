import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'categoria' })
export class Categoria {
  @PrimaryGeneratedColumn('identity', { type: 'smallint', generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ length: 40, unique: true })
  nome: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  descricao: string | null;

  @Column({ default: true })
  ativa: boolean;
}
