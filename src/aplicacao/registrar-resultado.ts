import type { RepositorioVideo } from "../dominio/repositorio-video.js";

export interface EntradaResultado {
  videoId: unknown;
  status: unknown;
  caminhoZip?: unknown;
  mensagemErro?: unknown;
}

const STATUS_ACEITOS = ["PROCESSANDO", "CONCLUIDO", "ERRO"] as const;
type StatusResultado = (typeof STATUS_ACEITOS)[number];

function ehStatusAceito(valor: unknown): valor is StatusResultado {
  return typeof valor === "string" && (STATUS_ACEITOS as readonly string[]).includes(valor);
}

export class RegistrarResultado {
  constructor(private readonly repositorio: RepositorioVideo) {}

  async executar(entrada: EntradaResultado): Promise<boolean> {
    const videoId = typeof entrada.videoId === "string" ? entrada.videoId : "";
    if (videoId === "" || !ehStatusAceito(entrada.status)) {
      return false;
    }

    const video = await this.repositorio.buscarPorId(videoId);
    if (video === null) {
      return false;
    }

    const terminal = video.status === "CONCLUIDO" || video.status === "ERRO";
    if (terminal && entrada.status === "PROCESSANDO") {
      return false;
    }

    video.status = entrada.status;
    video.atualizadoEm = new Date();
    if (entrada.status === "CONCLUIDO") {
      video.caminhoZip =
        typeof entrada.caminhoZip === "string" ? entrada.caminhoZip : null;
    }
    if (entrada.status === "ERRO") {
      video.mensagemErro =
        typeof entrada.mensagemErro === "string" ? entrada.mensagemErro : null;
    }

    await this.repositorio.salvar(video);
    return true;
  }
}
