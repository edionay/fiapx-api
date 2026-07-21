import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import type { RepositorioUsuario } from "./dominio/repositorio-usuario.js";
import type { RepositorioVideo } from "./dominio/repositorio-video.js";
import type { PublicadorProcessamento } from "./aplicacao/portas.js";
import { RepositorioUsuarioPrisma } from "./adaptadores/repositorio-usuario-prisma.js";
import { RepositorioVideoPrisma } from "./adaptadores/repositorio-video-prisma.js";
import { criarPrismaClient } from "./adaptadores/prisma/cliente.js";
import { conectarRabbit } from "./adaptadores/mensageria/cliente-rabbit.js";

let repositorioUsuario: RepositorioUsuario | undefined;
let repositorioVideo: RepositorioVideo | undefined;
let publicadorProcessamento: PublicadorProcessamento | undefined;
let desconectar: (() => Promise<void>) | undefined;
let fecharRabbit: (() => Promise<void>) | undefined;

if (env.databaseUrl !== undefined) {
  const prisma = criarPrismaClient(env.databaseUrl);
  repositorioUsuario = new RepositorioUsuarioPrisma(prisma);
  repositorioVideo = new RepositorioVideoPrisma(prisma);
  desconectar = () => prisma.$disconnect();
  console.log("Persistência: Postgres via Prisma");
} else {
  console.log("Persistência: memória (defina DATABASE_URL para usar Postgres)");
}

if (env.rabbitmqUrl !== undefined) {
  const rabbit = await conectarRabbit(env.rabbitmqUrl);
  publicadorProcessamento = rabbit.publicadorProcessamento;
  fecharRabbit = rabbit.fechar;
  console.log("Mensageria: RabbitMQ");
} else {
  console.log("Mensageria: desligada (defina RABBITMQ_URL para publicar)");
}

const app = buildApp({ repositorioUsuario, repositorioVideo, publicadorProcessamento });

const server = app.listen(env.port, () => {
  console.log(`fiapx-api ouvindo na porta ${env.port} (${env.nodeEnv})`);
});

for (const sinal of ["SIGINT", "SIGTERM"] as const) {
  process.on(sinal, () => {
    console.log(`Recebido ${sinal}, encerrando...`);
    server.close(async () => {
      await fecharRabbit?.();
      await desconectar?.();
      process.exit(0);
    });
  });
}
