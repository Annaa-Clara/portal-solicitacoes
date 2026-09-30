import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Perfis, UsuarioAtual } from '../../common/decorators/auth.decorators';
import { Perfil } from '../../common/enums';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { UsuarioAutenticado } from '../../common/types';
import { AlterarStatusDto } from './dto/alterar-status.dto';
import { FiltroSolicitacoesDto } from './dto/filtro-solicitacoes.dto';
import { SalvarSolicitacaoDto } from './dto/salvar-solicitacao.dto';
import { SolicitacaoDetalheDto, SolicitacaoPaginaDto } from './dto/solicitacao-resposta.dto';
import { SolicitacoesService } from './solicitacoes.service';

@ApiTags('Solicitações')
@Controller('solicitacoes')
export class SolicitacoesController {
  constructor(private readonly service: SolicitacoesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista solicitações com filtros e paginação',
    description: 'Solicitantes veem apenas as próprias solicitações; atendentes veem todas.',
  })
  @ApiOkResponse({ type: SolicitacaoPaginaDto })
  @ApiBadRequestResponse({ description: 'Filtro inválido' })
  listar(@Query() filtro: FiltroSolicitacoesDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.listar(filtro, usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha uma solicitação, com histórico e ações permitidas' })
  @ApiOkResponse({ type: SolicitacaoDetalheDto })
  @ApiNotFoundResponse()
  detalhar(@Param('id', ParseIdPipe) id: number, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.detalhar(id, usuario);
  }

  @Post()
  @ApiOperation({ summary: 'Registra uma nova solicitação (status inicial: Aberto)' })
  @ApiCreatedResponse({ type: SolicitacaoDetalheDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  criar(@Body() dto: SalvarSolicitacaoDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.criar(dto, usuario);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edita uma solicitação aberta (apenas o solicitante)' })
  @ApiOkResponse({ type: SolicitacaoDetalheDto })
  @ApiForbiddenResponse({ description: 'Usuário não é o solicitante' })
  @ApiConflictResponse({ description: 'Solicitação não está aberta' })
  atualizar(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: SalvarSolicitacaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.atualizar(id, dto, usuario);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui uma solicitação aberta (apenas o solicitante)' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ description: 'Usuário não é o solicitante' })
  @ApiConflictResponse({ description: 'Solicitação não está aberta' })
  async excluir(
    @Param('id', ParseIdPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<void> {
    await this.service.excluir(id, usuario);
  }

  @Patch(':id/status')
  @Perfis(Perfil.ATENDENTE)
  @ApiOperation({ summary: 'Altera o status seguindo o fluxo permitido (apenas atendentes)' })
  @ApiOkResponse({ type: SolicitacaoDetalheDto })
  @ApiForbiddenResponse({ description: 'Usuário não é atendente' })
  @ApiConflictResponse({ description: 'Transição de status não permitida' })
  alterarStatus(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: AlterarStatusDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.alterarStatus(id, dto, usuario);
  }
}
