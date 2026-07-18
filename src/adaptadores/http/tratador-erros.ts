import type { ErrorRequestHandler } from "express";
import {
  CredenciaisInvalidas,
  DadosInvalidos,
  EmailJaCadastrado,
  TokenInvalido,
} from "../../dominio/erros.js";

export const tratadorErros: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof DadosInvalidos) {
    res.status(400).json({ erro: err.message });
    return;
  }
  if (err instanceof EmailJaCadastrado) {
    res.status(409).json({ erro: err.message });
    return;
  }
  if (err instanceof CredenciaisInvalidas || err instanceof TokenInvalido) {
    res.status(401).json({ erro: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ erro: "Erro interno" });
};
