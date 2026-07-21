import { describe, it, expect, beforeEach } from "vitest";
import { EnviarVideo } from "../../src/aplicacao/enviar-video.js";
import { RepositorioVideoMemoria } from "../../src/adaptadores/repositorio-video-memoria.js";
import { DadosInvalidos } from "../../src/dominio/erros.js";
import type {
  ArmazenamentoVideo,
  GeradorId,
  PublicadorProcessamento,
} from "../../src/aplicacao/portas.js";

const armazenamentoFake: ArmazenamentoVideo = {
  salvarEntrada: async (id, nome) => `/data/uploads/${id}-${nome}`,
};

function geradorSequencial(): GeradorId {
  let n = 0;
  return { gerar: () => `video-${++n}` };
}

class PublicadorFake implements PublicadorProcessamento {
  public readonly chamadas: Array<{ videoId: string; caminhoEntrada: string }> = [];
  async publicar(videoId: string, caminhoEntrada: string): Promise<void> {
    this.chamadas.push({ videoId, caminhoEntrada });
  }
}

describe("EnviarVideo", () => {
  let repositorio: RepositorioVideoMemoria;
  let publicador: PublicadorFake;
  let enviar: EnviarVideo;

  beforeEach(() => {
    repositorio = new RepositorioVideoMemoria();
    publicador = new PublicadorFake();
    enviar = new EnviarVideo(
      repositorio,
      armazenamentoFake,
      geradorSequencial(),
      publicador,
    );
  });

  it("cria vídeo PENDENTE, persiste o caminho e publica na fila", async () => {
    const resultado = await enviar.executar({
      usuarioId: "u1",
      nomeOriginal: "  filme.mp4 ",
      conteudo: Buffer.from("conteudo"),
    });

    expect(resultado).toEqual({ videoId: "video-1", status: "PENDENTE" });

    const salvo = await repositorio.buscarPorId("video-1");
    expect(salvo?.usuarioId).toBe("u1");
    expect(salvo?.nomeOriginal).toBe("filme.mp4");
    expect(salvo?.caminhoEntrada).toBe("/data/uploads/video-1-filme.mp4");
    expect(salvo?.status).toBe("PENDENTE");
    expect(salvo?.caminhoZip).toBeNull();

    expect(publicador.chamadas).toEqual([
      { videoId: "video-1", caminhoEntrada: "/data/uploads/video-1-filme.mp4" },
    ]);
  });

  it("não publica na fila quando a validação falha", async () => {
    await expect(
      enviar.executar({ usuarioId: "u1", nomeOriginal: "  ", conteudo: Buffer.from("x") }),
    ).rejects.toBeInstanceOf(DadosInvalidos);
    expect(publicador.chamadas).toHaveLength(0);
  });

  it("rejeita quando não há arquivo", async () => {
    await expect(
      enviar.executar({ usuarioId: "u1", nomeOriginal: "filme.mp4", conteudo: undefined }),
    ).rejects.toBeInstanceOf(DadosInvalidos);
  });

  it("rejeita quando o nome do arquivo está vazio", async () => {
    await expect(
      enviar.executar({ usuarioId: "u1", nomeOriginal: "  ", conteudo: Buffer.from("x") }),
    ).rejects.toBeInstanceOf(DadosInvalidos);
  });
});
