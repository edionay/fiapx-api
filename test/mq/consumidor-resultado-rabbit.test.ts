import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import amqp, { type Channel, type ChannelModel } from "amqplib";
import { RegistrarResultado } from "../../src/aplicacao/registrar-resultado.js";
import { RepositorioVideoMemoria } from "../../src/adaptadores/repositorio-video-memoria.js";
import { iniciarConsumoResultado } from "../../src/adaptadores/mensageria/consumidor-resultado-rabbit.js";

const url = process.env.RABBITMQ_URL;

describe.skipIf(!url)("consumidor de videos.resultado", () => {
  let conexao: ChannelModel;
  let canal: Channel;
  const fila = `videos.resultado.teste.${randomUUID()}`;

  beforeAll(async () => {
    conexao = await amqp.connect(url!);
    canal = await conexao.createChannel();
    await canal.assertQueue(fila, { durable: false, autoDelete: true });
  });

  afterAll(async () => {
    await canal.close();
    await conexao.close();
  });

  it("consome a mensagem e atualiza o status do vídeo", async () => {
    const repositorio = new RepositorioVideoMemoria();
    const videoId = randomUUID();
    const agora = new Date();
    await repositorio.salvar({
      id: videoId,
      usuarioId: "dono",
      nomeOriginal: "a.mp4",
      caminhoEntrada: "/data/uploads/a.mp4",
      status: "PENDENTE",
      caminhoZip: null,
      mensagemErro: null,
      criadoEm: agora,
      atualizadoEm: agora,
    });

    await iniciarConsumoResultado(canal, new RegistrarResultado(repositorio), fila);

    canal.sendToQueue(
      fila,
      Buffer.from(
        JSON.stringify({ videoId, status: "CONCLUIDO", caminhoZip: "/data/outputs/a.zip" }),
      ),
    );

    let video = await repositorio.buscarPorId(videoId);
    for (let tentativa = 0; tentativa < 40 && video?.status !== "CONCLUIDO"; tentativa++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      video = await repositorio.buscarPorId(videoId);
    }

    expect(video?.status).toBe("CONCLUIDO");
    expect(video?.caminhoZip).toBe("/data/outputs/a.zip");
  });
});
