import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './categoria.entity';
import { CategoriaDto } from './categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(@InjectRepository(Categoria) private readonly categorias: Repository<Categoria>) {}

  async listarAtivas(): Promise<CategoriaDto[]> {
    const lista = await this.categorias.find({ where: { ativa: true }, order: { nome: 'ASC' } });
    return lista.map(({ id, nome, descricao }) => ({ id, nome, descricao }));
  }

  async buscarAtiva(id: number): Promise<Categoria | null> {
    return this.categorias.findOne({ where: { id, ativa: true } });
  }
}
