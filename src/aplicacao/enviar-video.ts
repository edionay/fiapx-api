import type { RepositorioVideo } from "../dominio/repositorio-video.js";
import type { Video } from "../dominio/video.js";
import { DadosInvalidos } from "../dominio/erros.js";
import type { ArmazenamentoVideo, GeradorId } from "./portas.js";

export interface EntradaEnvioVideo {
  usuarioId: string;
  nomeOriginal: unknown;
  conteudo: Buffer | undefined;
}

export interface ResultadoEnvioVideo {
  videoId: string;
  status: Video["status"];
}

export class EnviarVideo {
  constructor(
    private readonly repositorio: RepositorioVideo,
    private readonly armazenamento: ArmazenamentoVideo,
    private readonly geradorId: GeradorId,
  ) {}

  async executar(entrada: EntradaEnvioVideo): Promise<ResultadoEnvioVideo> {
    const nomeOriginal =
      typeof entrada.nomeOriginal === "string" ? entrada.nomeOriginal.trim() : "";

    if (nomeOriginal === "") {
      throw new DadosInvalidos("Nome do arquivo é obrigatório");
    }
    if (entrada.conteudo === undefined || entrada.conteudo.length === 0) {
      throw new DadosInvalidos("Arquivo de vídeo é obrigatório");
    }

    const id = this.geradorId.gerar();
    const caminhoEntrada = await this.armazenamento.salvarEntrada(
      id,
      nomeOriginal,
      entrada.conteudo,
    );

    const agora = new Date();
    const video: Video = {
      id,
      usuarioId: entrada.usuarioId,
      nomeOriginal,
      caminhoEntrada,
      status: "PENDENTE",
      caminhoZip: null,
      mensagemErro: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    await this.repositorio.salvar(video);

    return { videoId: id, status: video.status };
  }
}
