"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresTaskService = void 0;
const mapper_service_1 = require("./mapper.service");
class PostgresTaskService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getTask(id) {
        const query = "SELECT * FROM tasks WHERE id = $1";
        const result = await this.pool.query(query, [id]);
        return result.rows.length > 0 ? (0, mapper_service_1.mapRowToTask)(result.rows[0]) : null;
    }
    async fetchReadyTasks(limit) {
        const query = `
      SELECT * FROM tasks 
      WHERE status = 'queued'
        AND (scheduled_at IS NULL OR scheduled_at <= NOW())
      ORDER BY created_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED; -- Ensures concurrent workers pick up different tasks
    `;
        const result = await this.pool.query(query, [limit]);
        return result.rows.map(mapper_service_1.mapRowToTask);
    }
    async updateTaskExecution(id, status, updates) {
        const query = `
      UPDATE tasks
      SET status = $2, 
          started_at = COALESCE($3, started_at), 
          finished_at = COALESCE($4, finished_at),
          error = $5, 
          retry_count = COALESCE($6, retry_count),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
        const finalValues = [
            id,
            status,
            updates.startedAt || null,
            updates.finishedAt || null,
            updates.error !== undefined ? updates.error : null,
            updates.retryCount || null,
        ];
        const result = await this.pool.query(query, finalValues);
        if (result.rows.length === 0) {
            throw new Error(`Task with ID ${id} not found for update.`);
        }
        return (0, mapper_service_1.mapRowToTask)(result.rows[0]);
    }
}
exports.PostgresTaskService = PostgresTaskService;
//# sourceMappingURL=task.service.js.map