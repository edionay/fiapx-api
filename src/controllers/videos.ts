import {
  Controller,
  Get,
  Path,
  Post,
  Produces,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
  UploadedFile,
} from "@tsoa/runtime";
import { inject, injectable } from "tsyringe";
import { existsSync } from "node:fs";
import type { Request as ExRequest } from "express";
import type { EnviarVideo } from "../aplicacao/enviar-video.js";
import type { ListarVideos } from "../aplicacao/listar-videos.js";
import type { ConsultarVideo } from "../aplicacao/consultar-video.js";
import type { BaixarVideo } from "../aplicacao/baixar-video.js";
import type { Video } from "../dominio/video.js";
import { PacoteIndisponivel } from "../dominio/erros.js";
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
    @inject(TOKENS.BaixarVideo) private readonly baixarVideo: BaixarVideo,
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

  @Get("{id}/download")
  @Produces("application/zip")
  public async baixar(
    @Request() request: ExRequest,
    @Path() id: string,
  ): Promise<void> {
    const usuario = request.user as UsuarioAutenticado;
    const pacote = await this.baixarVideo.executar(usuario.id, id);

    if (!existsSync(pacote.caminhoZip)) {
      throw new PacoteIndisponivel();
    }

    const resposta = request.res;
    if (resposta === undefined) {
      return;
    }

    await new Promise<void>((resolver, rejeitar) => {
      resposta.download(pacote.caminhoZip, pacote.nomeArquivo, (erro) => {
        if (erro !== undefined && !resposta.headersSent) {
          rejeitar(erro);
        } else {
          resolver();
        }
      });
    });
  }
}
