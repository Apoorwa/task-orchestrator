import { Module, Global } from "@nestjs/common";
import {
  WORKFLOW_ENGINE_TOKEN,
  TASK_ENGINE_TOKEN,
  LOG_ENGINE_TOKEN,
} from "./engine.tokens";
import { EngineProviders } from "./engine.provider";

@Global()
@Module({
  providers: EngineProviders,

  exports: [WORKFLOW_ENGINE_TOKEN, TASK_ENGINE_TOKEN, LOG_ENGINE_TOKEN],
})
export class EngineModule {}
