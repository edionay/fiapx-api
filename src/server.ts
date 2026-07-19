import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import type { RepositorioUsuario } from "./dominio/repositorio-usuario.js";
import { RepositorioUsuarioPrisma } from "./adaptadores/repositorio-usuario-prisma.js";
import { criarPrismaClient } from "./adaptadores/prisma/cliente.js";

let repositorioUsuario: RepositorioUsuario | undefined;
let desconectar: (() => Promise<void>) | undefined;

if (env.databaseUrl !== undefined) {
  const prisma = criarPrismaClient(env.databaseUrl);
  repositorioUsuario = new RepositorioUsuarioPrisma(prisma);
  desconectar = () => prisma.$disconnect();
  console.log("Persistência: Postgres via Prisma");
} else {
  console.log("Persistência: memória (defina DATABASE_URL para usar Postgres)");
}

const app = buildApp({ repositorioUsuario });

const server = app.listen(env.port, () => {
  console.log(`fiapx-api ouvindo na porta ${env.port} (${env.nodeEnv})`);
});

for (const sinal of ["SIGINT", "SIGTERM"] as const) {
  process.on(sinal, () => {
    console.log(`Recebido ${sinal}, encerrando...`);
    server.close(async () => {
      await desconectar?.();
      process.exit(0);
    });
  });
}
