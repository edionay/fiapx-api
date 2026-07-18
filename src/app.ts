import express, { type Express } from "express";
import { healthRouter } from "./routes/health.js";

/**
 * Monta a aplicação Express sem colocá-la para escutar. Deixar a criação
 * separada do `listen` permite instanciá-la nos testes (supertest) sem abrir
 * uma porta de rede.
 */
export function buildApp(): Express {
  const app = express();

  app.use(express.json());

  app.use(healthRouter);

  // 404 padrão para rotas não mapeadas.
  app.use((_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
  });

  return app;
}
