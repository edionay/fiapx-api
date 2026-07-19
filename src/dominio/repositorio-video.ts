import type { Video } from "./video.js";

export interface RepositorioVideo {
  salvar(video: Video): Promise<void>;
  buscarPorId(id: string): Promise<Video | null>;
}
