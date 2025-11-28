import { Pool, QueryResult } from "pg";
import { ITaskEngine, Task } from "../../../../core/abstract/database.abstract";
import { mapRowToTask } from "./mapper.service";

export class PostgresTaskService implements ITaskEngine {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  public async getTask(id: string): Promise<Task | null> {
    const query = "SELECT * FROM tasks WHERE id = $1";
    const result: QueryResult = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? mapRowToTask(result.rows[0]) : null;
  }

  public async fetchReadyTasks(limit: number): Promise<Task[]> {
    const query = `
      SELECT * FROM tasks 
      WHERE status = 'queued'
        AND (scheduled_at IS NULL OR scheduled_at <= NOW())
      ORDER BY created_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED; -- Ensures concurrent workers pick up different tasks
    `;
    const result: QueryResult = await this.pool.query(query, [limit]);
    return result.rows.map(mapRowToTask);
  }

  public async updateTaskExecution(
    id: string,
    status: Task["status"],
    updates: Partial<
      Pick<Task, "startedAt" | "finishedAt" | "error" | "retryCount">
    >
  ): Promise<Task> {
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

    const result: QueryResult = await this.pool.query(query, finalValues);

    if (result.rows.length === 0) {
      throw new Error(`Task with ID ${id} not found for update.`);
    }
    return mapRowToTask(result.rows[0]);
  }
}
