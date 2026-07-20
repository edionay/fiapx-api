import { describe, it, expect, beforeEach } from "vitest";
import { ConsultarVideo } from "../../src/aplicacao/consultar-video.js";
import { ListarVideos } from "../../src/aplicacao/listar-videos.js";
import { RepositorioVideoMemoria } from "../../src/adaptadores/repositorio-video-memoria.js";
import { VideoNaoEncontrado } from "../../src/dominio/erros.js";
import type { Video } from "../../src/dominio/video.js";

function video(id: string, usuarioId: string, criadoEm: Date): Video {
  return {
    id,
    usuarioId,
    nomeOriginal: `${id}.mp4`,
    caminhoEntrada: `/data/uploads/${id}.mp4`,
    status: "PENDENTE",
    caminhoZip: null,
    mensagemErro: null,
    criadoEm,
    atualizadoEm: criadoEm,
  };
}

describe("ConsultarVideo", () => {
  let repositorio: RepositorioVideoMemoria;
  let consultar: ConsultarVideo;

  beforeEach(async () => {
    repositorio = new RepositorioVideoMemoria();
    consultar = new ConsultarVideo(repositorio);
    await repositorio.salvar(video("v1", "dono", new Date()));
  });

  it("retorna o vídeo do próprio dono", async () => {
    const encontrado = await consultar.executar("dono", "v1");
    expect(encontrado.id).toBe("v1");
  });

  it("trata vídeo de outro dono como não encontrado", async () => {
    await expect(consultar.executar("intruso", "v1")).rejects.toBeInstanceOf(
      VideoNaoEncontrado,
    );
  });

  it("rejeita id inexistente", async () => {
    await expect(consultar.executar("dono", "nao-existe")).rejects.toBeInstanceOf(
      VideoNaoEncontrado,
    );
  });
});

describe("ListarVideos", () => {
  it("retorna apenas os vídeos do usuário, do mais recente ao mais antigo", async () => {
    const repositorio = new RepositorioVideoMemoria();
    await repositorio.salvar(video("antigo", "dono", new Date("2026-01-01")));
    await repositorio.salvar(video("novo", "dono", new Date("2026-02-01")));
    await repositorio.salvar(video("de-outro", "outro", new Date("2026-03-01")));

    const lista = await new ListarVideos(repositorio).executar("dono");

    expect(lista.map((v) => v.id)).toEqual(["novo", "antigo"]);
  });
});
