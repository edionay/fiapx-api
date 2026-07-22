import type { Channel, ConsumeMessage } from "amqplib";
import type { RegistrarResultado } from "../../aplicacao/registrar-resultado.js";

export const FILA_RESULTADO = "videos.resultado";

export function iniciarConsumoResultado(
  canal: Channel,
  registrar: RegistrarResultado,
  fila: string = FILA_RESULTADO,
): Promise<unknown> {
  return canal.consume(fila, (mensagem: ConsumeMessage | null) => {
    if (mensagem === null) {
      return;
    }
    void (async () => {
      try {
        const corpo = JSON.parse(mensagem.content.toString());
        const aplicada = await registrar.executar(corpo);
        if (!aplicada) {
          console.warn("videos.resultado descartada:", mensagem.content.toString());
        }
      } catch (erro) {
        console.error("erro ao tratar videos.resultado:", erro);
      } finally {
        canal.ack(mensagem);
      }
    })();
  });
}
