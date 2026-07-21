import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import amqp, { type Channel, type ChannelModel } from "amqplib";
import {
  FILA_PROCESSAR,
  PublicadorProcessamentoRabbit,
} from "../../src/adaptadores/mensageria/publicador-processamento-rabbit.js";

const url = process.env.RABBITMQ_URL;

describe.skipIf(!url)("PublicadorProcessamentoRabbit", () => {
  let conexao: ChannelModel;
  let canal: Channel;

  beforeAll(async () => {
    conexao = await amqp.connect(url!);
    canal = await conexao.createChannel();
    await canal.assertQueue(FILA_PROCESSAR, { durable: true });
    await canal.purgeQueue(FILA_PROCESSAR);
  });

  afterAll(async () => {
    await canal.purgeQueue(FILA_PROCESSAR);
    await canal.close();
    await conexao.close();
  });

  it("publica videos.processar com videoId e caminhoEntrada", async () => {
    const videoId = randomUUID();
    const caminhoEntrada = `/data/uploads/${videoId}.mp4`;

    await new PublicadorProcessamentoRabbit(canal).publicar(videoId, caminhoEntrada);

    let mensagem: Awaited<ReturnType<Channel["get"]>> = false;
    for (let tentativa = 0; tentativa < 20 && mensagem === false; tentativa++) {
      mensagem = await canal.get(FILA_PROCESSAR, { noAck: true });
      if (mensagem === false) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    expect(mensagem).not.toBe(false);
    const conteudo = JSON.parse((mensagem as Exclude<typeof mensagem, false>).content.toString());
    expect(conteudo).toEqual({ videoId, caminhoEntrada });
  });
});
