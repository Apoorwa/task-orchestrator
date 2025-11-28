export interface Workflow {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  currentStep?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  workflowId: string;
  type: string;
  status: "queued" | "running" | "completed" | "failed" | "retrying" | string;
  payload: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  idempotencyKey?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  finishedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskLog {
  id: string;
  taskId: string;
  level?: "info" | "warn" | "error" | string;
  message?: string;
  createdAt: Date;
}

export interface IWorkflowEngine {
  createWorkflow(
    name: string,
    metadata?: Record<string, any>
  ): Promise<Workflow>;

  getWorkflow(id: string): Promise<Workflow | null>;

  updateWorkflowStatus(
    id: string,
    status: Workflow["status"],
    currentStep?: string
  ): Promise<Workflow>;

  queueNewTask(
    workflowId: string,
    type: string,
    payload: Record<string, any>,
    scheduledAt?: Date,
    idempotencyKey?: string
  ): Promise<Task>;
}

export interface ITaskEngine {
  fetchReadyTasks(limit: number): Promise<Task[]>;

  getTask(id: string): Promise<Task | null>;

  updateTaskExecution(
    id: string,
    status: Task["status"],
    updates: Partial<
      Pick<Task, "startedAt" | "finishedAt" | "error" | "retryCount">
    >
  ): Promise<Task>;
}

export interface ILogEngine {
  recordTaskLog(
    taskId: string,
    level: TaskLog["level"],
    message: string
  ): Promise<TaskLog>;

  getTaskLogs(taskId: string): Promise<TaskLog[]>;
}

export interface IWorkflowEngineDB {
  getWorkflow(id: string): Promise<Workflow | null>;
  createWorkFlow(
    name: string,
    metadata: Record<string, any>
  ): Promise<Workflow>;
  getReadyTasks(limit: number): Promise<Task[]>;
  updateTaskStatus(
    id: string,
    status: Task["status"],
    updates: Partial<
      Pick<Task, "startedAt" | "finishedAt" | "error" | "retryCount">
    >
  ): Promise<Task>;
  addTaskLog(
    taskId: string,
    level: TaskLog["level"],
    message: string
  ): Promise<TaskLog>;
  getTaskLog(taskId: string): Promise<TaskLog[]>;
}
