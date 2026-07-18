import { describe, it, expect, beforeEach } from "vitest";
import { AutenticarUsuario } from "../../src/aplicacao/autenticar-usuario.js";
import { RepositorioUsuarioMemoria } from "../../src/adaptadores/repositorio-usuario-memoria.js";
import { CredenciaisInvalidas } from "../../src/dominio/erros.js";
import type { HashSenha, PayloadToken, ServicoToken } from "../../src/aplicacao/portas.js";

const hashFake: HashSenha = {
  gerar: async (senha) => `hash:${senha}`,
  conferir: async (senha, hash) => hash === `hash:${senha}`,
};

const tokenFake: ServicoToken = {
  emitir: (payload: PayloadToken) => `token:${payload.sub}`,
  verificar: (token) => ({ sub: token.replace("token:", ""), email: "" }),
};

describe("AutenticarUsuario", () => {
  let repositorio: RepositorioUsuarioMemoria;
  let autenticar: AutenticarUsuario;

  beforeEach(async () => {
    repositorio = new RepositorioUsuarioMemoria();
    autenticar = new AutenticarUsuario(repositorio, hashFake, tokenFake);
    await repositorio.salvar({
      id: "u1",
      email: "a@b.com",
      senhaHash: "hash:senhaforte1",
      criadoEm: new Date(),
    });
  });

  it("emite token com credenciais válidas", async () => {
    const resultado = await autenticar.executar({
      email: "A@B.com",
      senha: "senhaforte1",
    });
    expect(resultado.token).toBe("token:u1");
  });

  it("rejeita senha incorreta", async () => {
    await expect(
      autenticar.executar({ email: "a@b.com", senha: "errada" }),
    ).rejects.toBeInstanceOf(CredenciaisInvalidas);
  });

  it("rejeita usuário inexistente", async () => {
    await expect(
      autenticar.executar({ email: "nao@existe.com", senha: "senhaforte1" }),
    ).rejects.toBeInstanceOf(CredenciaisInvalidas);
  });
});
