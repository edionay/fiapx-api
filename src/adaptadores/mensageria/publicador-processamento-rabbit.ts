import type { Channel } from "amqplib";
import type { PublicadorProcessamento } from "../../aplicacao/portas.js";

export const FILA_PROCESSAR = "videos.processar";

export class PublicadorProcessamentoRabbit implements PublicadorProcessamento {
  constructor(
    private readonly canal: Channel,
    private readonly fila: string = FILA_PROCESSAR,
  ) {}

  async publicar(videoId: string, caminhoEntrada: string): Promise<void> {
    const conteudo = Buffer.from(JSON.stringify({ videoId, caminhoEntrada }));
    this.canal.sendToQueue(this.fila, conteudo, { persistent: true });
  }
}
