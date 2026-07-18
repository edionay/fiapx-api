import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp();

const server = app.listen(env.port, () => {
  console.log(`fiapx-api ouvindo na porta ${env.port} (${env.nodeEnv})`);
});

// Encerramento gracioso — importante quando o serviço roda em contêiner.
for (const sinal of ["SIGINT", "SIGTERM"] as const) {
  process.on(sinal, () => {
    console.log(`Recebido ${sinal}, encerrando...`);
    server.close(() => process.exit(0));
  });
}
