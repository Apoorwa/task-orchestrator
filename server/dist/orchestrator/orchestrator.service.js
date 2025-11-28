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
exports.OrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../infra/db/db.service");
const bullmq_1 = require("bullmq");
const common_2 = require("@nestjs/common");
let OrchestratorService = class OrchestratorService {
    db;
    pdfQueue;
    emailQueue;
    constructor(db, pdfQueue, emailQueue) {
        this.db = db;
        this.pdfQueue = pdfQueue;
        this.emailQueue = emailQueue;
    }
    async onModuleInit() {
        setInterval(() => this.poll(), 2000);
    }
    async poll() {
        const res = await this.db.query(`SELECT t.id, t.workflow_id, t.type, t.payload
       FROM tasks t
       WHERE t.status = 'succeeded' AND t.type = 'create_invoice'`);
        for (const row of res.rows) {
            const payload = row.payload;
            await this.pdfQueue.add("generate-pdf", { workflowId: row.workflow_id, invoiceData: payload }, { attempts: 3 });
            await this.db.query(`UPDATE workflows SET current_step=$1, updated_at=now() WHERE id=$2`, ["pdf_generation", row.workflow_id]);
        }
    }
};
exports.OrchestratorService = OrchestratorService;
exports.OrchestratorService = OrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_2.Inject)("PDF_QUEUE")),
    __param(2, (0, common_2.Inject)("EMAIL_QUEUE")),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, bullmq_1.Queue,
        bullmq_1.Queue])
], OrchestratorService);
//# sourceMappingURL=orchestrator.service.js.map