import type { Request } from "express";
import { env } from "../../config/env.js";
import { TokenInvalido } from "../../dominio/erros.js";
import { ServicoTokenJwt } from "../servico-token-jwt.js";
import type { UsuarioAutenticado } from "./tipos.js";

const servicoToken = new ServicoTokenJwt(env.jwtSecret, env.jwtExpiracaoSegundos);

export async function expressAuthentication(
  request: Request,
  securityName: string,
  _scopes?: string[],
): Promise<UsuarioAutenticado> {
  if (securityName !== "jwt") {
    throw new TokenInvalido();
  }

  const cabecalho = request.header("authorization") ?? "";
  const [esquema, token] = cabecalho.split(" ");

  if (esquema !== "Bearer" || token === undefined || token.trim() === "") {
    throw new TokenInvalido();
  }

  const payload = servicoToken.verificar(token.trim());
  return { id: payload.sub, email: payload.email };
}
