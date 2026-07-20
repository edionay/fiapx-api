import type { CadastrarUsuario } from "../../aplicacao/cadastrar-usuario.js";
import type { AutenticarUsuario } from "../../aplicacao/autenticar-usuario.js";
import type { RepositorioUsuario } from "../../dominio/repositorio-usuario.js";

export interface Dependencias {
  cadastrarUsuario: CadastrarUsuario;
  autenticarUsuario: AutenticarUsuario;
  repositorioUsuario: RepositorioUsuario;
}

let atual: Dependencias | undefined;

export function definirDependencias(dependencias: Dependencias): void {
  atual = dependencias;
}

export function obterDependencias(): Dependencias {
  if (atual === undefined) {
    throw new Error("Dependências da aplicação não foram configuradas");
  }
  return atual;
}
