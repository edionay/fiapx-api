import { describe, it, expect, beforeEach } from "vitest";
import { BaixarVideo } from "../../src/aplicacao/baixar-video.js";
import { RepositorioVideoMemoria } from "../../src/adaptadores/repositorio-video-memoria.js";
import { PacoteIndisponivel, VideoNaoEncontrado } from "../../src/dominio/erros.js";
import type { StatusVideo, Video } from "../../src/dominio/video.js";

function video(status: StatusVideo, caminhoZip: string | null): Video {
  const agora = new Date();
  return {
    id: "v1",
    usuarioId: "dono",
    nomeOriginal: "meu-video.mp4",
    caminhoEntrada: "/data/uploads/v1.mp4",
    status,
    caminhoZip,
    mensagemErro: null,
    criadoEm: agora,
    atualizadoEm: agora,
  };
}

describe("BaixarVideo", () => {
  let repositorio: RepositorioVideoMemoria;
  let baixar: BaixarVideo;

  beforeEach(() => {
    repositorio = new RepositorioVideoMemoria();
    baixar = new BaixarVideo(repositorio);
  });

  it("retorna o caminho do zip e o nome do arquivo quando concluído", async () => {
    await repositorio.salvar(video("CONCLUIDO", "/data/outputs/v1.zip"));
    const pacote = await baixar.executar("dono", "v1");
    expect(pacote).toEqual({
      caminhoZip: "/data/outputs/v1.zip",
      nomeArquivo: "meu-video.zip",
    });
  });

  it("trata vídeo de outro dono como não encontrado", async () => {
    await repositorio.salvar(video("CONCLUIDO", "/data/outputs/v1.zip"));
    await expect(baixar.executar("intruso", "v1")).rejects.toBeInstanceOf(
      VideoNaoEncontrado,
    );
  });

  it("recusa quando o vídeo ainda não foi concluído", async () => {
    await repositorio.salvar(video("PROCESSANDO", null));
    await expect(baixar.executar("dono", "v1")).rejects.toBeInstanceOf(
      PacoteIndisponivel,
    );
  });

  it("recusa quando não há caminho de zip", async () => {
    await repositorio.salvar(video("CONCLUIDO", null));
    await expect(baixar.executar("dono", "v1")).rejects.toBeInstanceOf(
      PacoteIndisponivel,
    );
  });
});
