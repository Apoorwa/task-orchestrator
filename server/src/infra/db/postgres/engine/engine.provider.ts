import { Provider } from "@nestjs/common";
import { Pool } from "pg";
import {
  IWorkflowEngine,
  ITaskEngine,
  ILogEngine,
} from "../../../../core/abstract/database.abstract";
import {
  WORKFLOW_ENGINE_TOKEN,
  TASK_ENGINE_TOKEN,
  LOG_ENGINE_TOKEN,
} from "./engine.tokens";
import { PostgresWorkflowService } from "../service/workflow.service";
import { PostgresTaskService } from "../service/task.service";
import { PostgresLogService } from "../service/tasklog.service";
import { createPostgresPool } from "../service/mapper.service";

const POSTGRES_CONNECTION_STRING =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/workflowdb?schema=public";

console.log("Connection string. is : ", POSTGRES_CONNECTION_STRING);

export const PostgresPoolProvider: Provider = {
  provide: Pool,
  useValue: createPostgresPool(POSTGRES_CONNECTION_STRING),
};

export const WorkflowEngineProvider: Provider = {
  provide: WORKFLOW_ENGINE_TOKEN,
  useFactory: (pool: Pool): IWorkflowEngine =>
    new PostgresWorkflowService(pool),
  inject: [Pool],
};

export const TaskEngineProvider: Provider = {
  provide: TASK_ENGINE_TOKEN,
  useFactory: (pool: Pool): ITaskEngine => new PostgresTaskService(pool),
  inject: [Pool],
};

export const LogEngineProvider: Provider = {
  provide: LOG_ENGINE_TOKEN,
  useFactory: (pool: Pool): ILogEngine => new PostgresLogService(pool),
  inject: [Pool],
};

export const EngineProviders = [
  PostgresPoolProvider,
  WorkflowEngineProvider,
  TaskEngineProvider,
  LogEngineProvider,
];
