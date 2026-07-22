import type { PublicadorNotificacao } from "../../aplicacao/portas.js";

export class PublicadorNotificacaoNulo implements PublicadorNotificacao {
  async publicar(): Promise<void> {}
}
