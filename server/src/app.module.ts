import { Module } from "@nestjs/common";
import { InvoiceModule } from "./api/v1/invoice/invoice.module";
import { QueueModule } from "./infra/queue/queue.module";
import { EngineModule } from "./infra/db/postgres/engine/engine.module";

@Module({
  imports: [EngineModule, QueueModule, InvoiceModule],
})
export class AppModule {}
