import amqp from "amqplib";
import type { RegistrarResultado } from "../../aplicacao/registrar-resultado.js";
import {
  FILA_PROCESSAR,
  PublicadorProcessamentoRabbit,
} from "./publicador-processamento-rabbit.js";
import {
  FILA_RESULTADO,
  iniciarConsumoResultado,
} from "./consumidor-resultado-rabbit.js";

export interface ConexaoRabbit {
  publicadorProcessamento: PublicadorProcessamentoRabbit;
  consumirResultado: (registrar: RegistrarResultado) => Promise<unknown>;
  fechar: () => Promise<void>;
}

export async function conectarRabbit(url: string): Promise<ConexaoRabbit> {
  const conexao = await amqp.connect(url);
  const canal = await conexao.createChannel();
  await canal.assertQueue(FILA_PROCESSAR, { durable: true });
  await canal.assertQueue(FILA_RESULTADO, { durable: true });

  return {
    publicadorProcessamento: new PublicadorProcessamentoRabbit(canal),
    consumirResultado: (registrar) => iniciarConsumoResultado(canal, registrar),
    fechar: async () => {
      await canal.close();
      await conexao.close();
    },
  };
}
