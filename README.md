# Queue/Worker System PoC - README

## 📌 What This System Is About

This Proof of Concept (PoC) demonstrates a scalable and fault‑tolerant **queue/worker system** designed to execute multi‑step workflows in a cloud‑based web application. The system handles high task volumes, supports long‑running operations, ensures workflow consistency, and provides mechanisms for retries, compensation, and monitoring.

It follows **Clean Architecture principles**, ensuring separation of concerns, testability, and maintainability.

The goal is to showcase how tasks can be queued, executed asynchronously, monitored, and orchestrated reliably across distributed worker nodes.

---

## 📦 Requirements Provided for the System

### **System Components**

The PoC includes the following major components:

#### **1. Queue Manager**

- Receives and manages incoming tasks.
- Places tasks into appropriate queues.
- Assigns tasks to available worker nodes.

#### **2. Worker Nodes**

- Execute tasks pulled from the queue.
- Can run HTTP calls, computational tasks, or external service integrations.
- Update task statuses upon completion.
- Can scale horizontally based on load.

#### **3. Coordinator**

- Manages workflow orchestration.
- Ensures tasks execute in the correct order.
- Retries failed tasks using defined retry strategies.
- Triggers compensation logic to maintain consistency.

#### **4. Database**

- Stores task states, logs, workflow schema, and execution metadata.
- Ensures observability for audits and debugging.

---

## ⚙️ Functionality Requirements

### **1. Task Queuing**

- Tasks triggered by HTTP requests, scheduled jobs, or internal events.
- Queuing system should efficiently manage high‑volume and long‑running tasks.

### **2. Task Execution**

- Worker nodes must support:

  - HTTP/API calls
  - CPU‑bound or IO‑bound data processing
  - Integration tasks (email, PDF generation, etc.)

### **3. Task Monitoring & Logging**

- Each task should record:

  - Current status (queued, running, failed, completed)
  - Execution logs
  - Metadata (timestamps, worker ID, retry count)

### **4. Retry & Compensation Mechanisms**

- Robust retry strategies for transient failures.
- Compensation logic for partial workflow failures.
- Ensures data consistency across distributed transactions.

### **5. Scalability**

- Must scale horizontally by adding more worker nodes.
- Queue and worker system should support elastic scaling.

---

## 🛠️ Technical Specifications

- **Programming Language:** TypeScript
- **Framework:** TBD
- **Database:** TBD
- **Queue System:** TBD
- **Worker Runtime:** TBD
- **Architecture:** Clean Architecture Pattern

---

## 🧾 Example Use Case: Invoice Workflow

To understand how this workflow system integrates with real‑world business processes, consider the **invoice generation workflow** powered by data from a Ninox database.

### **Workflow Steps**

1. **Retrieve customer orders** from Ninox.
2. **Filter orders** that are delivered but not yet invoiced.
3. **Fetch item prices and details** for invoicing.
4. **Create an invoice record** in the system.
5. **Send invoice data to a PDF Processor** (asynchronous task) to generate the invoice PDF.
6. **Send an email** to the customer containing the invoice (async task).

### **Scheduling Options**

- Invoice creation can run **daily**, processing completed orders.
- Email delivery workflow can run **weekly**, sending grouped invoices to customers.

This showcases how multiple workflows—invoice creation and email delivery—can operate independently while being orchestrated reliably within the queue/worker system.

---
