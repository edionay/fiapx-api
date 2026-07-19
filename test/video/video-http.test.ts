import { describe, it, expect, beforeAll } from "vitest";
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { buildApp } from "../../src/app.js";
import { RepositorioVideoMemoria } from "../../src/adaptadores/repositorio-video-memoria.js";
import { ArmazenamentoVideoSistemaArquivos } from "../../src/adaptadores/armazenamento-video-fs.js";

const credenciais = { email: "dono@email.com", senha: "senhaforte1" };

async function appComToken() {
  const diretorio = await mkdtemp(path.join(tmpdir(), "fiapx-uploads-"));
  const repositorioVideo = new RepositorioVideoMemoria();
  const app = buildApp({
    repositorioVideo,
    armazenamentoVideo: new ArmazenamentoVideoSistemaArquivos(diretorio),
  });

  await request(app).post("/auth/cadastro").send(credenciais);
  const login = await request(app).post("/auth/login").send(credenciais);
  return { app, token: login.body.token as string, repositorioVideo, diretorio };
}

describe("POST /videos", () => {
  it("aceita o upload, cria vídeo PENDENTE e grava o arquivo", async () => {
    const { app, token, repositorioVideo, diretorio } = await appComToken();

    const res = await request(app)
      .post("/videos")
      .set("Authorization", `Bearer ${token}`)
      .attach("arquivo", Buffer.from("bytes-do-video"), "filme.mp4");

    expect(res.status).toBe(202);
    expect(res.body.status).toBe("PENDENTE");
    expect(typeof res.body.videoId).toBe("string");

    const salvo = await repositorioVideo.buscarPorId(res.body.videoId);
    expect(salvo?.nomeOriginal).toBe("filme.mp4");

    const arquivos = await readdir(diretorio);
    expect(arquivos).toContain(`${res.body.videoId}.mp4`);
  });

  it("responde 400 quando não há arquivo", async () => {
    const { app, token } = await appComToken();
    const res = await request(app)
      .post("/videos")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("responde 401 sem token", async () => {
    const { app } = await appComToken();
    const res = await request(app)
      .post("/videos")
      .attach("arquivo", Buffer.from("x"), "filme.mp4");
    expect(res.status).toBe(401);
  });
});
