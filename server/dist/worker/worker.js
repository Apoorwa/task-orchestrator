"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
require("reflect-metadata");
const ioredis_1 = require("ioredis");
const bullmq_1 = require("bullmq");
const pg_1 = require("pg");
dotenv.config();
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const dbUrl = "postgresql://postgres:postgres@localhost:5432/workflowdb";
const redis = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
const pool = new pg_1.Pool({ connectionString: dbUrl });
async function logTask(taskId, level, message) {
    await pool.query(`INSERT INTO task_logs (task_id, level, message) VALUES ($1, $2, $3)`, [taskId, level, message]);
}
async function handleCollectOrders(job) {
    const { taskId, workflowId, customerId } = job.data;
    console.log("worker : came for collecting order ");
    const t = await pool.query("SELECT status, payload FROM tasks WHERE id=$1", [
        taskId,
    ]);
    if (t.rowCount === 0)
        throw new Error("task not found");
    if (t.rows[0].status === "succeeded") {
        await logTask(taskId, "info", "task already succeeded (idempotency)");
        return { already: true };
    }
    console.log(`task stature is : ${t.rows[0].status}`);
    let res = await pool.query("UPDATE tasks SET status='running', started_at=now(), updated_at=now() WHERE id=$1", [taskId]);
    console.log(`came in handleCollectOrders to  update task with status running for task ${taskId} , ${res.rows.filter((obj) => obj.id == taskId)}`);
    try {
        const orders = [
            { id: "o1", status: "DELIVERED", invoiced: false, price: 100 },
            { id: "o2", status: "PENDING", invoiced: false, price: 50 },
        ];
        const toInvoice = orders.filter((o) => o.status === "DELIVERED" && !o.invoiced);
        const res = await pool.query("UPDATE tasks SET payload=$1, status='succeeded', finished_at=now(), updated_at=now() WHERE id=$2 returning *", [JSON.stringify({ customerId, collectedOrders: toInvoice }), taskId]);
        console.log(`Updating the task to be successed for taskId ${taskId} ${res.rows.filter((obj) => (obj.id = taskId))} `);
        await logTask(taskId, "info", `collected ${toInvoice.length} orders`);
        const nextRes = await pool.query(`INSERT INTO tasks (workflow_id, type, payload)
       VALUES ($1, $2, $3)
       RETURNING id`, [
            workflowId,
            "create_invoice",
            JSON.stringify({ customerId, orders: toInvoice }),
        ]);
        const nextTaskId = nextRes.rows[0].id;
        const invoiceQueue = new bullmq_1.Queue("invoice-queue", { connection: redis });
        console.log(`pushing entry to create invoice`);
        await invoiceQueue.add("create-invoice", {
            workflowId,
            taskId: nextTaskId,
            invoiceData: { customerId, orders: toInvoice },
        }, { attempts: 5 });
        return { ok: true };
    }
    catch (err) {
        await pool.query("UPDATE tasks SET retry_count = retry_count + 1, error=$1 WHERE id=$2", [err.message, taskId]);
        throw err;
    }
}
async function handleCreateInvoice(job) {
    const { taskId, workflowId, invoiceData } = job.data;
    console.log("came here to create invoice ");
    let res = await pool.query("UPDATE tasks SET status='running', started_at=now(), updated_at=now() WHERE id=$1 returning *", [taskId]);
    console.log("worker :: updating to running ", res.rows.filter((obj) => obj.id == taskId));
    try {
        const invoice = {
            id: `inv-${Date.now()}`,
            total: invoiceData.orders.reduce((s, o) => s + o.price, 0),
            createdAt: new Date().toISOString(),
        };
        let temp = await pool.query("UPDATE tasks SET payload=$1, status='succeeded', finished_at=now() WHERE id=$2", [JSON.stringify({ ...invoiceData, invoice }), taskId]);
        console.log(`worker :: updating to succeded ${taskId} ${temp.rows.filter((obj) => obj.id == taskId)}`);
        const pdfQueue = new bullmq_1.Queue("pdf-queue", { connection: redis });
        await pdfQueue.add("generate-pdf", { workflowId, invoice }, { attempts: 3 });
        return { invoice };
    }
    catch (err) {
        await pool.query("UPDATE tasks SET retry_count = retry_count + 1, error=$1 WHERE id=$2", [err.message, taskId]);
        throw err;
    }
}
async function handleGeneratePdf(job) {
    const { workflowId, invoice } = job.data;
    if (!workflowId || !invoice)
        throw new Error("Missing data for generate-pdf");
    console.log("Generating PDF for invoice", invoice.id);
    const emailQueue = new bullmq_1.Queue("email-queue", { connection: redis });
    await emailQueue.add("send-email", { workflowId, invoice, attachments: ["invoice.pdf"] }, { attempts: 3 });
    return { ok: true };
}
async function handleSendEmail(job) {
    const { workflowId, invoice, attachments } = job.data;
    console.log("Sending email for invoice", invoice.id, workflowId);
    const w = await pool.query("UPDATE workflows SET current_step='completed', updated_at=now() WHERE id=$1 returning *", [workflowId]);
    console.log(w.rows.filter((obj) => obj.id == workflowId));
    return { ok: true };
}
async function runWorkers() {
    const invoiceWorker = new bullmq_1.Worker("invoice-queue", async (job) => {
        if (job.name === "collect-orders")
            return handleCollectOrders(job);
        if (job.name === "create-invoice")
            return handleCreateInvoice(job);
    }, { connection: redis });
    const pdfWorker = new bullmq_1.Worker("pdf-queue", async (job) => {
        if (job.name === "generate-pdf")
            return handleGeneratePdf(job);
    }, { connection: redis });
    const emailWorker = new bullmq_1.Worker("email-queue", async (job) => {
        if (job.name === "send-email")
            return handleSendEmail(job);
    }, { connection: redis });
    console.log("Workers up and running");
}
runWorkers().catch((err) => {
    console.error("Worker startup failed", err);
    process.exit(1);
});
//# sourceMappingURL=worker.js.map