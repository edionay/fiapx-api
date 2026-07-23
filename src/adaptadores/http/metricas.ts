import type { NextFunction, Request, Response } from "express";
import { collectDefaultMetrics, Counter, Histogram, Registry } from "prom-client";

export interface Metricas {
  registro: Registry;
  middleware: (req: Request, res: Response, next: NextFunction) => void;
}

export function criarMetricas(): Metricas {
  const registro = new Registry();
  registro.setDefaultLabels({ service: "fiapx-api" });
  collectDefaultMetrics({ register: registro });

  const duracao = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duração das requisições HTTP em segundos",
    labelNames: ["method", "route", "status"],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [registro],
  });

  const total = new Counter({
    name: "http_requests_total",
    help: "Total de requisições HTTP",
    labelNames: ["method", "route", "status"],
    registers: [registro],
  });

  const middleware = (req: Request, res: Response, next: NextFunction): void => {
    const fim = duracao.startTimer();
    res.on("finish", () => {
      const rota = req.route?.path ?? "desconhecida";
      const rotulos = {
        method: req.method,
        route: String(rota),
        status: String(res.statusCode),
      };
      fim(rotulos);
      total.inc(rotulos);
    });
    next();
  };

  return { registro, middleware };
}
