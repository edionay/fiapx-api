import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ServicoToken } from "../../aplicacao/portas.js";
import { TokenInvalido } from "../../dominio/erros.js";
import "./tipos.js";

export function criarMiddlewareAuth(servicoToken: ServicoToken): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const cabecalho = req.header("authorization") ?? "";
    const [esquema, token] = cabecalho.split(" ");

    if (esquema !== "Bearer" || token === undefined || token.trim() === "") {
      next(new TokenInvalido());
      return;
    }

    const payload = servicoToken.verificar(token.trim());
    req.usuario = { id: payload.sub, email: payload.email };
    next();
  };
}
