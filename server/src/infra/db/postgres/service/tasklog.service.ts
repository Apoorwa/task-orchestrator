import { Pool, QueryResult } from "pg";
import {
  ILogEngine,
  TaskLog,
} from "../../../../core/abstract/database.abstract";
import { mapRowToTaskLog } from "./mapper.service";

export class PostgresLogService implements ILogEngine {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  public async recordTaskLog(
    taskId: string,
    level: TaskLog["level"] = "info",
    message: string
  ): Promise<TaskLog> {
    const query = `
      INSERT INTO task_logs (task_id, level, message)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [taskId, level, message];
    const result: QueryResult = await this.pool.query(query, values);
    return mapRowToTaskLog(result.rows[0]);
  }

  public async getTaskLogs(taskId: string): Promise<TaskLog[]> {
    const query =
      "SELECT * FROM task_logs WHERE task_id = $1 ORDER BY created_at ASC";
    const result: QueryResult = await this.pool.query(query, [taskId]);
    return result.rows.map(mapRowToTaskLog);
  }
}
