import type { RepositorioUsuario } from "../dominio/repositorio-usuario.js";
import { CredenciaisInvalidas } from "../dominio/erros.js";
import type { HashSenha, ServicoToken } from "./portas.js";
import { normalizarEmail } from "./validacao.js";

export interface EntradaLogin {
  email: unknown;
  senha: unknown;
}

export interface ResultadoLogin {
  token: string;
}

export class AutenticarUsuario {
  constructor(
    private readonly repositorio: RepositorioUsuario,
    private readonly hashSenha: HashSenha,
    private readonly servicoToken: ServicoToken,
  ) {}

  async executar(entrada: EntradaLogin): Promise<ResultadoLogin> {
    const email = normalizarEmail(entrada.email);
    const senha = typeof entrada.senha === "string" ? entrada.senha : "";

    const usuario = await this.repositorio.buscarPorEmail(email);
    if (usuario === null) {
      throw new CredenciaisInvalidas();
    }

    const confere = await this.hashSenha.conferir(senha, usuario.senhaHash);
    if (!confere) {
      throw new CredenciaisInvalidas();
    }

    const token = this.servicoToken.emitir({
      sub: usuario.id,
      email: usuario.email,
    });

    return { token };
  }
}
