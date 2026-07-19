import { Router, type RequestHandler } from "express";
import type { EnviarVideo } from "../../aplicacao/enviar-video.js";
import "./tipos.js";

export interface DependenciasVideo {
  enviarVideo: EnviarVideo;
  middlewareAuth: RequestHandler;
  upload: RequestHandler;
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

  return router;
}
