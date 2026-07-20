import { container } from "tsyringe";
import type { IocContainer, ServiceIdentifier } from "@tsoa/runtime";

export const iocContainer: IocContainer = {
  get<T>(controller: ServiceIdentifier<T>): T {
    return container.resolve<T>(controller as never);
  },
};
