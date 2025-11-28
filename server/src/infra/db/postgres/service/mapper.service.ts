import { Pool } from "pg";
import {
  Workflow,
  Task,
  TaskLog,
} from "../../../../core/abstract/database.abstract";

export function createPostgresPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

export function mapRowToWorkflow(row: any): Workflow {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    currentStep: row.current_step,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRowToTask(row: any): Task {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    type: row.type,
    status: row.status,
    payload: row.payload,
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
    idempotencyKey: row.idempotency_key,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRowToTaskLog(row: any): TaskLog {
  return {
    id: row.id,
    taskId: row.task_id,
    level: row.level,
    message: row.message,
    createdAt: row.created_at,
  };
}
