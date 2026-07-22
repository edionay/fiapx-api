import type { ErrorRequestHandler } from "express";
import { MulterError } from "multer";
import { ValidateError } from "@tsoa/runtime";
import {
  CredenciaisInvalidas,
  DadosInvalidos,
  EmailJaCadastrado,
  PacoteIndisponivel,
  TokenInvalido,
  UsuarioNaoEncontrado,
  VideoNaoEncontrado,
} from "../../dominio/erros.js";

export const tratadorErros: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ValidateError) {
    res.status(400).json({ erro: "Dados inválidos", campos: err.fields });
    return;
  }
  if (err instanceof MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({ erro: err.message });
    return;
  }
  if (err instanceof DadosInvalidos) {
    res.status(400).json({ erro: err.message });
    return;
  }
  if (err instanceof EmailJaCadastrado || err instanceof PacoteIndisponivel) {
    res.status(409).json({ erro: err.message });
    return;
  }
  if (err instanceof CredenciaisInvalidas || err instanceof TokenInvalido) {
    res.status(401).json({ erro: err.message });
    return;
  }
  if (err instanceof VideoNaoEncontrado || err instanceof UsuarioNaoEncontrado) {
    res.status(404).json({ erro: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ erro: "Erro interno" });
};
