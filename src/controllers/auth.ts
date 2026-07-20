import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "@tsoa/runtime";
import { inject, injectable } from "tsyringe";
import type { Request as ExRequest } from "express";
import type { CadastrarUsuario } from "../aplicacao/cadastrar-usuario.js";
import type { AutenticarUsuario } from "../aplicacao/autenticar-usuario.js";
import type { RepositorioUsuario } from "../dominio/repositorio-usuario.js";
import { UsuarioNaoEncontrado } from "../dominio/erros.js";
import { TOKENS } from "../adaptadores/http/tokens.js";
import type { UsuarioAutenticado } from "../adaptadores/http/tipos.js";

export interface CadastroBody {
  email: string;
  senha: string;
}

export interface LoginBody {
  email: string;
  senha: string;
}

export interface UsuarioResumo {
  id: string;
  email: string;
}

export interface LoginResposta {
  token: string;
}

export interface EuResposta {
  id: string;
  email: string;
  criadoEm: string;
}

@injectable()
@Route("auth")
@Tags("Autenticação")
export class AuthController extends Controller {
  constructor(
    @inject(TOKENS.CadastrarUsuario) private readonly cadastrarUsuario: CadastrarUsuario,
    @inject(TOKENS.AutenticarUsuario) private readonly autenticarUsuario: AutenticarUsuario,
    @inject(TOKENS.RepositorioUsuario) private readonly repositorioUsuario: RepositorioUsuario,
  ) {
    super();
  }

  @Post("cadastro")
  @SuccessResponse(201)
  public async cadastro(@Body() corpo: CadastroBody): Promise<UsuarioResumo> {
    const resultado = await this.cadastrarUsuario.executar({
      email: corpo.email,
      senha: corpo.senha,
    });
    this.setStatus(201);
    return resultado;
  }

  @Post("login")
  public async login(@Body() corpo: LoginBody): Promise<LoginResposta> {
    return this.autenticarUsuario.executar({
      email: corpo.email,
      senha: corpo.senha,
    });
  }

  @Get("eu")
  @Security("jwt")
  public async eu(@Request() request: ExRequest): Promise<EuResposta> {
    const autenticado = request.user as UsuarioAutenticado;
    const usuario = await this.repositorioUsuario.buscarPorId(autenticado.id);
    if (usuario === null) {
      throw new UsuarioNaoEncontrado();
    }
    return {
      id: usuario.id,
      email: usuario.email,
      criadoEm: usuario.criadoEm.toISOString(),
    };
  }
}
