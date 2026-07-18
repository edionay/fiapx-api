import { Router } from "express";

/**
 * Sonda de saúde do serviço. Cada serviço do FIAP X expõe `/health`
 * (ver docs de arquitetura no repositório fiapx-infra).
 */
export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "fiapx-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
