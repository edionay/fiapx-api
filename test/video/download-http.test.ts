import { describe, it, expect } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { buildApp } from "../../src/app.js";
import { RepositorioVideoMemoria } from "../../src/adaptadores/repositorio-video-memoria.js";
import { ArmazenamentoVideoSistemaArquivos } from "../../src/adaptadores/armazenamento-video-fs.js";
import type { StatusVideo } from "../../src/dominio/video.js";

async function contexto() {
  const diretorio = await mkdtemp(path.join(tmpdir(), "fiapx-download-"));
  const repositorioVideo = new RepositorioVideoMemoria();
  const app = buildApp({
    repositorioVideo,
    armazenamentoVideo: new ArmazenamentoVideoSistemaArquivos(diretorio),
  });
  return { app, repositorioVideo, diretorio };
}

async function registrar(app: ReturnType<typeof buildApp>, email: string) {
  const credenciais = { email, senha: "senhaforte1" };
  const cadastro = await request(app).post("/auth/cadastro").send(credenciais);
  const login = await request(app).post("/auth/login").send(credenciais);
  return { id: cadastro.body.id as string, token: login.body.token as string };
}

async function salvarVideo(
  repositorio: RepositorioVideoMemoria,
  id: string,
  usuarioId: string,
  status: StatusVideo,
  caminhoZip: string | null,
) {
  const agora = new Date();
  await repositorio.salvar({
    id,
    usuarioId,
    nomeOriginal: "clipe.mp4",
    caminhoEntrada: "/data/uploads/x.mp4",
    status,
    caminhoZip,
    mensagemErro: null,
    criadoEm: agora,
    atualizadoEm: agora,
  });
}

describe("GET /videos/:id/download", () => {
  it("baixa o zip de um vídeo concluído do dono", async () => {
    const { app, repositorioVideo, diretorio } = await contexto();
    const dono = await registrar(app, "dono@email.com");
    const caminhoZip = path.join(diretorio, "v1.zip");
    await writeFile(caminhoZip, "conteudo-do-zip");
    await salvarVideo(repositorioVideo, "v1", dono.id, "CONCLUIDO", caminhoZip);

    const res = await request(app)
      .get("/videos/v1/download")
      .set("Authorization", `Bearer ${dono.token}`)
      .responseType("blob");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/zip");
    expect(res.headers["content-disposition"]).toContain("clipe.zip");
    expect(res.body.toString()).toBe("conteudo-do-zip");
  });

  it("responde 409 quando o vídeo ainda não foi concluído", async () => {
    const { app, repositorioVideo } = await contexto();
    const dono = await registrar(app, "dono@email.com");
    await salvarVideo(repositorioVideo, "v1", dono.id, "PROCESSANDO", null);

    const res = await request(app)
      .get("/videos/v1/download")
      .set("Authorization", `Bearer ${dono.token}`);
    expect(res.status).toBe(409);
  });

  it("responde 404 para vídeo de outro usuário", async () => {
    const { app, repositorioVideo, diretorio } = await contexto();
    const dono = await registrar(app, "a@email.com");
    const outro = await registrar(app, "b@email.com");
    const caminhoZip = path.join(diretorio, "v1.zip");
    await writeFile(caminhoZip, "x");
    await salvarVideo(repositorioVideo, "v1", dono.id, "CONCLUIDO", caminhoZip);

    const res = await request(app)
      .get("/videos/v1/download")
      .set("Authorization", `Bearer ${outro.token}`);
    expect(res.status).toBe(404);
  });

  it("responde 401 sem token", async () => {
    const { app } = await contexto();
    const res = await request(app).get("/videos/v1/download");
    expect(res.status).toBe(401);
  });
});
