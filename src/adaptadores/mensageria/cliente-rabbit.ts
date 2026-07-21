import amqp from "amqplib";
import {
  FILA_PROCESSAR,
  PublicadorProcessamentoRabbit,
} from "./publicador-processamento-rabbit.js";

export interface ConexaoRabbit {
  publicadorProcessamento: PublicadorProcessamentoRabbit;
  fechar: () => Promise<void>;
}

export async function conectarRabbit(url: string): Promise<ConexaoRabbit> {
  const conexao = await amqp.connect(url);
  const canal = await conexao.createChannel();
  await canal.assertQueue(FILA_PROCESSAR, { durable: true });

  return {
    publicadorProcessamento: new PublicadorProcessamentoRabbit(canal),
    fechar: async () => {
      await canal.close();
      await conexao.close();
    },
  };
}
