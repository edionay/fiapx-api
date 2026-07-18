/**
 * Configuração lida do ambiente. Mantida em um único lugar para que o restante
 * do código não acesse `process.env` diretamente.
 */
export interface Env {
  readonly port: number;
  readonly nodeEnv: string;
}

function readPort(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`PORT inválida: "${raw}"`);
  }
  return parsed;
}

export const env: Env = {
  port: readPort(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
};
