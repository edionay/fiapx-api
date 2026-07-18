import bcrypt from "bcryptjs";
import type { HashSenha } from "../aplicacao/portas.js";

export class HashSenhaBcrypt implements HashSenha {
  constructor(private readonly rodadas = 10) {}

  async gerar(senhaPura: string): Promise<string> {
    return bcrypt.hash(senhaPura, this.rodadas);
  }

  async conferir(senhaPura: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senhaPura, hash);
  }
}
