import { Router, type RequestHandler } from "express";
import type { EnviarVideo } from "../../aplicacao/enviar-video.js";
import type { ListarVideos } from "../../aplicacao/listar-videos.js";
import type { ConsultarVideo } from "../../aplicacao/consultar-video.js";
import type { Video } from "../../dominio/video.js";
import "./tipos.js";

export interface DependenciasVideo {
  enviarVideo: EnviarVideo;
  listarVideos: ListarVideos;
  consultarVideo: ConsultarVideo;
  middlewareAuth: RequestHandler;
  upload: RequestHandler;
}

function paraResposta(video: Video) {
  return {
    id: video.id,
    nomeOriginal: video.nomeOriginal,
    status: video.status,
    mensagemErro: video.mensagemErro,
    criadoEm: video.criadoEm.toISOString(),
    atualizadoEm: video.atualizadoEm.toISOString(),
  };
}

export function rotasVideo(deps: DependenciasVideo): Router {
  const router = Router();

  router.post("/videos", deps.middlewareAuth, deps.upload, async (req, res) => {
    const arquivo = req.file;
    const resultado = await deps.enviarVideo.executar({
      usuarioId: req.usuario!.id,
      nomeOriginal: arquivo?.originalname,
      conteudo: arquivo?.buffer,
    });
    res.status(202).json(resultado);
  });

  router.get("/videos", deps.middlewareAuth, async (req, res) => {
    const videos = await deps.listarVideos.executar(req.usuario!.id);
    res.json(videos.map(paraResposta));
  });

  router.get("/videos/:id", deps.middlewareAuth, async (req, res) => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const video = await deps.consultarVideo.executar(req.usuario!.id, id);
    res.json(paraResposta(video));
  });

  return router;
}
