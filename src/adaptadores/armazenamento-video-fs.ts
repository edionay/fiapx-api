import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArmazenamentoVideo } from "../aplicacao/portas.js";

export class ArmazenamentoVideoSistemaArquivos implements ArmazenamentoVideo {
  constructor(private readonly diretorio: string) {}

  async salvarEntrada(
    videoId: string,
    nomeOriginal: string,
    conteudo: Buffer,
  ): Promise<string> {
    await mkdir(this.diretorio, { recursive: true });
    const extensao = path.extname(nomeOriginal);
    const destino = path.join(this.diretorio, `${videoId}${extensao}`);
    await writeFile(destino, conteudo);
    return destino;
  }
}
