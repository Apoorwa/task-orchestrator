import { Pool, QueryResult } from "pg";
import {
  IWorkflowEngine,
  Workflow,
  Task,
} from "../../../../core/abstract/database.abstract";
import { mapRowToWorkflow, mapRowToTask } from "./mapper.service";

export class PostgresWorkflowService implements IWorkflowEngine {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  public async createWorkflow(
    name: string,
    metadata: Record<string, any> = {}
  ): Promise<Workflow> {
    const query = `
      INSERT INTO workflows (name, metadata)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result: QueryResult = await this.pool.query(query, [name, metadata]);
    return mapRowToWorkflow(result.rows[0]);
  }

  public async getWorkflow(id: string): Promise<Workflow | null> {
    const query = "SELECT * FROM workflows WHERE id = $1";
    const result: QueryResult = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? mapRowToWorkflow(result.rows[0]) : null;
  }

  public async updateWorkflowStatus(
    id: string,
    status: Workflow["status"],
    currentStep?: string
  ): Promise<Workflow> {
    const query = `
      UPDATE workflows
      SET status = $2, current_step = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result: QueryResult = await this.pool.query(query, [
      id,
      status,
      currentStep || null,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Workflow with ID ${id} not found.`);
    }
    return mapRowToWorkflow(result.rows[0]);
  }

  public async queueNewTask(
    workflowId: string,
    type: string,
    payload: Record<string, any>,
    scheduledAt?: Date,
    idempotencyKey?: string
  ): Promise<Task> {
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
    const result: QueryResult = await this.pool.query(query, values);
    return mapRowToTask(result.rows[0]);
  }
}
