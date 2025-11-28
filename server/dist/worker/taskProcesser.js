"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskProcessor = void 0;
const bullmq_1 = require("bullmq");
const INVOICE_QUEUE_NAME = "invoice-queue";
const PDF_QUEUE_NAME = "pdf-queue";
const EMAIL_QUEUE_NAME = "email-queue";
class TaskProcessor {
    taskEngine;
    workflowEngine;
    logEngine;
    invoiceQueue;
    pdfQueue;
    emailQueue;
    redisConnection;
    constructor(taskEngine, workflowEngine, logEngine, redisConnection) {
        this.taskEngine = taskEngine;
        this.workflowEngine = workflowEngine;
        this.logEngine = logEngine;
        this.redisConnection = redisConnection;
        this.invoiceQueue = new bullmq_1.Queue(INVOICE_QUEUE_NAME, {
            connection: this.redisConnection,
        });
        this.pdfQueue = new bullmq_1.Queue(PDF_QUEUE_NAME, {
            connection: this.redisConnection,
        });
        this.emailQueue = new bullmq_1.Queue(EMAIL_QUEUE_NAME, {
            connection: this.redisConnection,
        });
    }
    async handleExecutionStart(taskId) {
        try {
            const task = await this.taskEngine.getTask(taskId);
            if (!task) {
                await this.logEngine.recordTaskLog(taskId, "error", "Task not found in DB.");
                throw new Error(`Task ${taskId} not found.`);
            }
            if (task.status === "completed") {
                await this.logEngine.recordTaskLog(taskId, "info", "Task already completed (idempotency)");
                throw new Error("Task already completed.");
            }
            await this.logEngine.recordTaskLog(taskId, "info", "Starting execution.");
            return this.taskEngine.updateTaskExecution(taskId, "running", {
                startedAt: new Date(),
            });
        }
        catch (error) {
            console.log("Errorrr:::: ", error);
        }
    }
    async handleExecutionSuccess(taskId, newPayload) {
        await this.taskEngine.updateTaskExecution(taskId, "completed", {
            finishedAt: new Date(),
        });
        await this.logEngine.recordTaskLog(taskId, "info", "Execution succeeded.");
    }
    async handleExecutionFailure(taskId, error) {
        console.error(`DB Execution Failure for Task ${taskId}: ${error.message}`);
        await this.taskEngine.updateTaskExecution(taskId, "retrying", {
            error: error.message,
            retryCount: 1,
        });
        await this.logEngine.recordTaskLog(taskId, "error", `Execution failed: ${error.message}`);
    }
    async handleCollectOrders(jobData) {
        const { taskId, workflowId, customerId } = jobData;
        console.log(`Worker: Processing COLLECT ORDERS for task ${taskId}`);
        try {
            await this.handleExecutionStart(taskId);
            const toInvoice = [
                {
                    id: "o1-dummy",
                    status: "DELIVERED",
                    invoiced: false,
                    price: 100,
                },
            ];
            await this.logEngine.recordTaskLog(taskId, "info", `Collected ${toInvoice.length} orders to invoice.`);
            const newPayload = { customerId, collectedOrders: toInvoice };
            await this.handleExecutionSuccess(taskId, newPayload);
            const nextTaskType = "create-invoice";
            const nextTaskPayload = { customerId, orders: toInvoice };
            const nextTask = await this.workflowEngine.queueNewTask(workflowId, nextTaskType, nextTaskPayload);
            await this.invoiceQueue.add(nextTaskType, { workflowId, taskId: nextTask.id, invoiceData: nextTaskPayload }, { attempts: 5, jobId: nextTask.id });
            await this.logEngine.recordTaskLog(taskId, "info", `Queued next task: ${nextTask.id}`);
            return { ok: true, nextTaskId: nextTask.id };
        }
        catch (err) {
            await this.handleExecutionFailure(taskId, err);
            throw err;
        }
    }
    async handleCreateInvoice(jobData) {
        const { taskId, workflowId, invoiceData } = jobData;
        console.log(`Worker: Processing CREATE INVOICE for task ${taskId}`);
        try {
            await this.handleExecutionStart(taskId);
            const invoice = {
                id: `inv-${Date.now()}`,
                createdAt: new Date().toISOString(),
            };
            await this.logEngine.recordTaskLog(taskId, "info", `Created invoice ${invoice.id} `);
            await this.handleExecutionSuccess(taskId, { ...invoiceData, invoice });
            await this.pdfQueue.add("generate-pdf", { workflowId, taskId, invoice }, { attempts: 3 });
            return { invoice };
        }
        catch (err) {
            await this.handleExecutionFailure(taskId, err);
            throw err;
        }
    }
    async handleGeneratePdf(jobData) {
        const { workflowId, taskId, invoice } = jobData;
        console.log(`Worker: Generating PDF for invoice ${invoice.id}`);
        try {
            await this.logEngine.recordTaskLog(taskId, "info", "Simulating PDF generation.");
            await this.emailQueue.add("send-email", { workflowId, taskId, invoice, attachments: ["invoice.pdf"] }, { attempts: 3 });
            return { ok: true };
        }
        catch (err) {
            console.error(`PDF Generation failed for invoice ${invoice.id}. DB Error:`, err.message);
            throw err;
        }
    }
    async handleSendEmail(jobData) {
        const { workflowId, taskId, invoice } = jobData;
        console.log(`Worker: Sending email for invoice ${invoice.id} and workflowId ${workflowId}`);
        try {
            await this.workflowEngine.updateWorkflowStatus(workflowId, "completed", "send-email");
            await this.logEngine.recordTaskLog(taskId, "info", "Email sent and workflow marked completed.");
            return { ok: true };
        }
        catch (err) {
            console.error(`PDF Generation failed for invoice ${invoice.id}. DB Error:`, err.message);
            throw err;
        }
    }
}
exports.TaskProcessor = TaskProcessor;
//# sourceMappingURL=taskProcesser.js.map