"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPostgresPool = createPostgresPool;
exports.mapRowToWorkflow = mapRowToWorkflow;
exports.mapRowToTask = mapRowToTask;
exports.mapRowToTaskLog = mapRowToTaskLog;
const pg_1 = require("pg");
function createPostgresPool(connectionString) {
    return new pg_1.Pool({ connectionString });
}
function mapRowToWorkflow(row) {
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
function mapRowToTask(row) {
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
function mapRowToTaskLog(row) {
    return {
        id: row.id,
        taskId: row.task_id,
        level: row.level,
        message: row.message,
        createdAt: row.created_at,
    };
}
//# sourceMappingURL=mapper.service.js.map