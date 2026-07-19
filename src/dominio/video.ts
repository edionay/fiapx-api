export type StatusVideo = "PENDENTE" | "PROCESSANDO" | "CONCLUIDO" | "ERRO";

export interface Video {
  id: string;
  usuarioId: string;
  nomeOriginal: string;
  caminhoEntrada: string;
  status: StatusVideo;
  caminhoZip: string | null;
  mensagemErro: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}
