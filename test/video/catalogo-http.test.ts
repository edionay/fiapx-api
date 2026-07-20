import { describe, it, expect } from "vitest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { buildApp } from "../../src/app.js";
import { RepositorioVideoMemoria } from "../../src/adaptadores/repositorio-video-memoria.js";
import { ArmazenamentoVideoSistemaArquivos } from "../../src/adaptadores/armazenamento-video-fs.js";

async function contexto() {
  const diretorio = await mkdtemp(path.join(tmpdir(), "fiapx-catalogo-"));
  const app = buildApp({
    repositorioVideo: new RepositorioVideoMemoria(),
    armazenamentoVideo: new ArmazenamentoVideoSistemaArquivos(diretorio),
  });
  return app;
}

async function tokenDe(app: ReturnType<typeof buildApp>, email: string) {
  const credenciais = { email, senha: "senhaforte1" };
  await request(app).post("/auth/cadastro").send(credenciais);
  const login = await request(app).post("/auth/login").send(credenciais);
  return login.body.token as string;
}

async function enviar(app: ReturnType<typeof buildApp>, token: string, nome: string) {
  const res = await request(app)
    .post("/videos")
    .set("Authorization", `Bearer ${token}`)
    .attach("arquivo", Buffer.from("bytes"), nome);
  return res.body.videoId as string;
}

describe("catálogo de vídeos", () => {
  it("lista apenas os vídeos do próprio usuário", async () => {
    const app = await contexto();
    const token = await tokenDe(app, "dono@email.com");
    await enviar(app, token, "a.mp4");
    await enviar(app, token, "b.mp4");

    const res = await request(app)
      .get("/videos")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ status: "PENDENTE" });
    expect(res.body[0].caminhoEntrada).toBeUndefined();
  });

  it("consulta um vídeo específico do dono", async () => {
    const app = await contexto();
    const token = await tokenDe(app, "dono@email.com");
    const videoId = await enviar(app, token, "a.mp4");

    const res = await request(app)
      .get(`/videos/${videoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: videoId, nomeOriginal: "a.mp4" });
  });

  it("não deixa um usuário ver o vídeo de outro (404)", async () => {
    const app = await contexto();
    const tokenA = await tokenDe(app, "a@email.com");
    const tokenB = await tokenDe(app, "b@email.com");
    const videoId = await enviar(app, tokenA, "a.mp4");

    const res = await request(app)
      .get(`/videos/${videoId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  it("bloqueia o catálogo sem token (401)", async () => {
    const app = await contexto();
    const res = await request(app).get("/videos");
    expect(res.status).toBe(401);
  });
});
