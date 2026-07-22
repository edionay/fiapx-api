import type { Channel } from "amqplib";
import type { PublicadorNotificacao } from "../../aplicacao/portas.js";

export const FILA_NOTIFICACOES = "notificacoes";

export class PublicadorNotificacaoRabbit implements PublicadorNotificacao {
  constructor(
    private readonly canal: Channel,
    private readonly fila: string = FILA_NOTIFICACOES,
  ) {}

  async publicar(
    videoId: string,
    emailUsuario: string,
    mensagemErro: string,
  ): Promise<void> {
    const conteudo = Buffer.from(
      JSON.stringify({ videoId, emailUsuario, mensagemErro }),
    );
    this.canal.sendToQueue(this.fila, conteudo, { persistent: true });
  }
}
