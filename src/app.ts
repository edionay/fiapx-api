import "reflect-metadata";
import express, { type Express } from "express";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { RegisterRoutes } from "./gerado/tsoa/routes.js";
import swaggerDocument from "./gerado/tsoa/swagger.json" with { type: "json" };
import type { RepositorioUsuario } from "./dominio/repositorio-usuario.js";
import type { RepositorioVideo } from "./dominio/repositorio-video.js";
import type { ArmazenamentoVideo } from "./aplicacao/portas.js";
import { RepositorioUsuarioMemoria } from "./adaptadores/repositorio-usuario-memoria.js";
import { RepositorioVideoMemoria } from "./adaptadores/repositorio-video-memoria.js";
import { ArmazenamentoVideoSistemaArquivos } from "./adaptadores/armazenamento-video-fs.js";
import { HashSenhaBcrypt } from "./adaptadores/hash-senha-bcrypt.js";
import { GeradorIdUuid } from "./adaptadores/gerador-id-uuid.js";
import { ServicoTokenJwt } from "./adaptadores/servico-token-jwt.js";
import { CadastrarUsuario } from "./aplicacao/cadastrar-usuario.js";
import { AutenticarUsuario } from "./aplicacao/autenticar-usuario.js";
import { EnviarVideo } from "./aplicacao/enviar-video.js";
import { ListarVideos } from "./aplicacao/listar-videos.js";
import { ConsultarVideo } from "./aplicacao/consultar-video.js";
import { criarMiddlewareAuth } from "./adaptadores/http/middleware-auth.js";
import { rotasVideo } from "./adaptadores/http/rotas-video.js";
import { definirDependencias } from "./adaptadores/http/composicao.js";
import { tratadorErros } from "./adaptadores/http/tratador-erros.js";

export interface OpcoesApp {
  repositorioUsuario?: RepositorioUsuario;
  repositorioVideo?: RepositorioVideo;
  armazenamentoVideo?: ArmazenamentoVideo;
}

export function buildApp(opcoes: OpcoesApp = {}): Express {
  const app = express();

  app.use(express.json());

  const geradorId = new GeradorIdUuid();

  const repositorioUsuario =
    opcoes.repositorioUsuario ?? new RepositorioUsuarioMemoria();
  const hashSenha = new HashSenhaBcrypt();
  const servicoToken = new ServicoTokenJwt(env.jwtSecret, env.jwtExpiracaoSegundos);

  const cadastrar = new CadastrarUsuario(repositorioUsuario, hashSenha, geradorId);
  const autenticar = new AutenticarUsuario(repositorioUsuario, hashSenha, servicoToken);
  const middlewareAuth = criarMiddlewareAuth(servicoToken);

  const repositorioVideo =
    opcoes.repositorioVideo ?? new RepositorioVideoMemoria();
  const armazenamentoVideo =
    opcoes.armazenamentoVideo ??
    new ArmazenamentoVideoSistemaArquivos(env.uploadsDir);
  const enviarVideo = new EnviarVideo(repositorioVideo, armazenamentoVideo, geradorId);
  const listarVideos = new ListarVideos(repositorioVideo);
  const consultarVideo = new ConsultarVideo(repositorioVideo);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.maxUploadBytes },
  }).single("arquivo");

  definirDependencias({
    cadastrarUsuario: cadastrar,
    autenticarUsuario: autenticar,
    repositorioUsuario,
  });

  app.get("/swagger.json", (_req, res) => {
    res.json(swaggerDocument);
  });
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  RegisterRoutes(app);

  app.use(
    rotasVideo({
      enviarVideo,
      listarVideos,
      consultarVideo,
      middlewareAuth,
      upload,
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
  });

  app.use(tratadorErros);

  return app;
}
