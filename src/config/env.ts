export interface Env {
  readonly port: number;
  readonly nodeEnv: string;
  readonly jwtSecret: string;
  readonly jwtExpiracaoSegundos: number;
}

function readInt(raw: string | undefined, fallback: number, nome: string): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${nome} inválida: "${raw}"`);
  }
  return parsed;
}

function readPort(raw: string | undefined, fallback: number): number {
  const porta = readInt(raw, fallback, "PORT");
  if (porta > 65535) throw new Error(`PORT inválida: "${raw}"`);
  return porta;
}

function readSecret(raw: string | undefined, nodeEnv: string): string {
  if (raw !== undefined && raw.trim() !== "") return raw;
  if (nodeEnv === "production") {
    throw new Error("JWT_SECRET é obrigatório quando NODE_ENV=production");
  }
  return "segredo-de-desenvolvimento-nao-usar-em-producao";
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const env: Env = {
  port: readPort(process.env.PORT, 3000),
  nodeEnv,
  jwtSecret: readSecret(process.env.JWT_SECRET, nodeEnv),
  jwtExpiracaoSegundos: readInt(process.env.JWT_EXPIRACAO_SEGUNDOS, 3600, "JWT_EXPIRACAO_SEGUNDOS"),
};
