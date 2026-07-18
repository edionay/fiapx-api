import type { RepositorioUsuario } from "../dominio/repositorio-usuario.js";
import type { Usuario } from "../dominio/usuario.js";
import { DadosInvalidos, EmailJaCadastrado } from "../dominio/erros.js";
import type { GeradorId, HashSenha } from "./portas.js";
import {
  TAMANHO_MINIMO_SENHA,
  ehEmailValido,
  normalizarEmail,
} from "./validacao.js";

export interface EntradaCadastro {
  email: unknown;
  senha: unknown;
}

export interface UsuarioResumo {
  id: string;
  email: string;
}

export class CadastrarUsuario {
  constructor(
    private readonly repositorio: RepositorioUsuario,
    private readonly hashSenha: HashSenha,
    private readonly geradorId: GeradorId,
  ) {}

  async executar(entrada: EntradaCadastro): Promise<UsuarioResumo> {
    const email = normalizarEmail(entrada.email);
    const senha = typeof entrada.senha === "string" ? entrada.senha : "";

    if (!ehEmailValido(email)) {
      throw new DadosInvalidos("E-mail inválido");
    }
    if (senha.length < TAMANHO_MINIMO_SENHA) {
      throw new DadosInvalidos(
        `A senha deve ter ao menos ${TAMANHO_MINIMO_SENHA} caracteres`,
      );
    }

    const existente = await this.repositorio.buscarPorEmail(email);
    if (existente !== null) {
      throw new EmailJaCadastrado(email);
    }

    const usuario: Usuario = {
      id: this.geradorId.gerar(),
      email,
      senhaHash: await this.hashSenha.gerar(senha),
      criadoEm: new Date(),
    };

    await this.repositorio.salvar(usuario);

    return { id: usuario.id, email: usuario.email };
  }
}
