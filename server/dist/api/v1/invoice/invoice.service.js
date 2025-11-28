"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = exports.WORKFLOW_ENGINE_TOKEN = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
exports.WORKFLOW_ENGINE_TOKEN = "IWorkflowEngine";
let InvoiceService = class InvoiceService {
    workflowEngine;
    invoiceQueue;
    constructor(workflowEngine, invoiceQueue) {
        this.workflowEngine = workflowEngine;
        this.invoiceQueue = invoiceQueue;
    }
    async startInvoiceWorkflow(customerId) {
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
        const task = await this.workflowEngine.queueNewTask(workflowId, taskType, payload, undefined, idempotencyKey);
        const taskId = task.id;
        console.log(`Task created: ${taskId} (Type: ${taskType})`);
        await this.invoiceQueue.add("collect-orders", { workflowId, taskId, customerId }, {
            attempts: 5,
            backoff: { type: "exponential", delay: 1000 },
            jobId: taskId,
        });
        const updatedWf = await this.workflowEngine.updateWorkflowStatus(workflowId, "running", "collect_orders");
        console.log(`Workflow updated to status: ${updatedWf.status} at step: ${updatedWf.currentStep}`);
        return { workflowId, taskId };
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.WORKFLOW_ENGINE_TOKEN)),
    __param(1, (0, common_1.Inject)("INVOICE_QUEUE")),
    __metadata("design:paramtypes", [Object, bullmq_1.Queue])
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map