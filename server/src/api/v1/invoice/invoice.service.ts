import { Inject, Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { IWorkflowEngine } from "../../../core/abstract/database.abstract";
import { Task } from "../../../core/abstract/database.abstract";

export const WORKFLOW_ENGINE_TOKEN = "IWorkflowEngine";

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(WORKFLOW_ENGINE_TOKEN) private workflowEngine: IWorkflowEngine,
    @Inject("INVOICE_QUEUE") private invoiceQueue: Queue
  ) {}

  async startInvoiceWorkflow(customerId: string) {
    const workflowName = `invoice:${customerId}`;
    const taskType = "collect_orders";
    const payload = { customerId };
    const idempotencyKey = `collect:${customerId}:${new Date()
      .toISOString()
      .slice(0, 10)}`;

    console.log("Invoice service: Starting invoice workflow...");

    const workflow = await this.workflowEngine.createWorkflow(workflowName, {
      customerId,
    });
    const workflowId = workflow.id;

    console.log(`Workflow created successfully: ${workflowId}`);

    const task: Task = await this.workflowEngine.queueNewTask(
      workflowId,
      taskType,
      payload,
      undefined, // scheduledAt
      idempotencyKey
    );
    const taskId = task.id;

    console.log(`Task created: ${taskId} (Type: ${taskType})`);

    await this.invoiceQueue.add(
      "collect-orders",
      { workflowId, taskId, customerId },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
        jobId: taskId,
      }
    );

    const updatedWf = await this.workflowEngine.updateWorkflowStatus(
      workflowId,
      "running",
      "collect_orders"
    );

    console.log(
      `Workflow updated to status: ${updatedWf.status} at step: ${updatedWf.currentStep}`
    );

    return { workflowId, taskId };
  }
}
