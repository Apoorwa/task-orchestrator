## 📌 What This System Is About

This Proof of Concept (PoC) demonstrates a scalable and fault-tolerant
**queue/worker system** designed to execute multi-step workflows in a
cloud-based web application.

---

## Requirements Provided for the System

### **System Components**

#### **1. Queue Manager**

- Manages incoming tasks
- Pushes tasks into queues
- Assigns tasks to worker nodes

#### **2. Worker Nodes**

- Execute queued tasks
- Can run HTTP calls, computation logic, and integrations
- Update task status

#### **3. Coordinator**

- Orchestrates workflow steps
- Manages sequencing
- Performs retries and compensation

#### **4. Database**

- Stores tasks, workflow schemas, logs

---

## Functionality Requirements

### **Task Queuing**

Supports HTTP triggers, scheduled jobs, and internal events.

### **Task Execution**

Supports: - API calls

- Data processing
- Email/PDF generation

### **Monitoring & Logging**

Stores: - Status

- Timestamps
- Metadata
- Retry count

### **Retry & Compensation**

Ensures consistency across distributed systems.

### **Scalability**

Horizontal worker scaling.

---


## System Design

┌──────────────┐      REST      ┌────────────────┐
│  Client App  │ ─────────────→ │   API Server   │
└──────────────┘                │   (NestJS)     │
                                └───────┬────────┘
                                        │
                                        ▼
                          ┌─────────────────────────┐
                          │  Workflow Orchestrator  │
                          └──────────┬──────────────┘
                                     │ pushes tasks
                                     ▼
                               ┌───────────┐
                               │   Redis   │
                               │  (Queue)  │
                               └─────┬─────┘
                       pulls jobs   │
                                     ▼
                    ┌──────────────────────────┐
                    │        Workers           │
                    │ (PDF, Email, Invoice)    │
                    └──────────────────────────┘
                                 │ updates state
                                 ▼
                      ┌────────────────────────┐
                      │       Postgres         │
                      │ (Workflow Metadata DB) │
                      └────────────────────────┘


## 🛠️ Technical Specifications

- **TypeScript**
- **NestJS**
- **PostgreSQL**
- **Redis + BullMQ**
- **Node.js Workers**

---

## Example Use Case: Invoice Workflow

### **Steps**

1.  Retrieve orders
2.  Create invoice entry
3.  Generate PDF (worker)
4.  Email invoice (worker)

---

# Running the Application Locally

Follow these steps to run everything on your system.

---

```bash
cd server
npm install
```

## **1️⃣ Start PostgreSQL & Redis using Docker Compose**

```bash
docker-compose up -d
```

## **2️⃣ Create the Database**

```bash
docker exec -it <postgres_container_name> psql -U postgres -c "CREATE DATABASE workflowdb;"

```

## **3️⃣ Create a `.env` File**

    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/workflowdb
    REDIS_HOST=localhost
    REDIS_PORT=6379

## **4️⃣ Run Database Migrations**

```bash
npm run migrate
```

## **5️⃣ Start the API Server**

```bash
npm run start:dev
```

## **6️⃣ Start the Worker Process**

```bash
npm run worker:dev
```

---

## **7️⃣ Trigger the Workflow API**

Send a POST request to:

    POST http://localhost:3000/invoice/start

With JSON body:

```json
{
  "customerId": "cust-01"
}
```

Example using curl:

```bash
curl -X POST http://localhost:3000/invoice/start   -H "Content-Type: application/json"   -d '{"customerId": "cust-01"}'
```
