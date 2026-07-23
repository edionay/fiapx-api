import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";

describe("CORS", () => {
  const app = buildApp();

  it("libera a origem do frontend em uma requisição simples", async () => {
    const res = await request(app).get("/health").set("Origin", "http://localhost:5173");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("responde ao preflight de uma rota da API", async () => {
    const res = await request(app)
      .options("/auth/login")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");

    expect(res.status).toBeLessThan(300);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
  });

  it("não libera uma origem não permitida", async () => {
    const res = await request(app).get("/health").set("Origin", "http://malicioso.example");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
