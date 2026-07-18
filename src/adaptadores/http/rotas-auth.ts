import { Router, type RequestHandler } from "express";
import type { AutenticarUsuario } from "../../aplicacao/autenticar-usuario.js";
import type { CadastrarUsuario } from "../../aplicacao/cadastrar-usuario.js";
import type { RepositorioUsuario } from "../../dominio/repositorio-usuario.js";
import "./tipos.js";

export interface DependenciasAuth {
  cadastrar: CadastrarUsuario;
  autenticar: AutenticarUsuario;
  middlewareAuth: RequestHandler;
  repositorio: RepositorioUsuario;
}

export function rotasAuth(deps: DependenciasAuth): Router {
  const router = Router();

  router.post("/auth/cadastro", async (req, res) => {
    const corpo = req.body ?? {};
    const resultado = await deps.cadastrar.executar({
      email: corpo.email,
      senha: corpo.senha,
    });
    res.status(201).json(resultado);
  });

  router.post("/auth/login", async (req, res) => {
    const corpo = req.body ?? {};
    const resultado = await deps.autenticar.executar({
      email: corpo.email,
      senha: corpo.senha,
    });
    res.json(resultado);
  });

  router.get("/auth/eu", deps.middlewareAuth, async (req, res) => {
    const usuario = await deps.repositorio.buscarPorId(req.usuario!.id);
    if (usuario === null) {
      res.status(404).json({ erro: "Usuário não encontrado" });
      return;
    }
    res.json({
      id: usuario.id,
      email: usuario.email,
      criadoEm: usuario.criadoEm.toISOString(),
    });
  });

  return router;
}
