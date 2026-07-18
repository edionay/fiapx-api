export const TAMANHO_MINIMO_SENHA = 8;

const PADRAO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizarEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function ehEmailValido(email: string): boolean {
  return PADRAO_EMAIL.test(email);
}
