import { randomUUID } from "node:crypto";
import type { GeradorId } from "../aplicacao/portas.js";

export class GeradorIdUuid implements GeradorId {
  gerar(): string {
    return randomUUID();
  }
}
