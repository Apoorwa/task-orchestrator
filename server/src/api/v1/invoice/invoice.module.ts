import { Module } from "@nestjs/common";
import { InvoiceService } from "./invoice.service";
import { InvoiceController } from "./invoice.controller";
import { EngineModule } from "../../../infra/db/postgres/engine/engine.module";
import { QueueModule } from "../../../infra/queue/queue.module";

@Module({
  imports: [EngineModule, QueueModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}
