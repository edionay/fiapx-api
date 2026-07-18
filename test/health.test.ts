import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";

describe("GET /health", () => {
  const app = buildApp();

  it("responde 200 com status ok e nome do serviço", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok",
      service: "fiapx-api",
    });
    expect(typeof res.body.timestamp).toBe("string");
    expect(typeof res.body.uptime).toBe("number");
  });
});

describe("rota inexistente", () => {
  const app = buildApp();

  it("responde 404 em JSON", async () => {
    const res = await request(app).get("/nao-existe");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ erro: "Rota não encontrada" });
  });
});
