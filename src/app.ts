import "reflect-metadata";
import express, { type Express } from "express";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import { container } from "tsyringe";
import { env } from "./config/env.js";
import { RegisterRoutes } from "./gerado/tsoa/routes.js";
import swaggerDocument from "./gerado/tsoa/swagger.json" with { type: "json" };
import type { RepositorioUsuario } from "./dominio/repositorio-usuario.js";
import type { RepositorioVideo } from "./dominio/repositorio-video.js";
import type { ArmazenamentoVideo, PublicadorProcessamento } from "./aplicacao/portas.js";
import { RepositorioUsuarioMemoria } from "./adaptadores/repositorio-usuario-memoria.js";
import { RepositorioVideoMemoria } from "./adaptadores/repositorio-video-memoria.js";
import { ArmazenamentoVideoSistemaArquivos } from "./adaptadores/armazenamento-video-fs.js";
import { PublicadorProcessamentoNulo } from "./adaptadores/mensageria/publicador-processamento-nulo.js";
import { HashSenhaBcrypt } from "./adaptadores/hash-senha-bcrypt.js";
import { GeradorIdUuid } from "./adaptadores/gerador-id-uuid.js";
import { ServicoTokenJwt } from "./adaptadores/servico-token-jwt.js";
import { CadastrarUsuario } from "./aplicacao/cadastrar-usuario.js";
import { AutenticarUsuario } from "./aplicacao/autenticar-usuario.js";
import { EnviarVideo } from "./aplicacao/enviar-video.js";
import { ListarVideos } from "./aplicacao/listar-videos.js";
import { ConsultarVideo } from "./aplicacao/consultar-video.js";
import { BaixarVideo } from "./aplicacao/baixar-video.js";
import { TOKENS } from "./adaptadores/http/tokens.js";
import { tratadorErros } from "./adaptadores/http/tratador-erros.js";
import { criarMetricas } from "./adaptadores/http/metricas.js";

export interface OpcoesApp {
  repositorioUsuario?: RepositorioUsuario;
  repositorioVideo?: RepositorioVideo;
  armazenamentoVideo?: ArmazenamentoVideo;
  publicadorProcessamento?: PublicadorProcessamento;
}

export function buildApp(opcoes: OpcoesApp = {}): Express {
  const app = express();

  const metricas = criarMetricas();
  app.use(metricas.middleware);

  app.use(express.json());

  const geradorId = new GeradorIdUuid();

  const repositorioUsuario =
    opcoes.repositorioUsuario ?? new RepositorioUsuarioMemoria();
  const hashSenha = new HashSenhaBcrypt();
  const servicoToken = new ServicoTokenJwt(env.jwtSecret, env.jwtExpiracaoSegundos);

  const cadastrar = new CadastrarUsuario(repositorioUsuario, hashSenha, geradorId);
  const autenticar = new AutenticarUsuario(repositorioUsuario, hashSenha, servicoToken);

  const repositorioVideo =
    opcoes.repositorioVideo ?? new RepositorioVideoMemoria();
  const armazenamentoVideo =
    opcoes.armazenamentoVideo ??
    new ArmazenamentoVideoSistemaArquivos(env.uploadsDir);
  const publicadorProcessamento =
    opcoes.publicadorProcessamento ?? new PublicadorProcessamentoNulo();
  const enviarVideo = new EnviarVideo(
    repositorioVideo,
    armazenamentoVideo,
    geradorId,
    publicadorProcessamento,
  );
  const listarVideos = new ListarVideos(repositorioVideo);
  const consultarVideo = new ConsultarVideo(repositorioVideo);
  const baixarVideo = new BaixarVideo(repositorioVideo);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.maxUploadBytes },
  });

  container.reset();
  container.registerInstance(TOKENS.CadastrarUsuario, cadastrar);
  container.registerInstance(TOKENS.AutenticarUsuario, autenticar);
  container.registerInstance(TOKENS.RepositorioUsuario, repositorioUsuario);
  container.registerInstance(TOKENS.EnviarVideo, enviarVideo);
  container.registerInstance(TOKENS.ListarVideos, listarVideos);
  container.registerInstance(TOKENS.ConsultarVideo, consultarVideo);
  container.registerInstance(TOKENS.BaixarVideo, baixarVideo);

  app.use((req, _res, next) => {
    if (req.files === undefined) {
      req.files = {};
    }
    next();
  });

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", metricas.registro.contentType);
    res.send(await metricas.registro.metrics());
  });

  app.get("/swagger.json", (_req, res) => {
    res.json(swaggerDocument);
  });
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  RegisterRoutes(app, { multer: upload });

  app.use((_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
  });

  app.use(tratadorErros);

  return app;
}
