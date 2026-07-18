import jwt from "jsonwebtoken";
import type { PayloadToken, ServicoToken } from "../aplicacao/portas.js";
import { TokenInvalido } from "../dominio/erros.js";

export class ServicoTokenJwt implements ServicoToken {
  constructor(
    private readonly segredo: string,
    private readonly expiracaoSegundos: number,
  ) {}

  emitir(payload: PayloadToken): string {
    return jwt.sign({ sub: payload.sub, email: payload.email }, this.segredo, {
      expiresIn: this.expiracaoSegundos,
    });
  }

  verificar(token: string): PayloadToken {
    try {
      const decodificado = jwt.verify(token, this.segredo);
      if (
        typeof decodificado === "string" ||
        typeof decodificado.sub !== "string" ||
        typeof decodificado.email !== "string"
      ) {
        throw new TokenInvalido();
      }
      return { sub: decodificado.sub, email: decodificado.email };
    } catch {
      throw new TokenInvalido();
    }
  }
}
