"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresWorkflowService = void 0;
const mapper_service_1 = require("./mapper.service");
class PostgresWorkflowService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async createWorkflow(name, metadata = {}) {
        const query = `
      INSERT INTO workflows (name, metadata)
      VALUES ($1, $2)
      RETURNING *
    `;
        const result = await this.pool.query(query, [name, metadata]);
        return (0, mapper_service_1.mapRowToWorkflow)(result.rows[0]);
    }
    async getWorkflow(id) {
        const query = "SELECT * FROM workflows WHERE id = $1";
        const result = await this.pool.query(query, [id]);
        return result.rows.length > 0 ? (0, mapper_service_1.mapRowToWorkflow)(result.rows[0]) : null;
    }
    async updateWorkflowStatus(id, status, currentStep) {
        const query = `
      UPDATE workflows
      SET status = $2, current_step = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
        const result = await this.pool.query(query, [
            id,
            status,
            currentStep || null,
        ]);
        if (result.rows.length === 0) {
            throw new Error(`Workflow with ID ${id} not found.`);
        }
        return (0, mapper_service_1.mapRowToWorkflow)(result.rows[0]);
    }
    async queueNewTask(workflowId, type, payload, scheduledAt, idempotencyKey) {
        const query = `
      INSERT INTO tasks (workflow_id, type, payload, scheduled_at, idempotency_key)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        const values = [
            workflowId,
            type,
            payload,
            scheduledAt || null,
            idempotencyKey || null,
        ];
        const result = await this.pool.query(query, values);
        return (0, mapper_service_1.mapRowToTask)(result.rows[0]);
    }
}
exports.PostgresWorkflowService = PostgresWorkflowService;
//# sourceMappingURL=workflow.service.js.map