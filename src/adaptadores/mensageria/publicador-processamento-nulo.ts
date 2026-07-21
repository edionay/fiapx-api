import type { PublicadorProcessamento } from "../../aplicacao/portas.js";

export class PublicadorProcessamentoNulo implements PublicadorProcessamento {
  async publicar(): Promise<void> {}
}
