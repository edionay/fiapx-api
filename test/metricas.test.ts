import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";

describe("GET /metrics", () => {
  it("expõe as métricas no formato do Prometheus", async () => {
    const app = buildApp();
    const res = await request(app).get("/metrics");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("process_cpu_user_seconds_total");
    expect(res.text).toContain('service="fiapx-api"');
  });

  it("contabiliza as requisições HTTP por rota e status", async () => {
    const app = buildApp();

    await request(app).get("/health");
    const res = await request(app).get("/metrics");

    expect(res.text).toContain("http_requests_total");
    expect(res.text).toMatch(/http_requests_total\{[^}]*route="\/health"[^}]*status="200"[^}]*\}/);
  });
});
