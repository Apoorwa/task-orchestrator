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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const db_service_1 = require("../../infra/db/db.service");
let InvoiceService = class InvoiceService {
    db;
    invoiceQueue;
    constructor(db, invoiceQueue) {
        this.db = db;
        this.invoiceQueue = invoiceQueue;
    }
    async startInvoiceWorkflow(customerId) {
        console.log("invoice service : ");
        const createWf = await this.db.query(`INSERT INTO workflows (name, status, metadata) VALUES ($1, $2, $3) RETURNING id, created_at`, [`invoice:${customerId}`, "pending", JSON.stringify({ customerId })]);
        const workflowId = createWf.rows[0].id;
        console.log("invoice service : work flow created for workflowId : ", workflowId);
        const createTask = await this.db.query(`INSERT INTO tasks (workflow_id, type, payload, idempotency_key) VALUES ($1, $2, $3, $4) RETURNING id`, [
            workflowId,
            "collect_orders",
            JSON.stringify({ customerId }),
            `collect:${customerId}:${new Date().toISOString().slice(0, 10)}`,
        ]);
        const taskId = createTask.rows[0].id;
        console.log(`invoice service : Task created for customer id ${customerId} with task id  ${taskId}`);
        console.log("task creted for customer id  : ", customerId, " task id : ", taskId);
        await this.invoiceQueue.add("collect-orders", { workflowId, taskId, customerId }, {
            attempts: 5,
            backoff: { type: "exponential", delay: 1000 },
        });
        return { workflowId, taskId };
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)("INVOICE_QUEUE")),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, bullmq_1.Queue])
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map