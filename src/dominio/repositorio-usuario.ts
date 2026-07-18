import type { Usuario } from "./usuario.js";

export interface RepositorioUsuario {
  salvar(usuario: Usuario): Promise<void>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
}
