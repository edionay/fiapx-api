import { Controller, Get, Route, Tags } from "@tsoa/runtime";

export interface HealthResposta {
  status: "ok";
  service: string;
  timestamp: string;
  uptime: number;
}

@Route("health")
@Tags("Saúde")
export class HealthController extends Controller {
  @Get()
  public async health(): Promise<HealthResposta> {
    return {
      status: "ok",
      service: "fiapx-api",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
