import type { RepositorioUsuario } from "../dominio/repositorio-usuario.js";
import type { Usuario } from "../dominio/usuario.js";

export class RepositorioUsuarioMemoria implements RepositorioUsuario {
  private readonly porId = new Map<string, Usuario>();
  private readonly porEmail = new Map<string, Usuario>();

  async salvar(usuario: Usuario): Promise<void> {
    this.porId.set(usuario.id, usuario);
    this.porEmail.set(usuario.email, usuario);
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.porEmail.get(email) ?? null;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.porId.get(id) ?? null;
  }
}
