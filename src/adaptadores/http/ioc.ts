import type { IocContainer, ServiceIdentifier } from "@tsoa/runtime";
import { HealthController } from "../../controllers/health.js";
import { AuthController } from "../../controllers/auth.js";
import { obterDependencias } from "./composicao.js";

export const iocContainer: IocContainer = {
  get<T>(controller: ServiceIdentifier<T>): T {
    if (controller === (HealthController as unknown as ServiceIdentifier<T>)) {
      return new HealthController() as unknown as T;
    }
    if (controller === (AuthController as unknown as ServiceIdentifier<T>)) {
      const deps = obterDependencias();
      return new AuthController(
        deps.cadastrarUsuario,
        deps.autenticarUsuario,
        deps.repositorioUsuario,
      ) as unknown as T;
    }
    const Construtor = controller as new () => T;
    return new Construtor();
  },
};
