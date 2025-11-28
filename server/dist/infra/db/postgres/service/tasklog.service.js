"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresLogService = void 0;
const mapper_service_1 = require("./mapper.service");
class PostgresLogService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async recordTaskLog(taskId, level = "info", message) {
        const query = `
      INSERT INTO task_logs (task_id, level, message)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const values = [taskId, level, message];
        const result = await this.pool.query(query, values);
        return (0, mapper_service_1.mapRowToTaskLog)(result.rows[0]);
    }
    async getTaskLogs(taskId) {
        const query = "SELECT * FROM task_logs WHERE task_id = $1 ORDER BY created_at ASC";
        const result = await this.pool.query(query, [taskId]);
        return result.rows.map(mapper_service_1.mapRowToTaskLog);
    }
}
exports.PostgresLogService = PostgresLogService;
//# sourceMappingURL=tasklog.service.js.map