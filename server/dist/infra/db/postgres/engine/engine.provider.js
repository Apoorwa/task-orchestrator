"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineProviders = exports.LogEngineProvider = exports.TaskEngineProvider = exports.WorkflowEngineProvider = exports.PostgresPoolProvider = void 0;
const pg_1 = require("pg");
const engine_tokens_1 = require("./engine.tokens");
const workflow_service_1 = require("../service/workflow.service");
const task_service_1 = require("../service/task.service");
const tasklog_service_1 = require("../service/tasklog.service");
const mapper_service_1 = require("../service/mapper.service");
const POSTGRES_CONNECTION_STRING = process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/workflowdb?schema=public";
console.log("Connection string. is : ", POSTGRES_CONNECTION_STRING);
exports.PostgresPoolProvider = {
    provide: pg_1.Pool,
    useValue: (0, mapper_service_1.createPostgresPool)(POSTGRES_CONNECTION_STRING),
};
exports.WorkflowEngineProvider = {
    provide: engine_tokens_1.WORKFLOW_ENGINE_TOKEN,
    useFactory: (pool) => new workflow_service_1.PostgresWorkflowService(pool),
    inject: [pg_1.Pool],
};
exports.TaskEngineProvider = {
    provide: engine_tokens_1.TASK_ENGINE_TOKEN,
    useFactory: (pool) => new task_service_1.PostgresTaskService(pool),
    inject: [pg_1.Pool],
};
exports.LogEngineProvider = {
    provide: engine_tokens_1.LOG_ENGINE_TOKEN,
    useFactory: (pool) => new tasklog_service_1.PostgresLogService(pool),
    inject: [pg_1.Pool],
};
exports.EngineProviders = [
    exports.PostgresPoolProvider,
    exports.WorkflowEngineProvider,
    exports.TaskEngineProvider,
    exports.LogEngineProvider,
];
//# sourceMappingURL=engine.provider.js.map