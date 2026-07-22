import type { RepositorioVideo } from "../dominio/repositorio-video.js";
import { PacoteIndisponivel, VideoNaoEncontrado } from "../dominio/erros.js";

export interface Pacote {
  caminhoZip: string;
  nomeArquivo: string;
}

export class BaixarVideo {
  constructor(private readonly repositorio: RepositorioVideo) {}

  async executar(usuarioId: string, videoId: string): Promise<Pacote> {
    const video = await this.repositorio.buscarPorId(videoId);
    if (video === null || video.usuarioId !== usuarioId) {
      throw new VideoNaoEncontrado();
    }
    if (video.status !== "CONCLUIDO" || video.caminhoZip === null) {
      throw new PacoteIndisponivel();
    }

    const base = video.nomeOriginal.replace(/\.[^./\\]+$/, "");
    return { caminhoZip: video.caminhoZip, nomeArquivo: `${base}.zip` };
  }
}
