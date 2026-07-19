export interface HashSenha {
  gerar(senhaPura: string): Promise<string>;
  conferir(senhaPura: string, hash: string): Promise<boolean>;
}

export interface GeradorId {
  gerar(): string;
}

export interface PayloadToken {
  sub: string;
  email: string;
}

export interface ServicoToken {
  emitir(payload: PayloadToken): string;
  verificar(token: string): PayloadToken;
}

export interface ArmazenamentoVideo {
  salvarEntrada(videoId: string, nomeOriginal: string, conteudo: Buffer): Promise<string>;
}
