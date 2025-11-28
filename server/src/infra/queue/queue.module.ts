import { Global, Module } from "@nestjs/common";
import { RedisProvider } from "../redis.provider";
import { Queue } from "bullmq";

@Global()
@Module({
  providers: [
    RedisProvider,
    {
      provide: "INVOICE_QUEUE",
      useFactory: (redisClient) =>
        new Queue("invoice-queue", { connection: redisClient }),
      inject: ["REDIS_CLIENT"],
    },
    {
      provide: "PDF_QUEUE",
      useFactory: (redisClient) =>
        new Queue("pdf-queue", { connection: redisClient }),
      inject: ["REDIS_CLIENT"],
    },
    {
      provide: "EMAIL_QUEUE",
      useFactory: (redisClient) =>
        new Queue("email-queue", { connection: redisClient }),
      inject: ["REDIS_CLIENT"],
    },
  ],
  exports: ["INVOICE_QUEUE", "PDF_QUEUE", "EMAIL_QUEUE", "REDIS_CLIENT"],
})
export class QueueModule {}
