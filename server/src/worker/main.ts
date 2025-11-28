import * as dotenv from "dotenv";
import "reflect-metadata";
import IORedis from "ioredis";
import { Worker } from "bullmq";
import { Pool } from "pg";

import {
  IWorkflowEngine,
  ITaskEngine,
  ILogEngine,
} from "../core/abstract/database.abstract";
import { PostgresWorkflowService } from "../infra/db/postgres/service/workflow.service";
import { PostgresTaskService } from "../infra/db/postgres/service/task.service";
import { PostgresLogService } from "../infra/db/postgres/service/tasklog.service";
import { createPostgresPool } from "../infra/db/postgres/service/mapper.service";

import { TaskProcessor } from "./taskProcesser";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/workflowdb";

const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
const pool: Pool = createPostgresPool(DB_URL);

const workflowEngine: IWorkflowEngine = new PostgresWorkflowService(pool);
const taskEngine: ITaskEngine = new PostgresTaskService(pool);
const logEngine: ILogEngine = new PostgresLogService(pool);

const processor = new TaskProcessor(
  taskEngine,
  workflowEngine,
  logEngine,
  redisConnection
);

async function runWorkers() {
  console.log("Run workers started");
  const invoiceWorkerHandler = async (job: any) => {
    if (job.name === "collect-orders")
      return processor.handleCollectOrders(job.data);
    if (job.name === "create-invoice")
      return processor.handleCreateInvoice(job.data);
    throw new Error(`Unknown job: ${job.name}`);
  };

  const pdfWorkerHandler = async (job: any) => {
    if (job.name === "generate-pdf")
      return processor.handleGeneratePdf(job.data);
    throw new Error(`Unknown job: ${job.name}`);
  };

  const emailWorkerHandler = async (job: any) => {
    if (job.name === "send-email") return processor.handleSendEmail(job.data);
    throw new Error(`Unknown job: ${job.name}`);
  };

  new Worker("invoice-queue", invoiceWorkerHandler, {
    connection: redisConnection,
  });
  new Worker("pdf-queue", pdfWorkerHandler, { connection: redisConnection });
  new Worker("email-queue", emailWorkerHandler, {
    connection: redisConnection,
  });

  console.log("Workers up and running, using decoupled engine services.");
}

runWorkers().catch((err) => {
  console.error("Worker startup failed", err);
  process.exit(1);
});
