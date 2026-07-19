import express, { type Express } from "express";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import type { RepositorioUsuario } from "./dominio/repositorio-usuario.js";
import { RepositorioUsuarioMemoria } from "./adaptadores/repositorio-usuario-memoria.js";
import { HashSenhaBcrypt } from "./adaptadores/hash-senha-bcrypt.js";
import { GeradorIdUuid } from "./adaptadores/gerador-id-uuid.js";
import { ServicoTokenJwt } from "./adaptadores/servico-token-jwt.js";
import { CadastrarUsuario } from "./aplicacao/cadastrar-usuario.js";
import { AutenticarUsuario } from "./aplicacao/autenticar-usuario.js";
import { criarMiddlewareAuth } from "./adaptadores/http/middleware-auth.js";
import { rotasAuth } from "./adaptadores/http/rotas-auth.js";
import { tratadorErros } from "./adaptadores/http/tratador-erros.js";

export interface OpcoesApp {
  repositorioUsuario?: RepositorioUsuario;
}

export function buildApp(opcoes: OpcoesApp = {}): Express {
  const app = express();

  app.use(express.json());

  const repositorioUsuario =
    opcoes.repositorioUsuario ?? new RepositorioUsuarioMemoria();
  const hashSenha = new HashSenhaBcrypt();
  const geradorId = new GeradorIdUuid();
  const servicoToken = new ServicoTokenJwt(env.jwtSecret, env.jwtExpiracaoSegundos);

  const cadastrar = new CadastrarUsuario(repositorioUsuario, hashSenha, geradorId);
  const autenticar = new AutenticarUsuario(repositorioUsuario, hashSenha, servicoToken);
  const middlewareAuth = criarMiddlewareAuth(servicoToken);

  app.use(healthRouter);
  app.use(
    rotasAuth({
      cadastrar,
      autenticar,
      middlewareAuth,
      repositorio: repositorioUsuario,
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
  });

  app.use(tratadorErros);

  return app;
}
