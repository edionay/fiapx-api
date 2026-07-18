import { describe, it, expect, beforeEach } from "vitest";
import { CadastrarUsuario } from "../../src/aplicacao/cadastrar-usuario.js";
import { RepositorioUsuarioMemoria } from "../../src/adaptadores/repositorio-usuario-memoria.js";
import { DadosInvalidos, EmailJaCadastrado } from "../../src/dominio/erros.js";
import type { GeradorId, HashSenha } from "../../src/aplicacao/portas.js";

const hashFake: HashSenha = {
  gerar: async (senha) => `hash:${senha}`,
  conferir: async (senha, hash) => hash === `hash:${senha}`,
};

function geradorSequencial(): GeradorId {
  let n = 0;
  return { gerar: () => `id-${++n}` };
}

describe("CadastrarUsuario", () => {
  let repositorio: RepositorioUsuarioMemoria;
  let cadastrar: CadastrarUsuario;

  beforeEach(() => {
    repositorio = new RepositorioUsuarioMemoria();
    cadastrar = new CadastrarUsuario(repositorio, hashFake, geradorSequencial());
  });

  it("cadastra e retorna id com e-mail normalizado", async () => {
    const resultado = await cadastrar.executar({
      email: "  Fulano@Email.com ",
      senha: "senhaforte1",
    });

    expect(resultado).toEqual({ id: "id-1", email: "fulano@email.com" });

    const salvo = await repositorio.buscarPorEmail("fulano@email.com");
    expect(salvo?.senhaHash).toBe("hash:senhaforte1");
  });

  it("rejeita e-mail inválido", async () => {
    await expect(
      cadastrar.executar({ email: "sem-arroba", senha: "senhaforte1" }),
    ).rejects.toBeInstanceOf(DadosInvalidos);
  });

  it("rejeita senha curta", async () => {
    await expect(
      cadastrar.executar({ email: "a@b.com", senha: "1234" }),
    ).rejects.toBeInstanceOf(DadosInvalidos);
  });

  it("rejeita e-mail já cadastrado", async () => {
    await cadastrar.executar({ email: "a@b.com", senha: "senhaforte1" });
    await expect(
      cadastrar.executar({ email: "a@b.com", senha: "outrasenha1" }),
    ).rejects.toBeInstanceOf(EmailJaCadastrado);
  });
});
