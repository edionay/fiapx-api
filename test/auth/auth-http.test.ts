import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../../src/app.js";

const credenciais = { email: "fulano@email.com", senha: "senhaforte1" };

describe("fluxo de autenticação HTTP", () => {
  it("cadastra, faz login e acessa rota protegida", async () => {
    const app = buildApp();

    const cadastro = await request(app).post("/auth/cadastro").send(credenciais);
    expect(cadastro.status).toBe(201);
    expect(cadastro.body).toMatchObject({ email: credenciais.email });
    expect(typeof cadastro.body.id).toBe("string");
    expect(cadastro.body.senhaHash).toBeUndefined();

    const login = await request(app).post("/auth/login").send(credenciais);
    expect(login.status).toBe(200);
    expect(typeof login.body.token).toBe("string");

    const eu = await request(app)
      .get("/auth/eu")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(eu.status).toBe(200);
    expect(eu.body).toMatchObject({ email: credenciais.email });
  });

  it("rejeita cadastro duplicado com 409", async () => {
    const app = buildApp();
    await request(app).post("/auth/cadastro").send(credenciais);
    const repetido = await request(app).post("/auth/cadastro").send(credenciais);
    expect(repetido.status).toBe(409);
  });

  it("rejeita senha curta com 400", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/auth/cadastro")
      .send({ email: "a@b.com", senha: "123" });
    expect(res.status).toBe(400);
  });

  it("rejeita login com senha incorreta com 401", async () => {
    const app = buildApp();
    await request(app).post("/auth/cadastro").send(credenciais);
    const res = await request(app)
      .post("/auth/login")
      .send({ email: credenciais.email, senha: "errada12" });
    expect(res.status).toBe(401);
  });

  it("bloqueia rota protegida sem token com 401", async () => {
    const app = buildApp();
    const res = await request(app).get("/auth/eu");
    expect(res.status).toBe(401);
  });

  it("bloqueia rota protegida com token inválido com 401", async () => {
    const app = buildApp();
    const res = await request(app)
      .get("/auth/eu")
      .set("Authorization", "Bearer token-invalido");
    expect(res.status).toBe(401);
  });
});
