import type { RepositorioVideo } from "../dominio/repositorio-video.js";
import type { RepositorioUsuario } from "../dominio/repositorio-usuario.js";
import type { PublicadorNotificacao } from "./portas.js";

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
  constructor(
    private readonly repositorio: RepositorioVideo,
    private readonly repositorioUsuario: RepositorioUsuario,
    private readonly publicadorNotificacao: PublicadorNotificacao,
  ) {}

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

    if (entrada.status === "ERRO") {
      const dono = await this.repositorioUsuario.buscarPorId(video.usuarioId);
      if (dono !== null) {
        await this.publicadorNotificacao.publicar(
          video.id,
          dono.email,
          video.mensagemErro ?? "",
        );
      }
    }

    return true;
  }
}
