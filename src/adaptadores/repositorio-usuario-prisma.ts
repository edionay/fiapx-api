import type { PrismaClient } from "../gerado/prisma/client.js";
import type { RepositorioUsuario } from "../dominio/repositorio-usuario.js";
import type { Usuario } from "../dominio/usuario.js";

export class RepositorioUsuarioPrisma implements RepositorioUsuario {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(usuario: Usuario): Promise<void> {
    await this.prisma.usuario.upsert({
      where: { id: usuario.id },
      update: {
        email: usuario.email,
        senhaHash: usuario.senhaHash,
      },
      create: {
        id: usuario.id,
        email: usuario.email,
        senhaHash: usuario.senhaHash,
        criadoEm: usuario.criadoEm,
      },
    });
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }
}
