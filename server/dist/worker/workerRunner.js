"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
require("reflect-metadata");
const ioredis_1 = require("ioredis");
const bullmq_1 = require("bullmq");
const workflow_service_1 = require("../infra/db/postgres/service/workflow.service");
const task_service_1 = require("../infra/db/postgres/service/task.service");
const tasklog_service_1 = require("../infra/db/postgres/service/tasklog.service");
const mapper_service_1 = require("../infra/db/postgres/service/mapper.service");
const taskProcesser_1 = require("./taskProcesser");
dotenv.config();
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const DB_URL = process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/workflowdb";
const redisConnection = new ioredis_1.default(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
const pool = (0, mapper_service_1.createPostgresPool)(DB_URL);
const workflowEngine = new workflow_service_1.PostgresWorkflowService(pool);
const taskEngine = new task_service_1.PostgresTaskService(pool);
const logEngine = new tasklog_service_1.PostgresLogService(pool);
const processor = new taskProcesser_1.TaskProcessor(taskEngine, workflowEngine, logEngine, redisConnection);
async function runWorkers() {
    const invoiceWorkerHandler = async (job) => {
        if (job.name === "collect-orders")
            return processor.handleCollectOrders(job.data);
        if (job.name === "create-invoice")
            return processor.handleCreateInvoice(job.data);
        throw new Error(`Unknown job: ${job.name}`);
    };
    const pdfWorkerHandler = async (job) => {
        if (job.name === "generate-pdf")
            return processor.handleGeneratePdf(job.data);
        throw new Error(`Unknown job: ${job.name}`);
    };
    const emailWorkerHandler = async (job) => {
        if (job.name === "send-email")
            return processor.handleSendEmail(job.data);
        throw new Error(`Unknown job: ${job.name}`);
    };
    new bullmq_1.Worker("invoice-queue", invoiceWorkerHandler, {
        connection: redisConnection,
    });
    new bullmq_1.Worker("pdf-queue", pdfWorkerHandler, { connection: redisConnection });
    new bullmq_1.Worker("email-queue", emailWorkerHandler, {
        connection: redisConnection,
    });
    console.log("Workers up and running, using decoupled engine services.");
}
runWorkers().catch((err) => {
    console.error("Worker startup failed", err);
    process.exit(1);
});
//# sourceMappingURL=workerRunner.js.map