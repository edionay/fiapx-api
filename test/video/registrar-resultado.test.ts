import { describe, it, expect, beforeEach } from "vitest";
import { RegistrarResultado } from "../../src/aplicacao/registrar-resultado.js";
import { RepositorioVideoMemoria } from "../../src/adaptadores/repositorio-video-memoria.js";
import type { Video } from "../../src/dominio/video.js";

function videoPendente(id: string): Video {
  const agora = new Date();
  return {
    id,
    usuarioId: "dono",
    nomeOriginal: `${id}.mp4`,
    caminhoEntrada: `/data/uploads/${id}.mp4`,
    status: "PENDENTE",
    caminhoZip: null,
    mensagemErro: null,
    criadoEm: agora,
    atualizadoEm: agora,
  };
}

describe("RegistrarResultado", () => {
  let repositorio: RepositorioVideoMemoria;
  let registrar: RegistrarResultado;

  beforeEach(async () => {
    repositorio = new RepositorioVideoMemoria();
    registrar = new RegistrarResultado(repositorio);
    await repositorio.salvar(videoPendente("v1"));
  });

  it("aplica PROCESSANDO", async () => {
    const aplicada = await registrar.executar({ videoId: "v1", status: "PROCESSANDO" });
    expect(aplicada).toBe(true);
    expect((await repositorio.buscarPorId("v1"))?.status).toBe("PROCESSANDO");
  });

  it("aplica CONCLUIDO com o caminho do zip", async () => {
    const aplicada = await registrar.executar({
      videoId: "v1",
      status: "CONCLUIDO",
      caminhoZip: "/data/outputs/v1.zip",
    });
    expect(aplicada).toBe(true);
    const video = await repositorio.buscarPorId("v1");
    expect(video?.status).toBe("CONCLUIDO");
    expect(video?.caminhoZip).toBe("/data/outputs/v1.zip");
  });

  it("aplica ERRO com a mensagem", async () => {
    const aplicada = await registrar.executar({
      videoId: "v1",
      status: "ERRO",
      mensagemErro: "falha no ffmpeg",
    });
    expect(aplicada).toBe(true);
    const video = await repositorio.buscarPorId("v1");
    expect(video?.status).toBe("ERRO");
    expect(video?.mensagemErro).toBe("falha no ffmpeg");
  });

  it("descarta vídeo desconhecido", async () => {
    const aplicada = await registrar.executar({ videoId: "fantasma", status: "CONCLUIDO" });
    expect(aplicada).toBe(false);
  });

  it("descarta status inválido", async () => {
    const aplicada = await registrar.executar({ videoId: "v1", status: "EXPLODIU" });
    expect(aplicada).toBe(false);
    expect((await repositorio.buscarPorId("v1"))?.status).toBe("PENDENTE");
  });

  it("não regride status terminal com PROCESSANDO atrasado", async () => {
    await registrar.executar({ videoId: "v1", status: "CONCLUIDO", caminhoZip: "/z.zip" });
    const aplicada = await registrar.executar({ videoId: "v1", status: "PROCESSANDO" });
    expect(aplicada).toBe(false);
    expect((await repositorio.buscarPorId("v1"))?.status).toBe("CONCLUIDO");
  });
});
