import type { RepositorioVideo } from "../dominio/repositorio-video.js";
import type { Video } from "../dominio/video.js";
import { VideoNaoEncontrado } from "../dominio/erros.js";

export class ConsultarVideo {
  constructor(private readonly repositorio: RepositorioVideo) {}

  async executar(usuarioId: string, videoId: string): Promise<Video> {
    const video = await this.repositorio.buscarPorId(videoId);
    if (video === null || video.usuarioId !== usuarioId) {
      throw new VideoNaoEncontrado();
    }
    return video;
  }
}
