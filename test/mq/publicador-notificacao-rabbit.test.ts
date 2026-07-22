import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import amqp, { type Channel, type ChannelModel } from "amqplib";
import {
  FILA_NOTIFICACOES,
  PublicadorNotificacaoRabbit,
} from "../../src/adaptadores/mensageria/publicador-notificacao-rabbit.js";

const url = process.env.RABBITMQ_URL;

describe.skipIf(!url)("PublicadorNotificacaoRabbit", () => {
  let conexao: ChannelModel;
  let canal: Channel;

  beforeAll(async () => {
    conexao = await amqp.connect(url!);
    canal = await conexao.createChannel();
    await canal.assertQueue(FILA_NOTIFICACOES, { durable: true });
    await canal.purgeQueue(FILA_NOTIFICACOES);
  });

  afterAll(async () => {
    await canal.purgeQueue(FILA_NOTIFICACOES);
    await canal.close();
    await conexao.close();
  });

  it("publica notificacoes com videoId, email e mensagemErro", async () => {
    const videoId = randomUUID();
    await new PublicadorNotificacaoRabbit(canal).publicar(
      videoId,
      "dono@email.com",
      "falha no ffmpeg",
    );

    let mensagem: Awaited<ReturnType<Channel["get"]>> = false;
    for (let tentativa = 0; tentativa < 20 && mensagem === false; tentativa++) {
      mensagem = await canal.get(FILA_NOTIFICACOES, { noAck: true });
      if (mensagem === false) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    expect(mensagem).not.toBe(false);
    const conteudo = JSON.parse(
      (mensagem as Exclude<typeof mensagem, false>).content.toString(),
    );
    expect(conteudo).toEqual({
      videoId,
      emailUsuario: "dono@email.com",
      mensagemErro: "falha no ffmpeg",
    });
  });
});
