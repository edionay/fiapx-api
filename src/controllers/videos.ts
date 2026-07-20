import {
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
  UploadedFile,
} from "@tsoa/runtime";
import { inject, injectable } from "tsyringe";
import type { Request as ExRequest } from "express";
import type { EnviarVideo } from "../aplicacao/enviar-video.js";
import type { ListarVideos } from "../aplicacao/listar-videos.js";
import type { ConsultarVideo } from "../aplicacao/consultar-video.js";
import type { Video } from "../dominio/video.js";
import { TOKENS } from "../adaptadores/http/tokens.js";
import type { UsuarioAutenticado } from "../adaptadores/http/tipos.js";

export interface EnvioVideoResposta {
  videoId: string;
  status: Video["status"];
}

export interface VideoResposta {
  id: string;
  nomeOriginal: string;
  status: Video["status"];
  mensagemErro: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

function paraResposta(video: Video): VideoResposta {
  return {
    id: video.id,
    nomeOriginal: video.nomeOriginal,
    status: video.status,
    mensagemErro: video.mensagemErro,
    criadoEm: video.criadoEm.toISOString(),
    atualizadoEm: video.atualizadoEm.toISOString(),
  };
}

@injectable()
@Route("videos")
@Tags("Vídeos")
@Security("jwt")
export class VideosController extends Controller {
  constructor(
    @inject(TOKENS.EnviarVideo) private readonly enviarVideo: EnviarVideo,
    @inject(TOKENS.ListarVideos) private readonly listarVideos: ListarVideos,
    @inject(TOKENS.ConsultarVideo) private readonly consultarVideo: ConsultarVideo,
  ) {
    super();
  }

  @Post()
  @SuccessResponse(202)
  public async enviar(
    @Request() request: ExRequest,
    @UploadedFile("arquivo") arquivo?: Express.Multer.File,
  ): Promise<EnvioVideoResposta> {
    const usuario = request.user as UsuarioAutenticado;
    const resultado = await this.enviarVideo.executar({
      usuarioId: usuario.id,
      nomeOriginal: arquivo?.originalname,
      conteudo: arquivo?.buffer,
    });
    this.setStatus(202);
    return resultado;
  }

  @Get()
  public async listar(@Request() request: ExRequest): Promise<VideoResposta[]> {
    const usuario = request.user as UsuarioAutenticado;
    const videos = await this.listarVideos.executar(usuario.id);
    return videos.map(paraResposta);
  }

  @Get("{id}")
  public async consultar(
    @Request() request: ExRequest,
    @Path() id: string,
  ): Promise<VideoResposta> {
    const usuario = request.user as UsuarioAutenticado;
    const video = await this.consultarVideo.executar(usuario.id, id);
    return paraResposta(video);
  }
}
