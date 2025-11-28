import { Provider } from "@nestjs/common";
import IORedis from "ioredis";

export const RedisProvider: Provider = {
  provide: "REDIS_CLIENT",
  useFactory: () => {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    return new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  },
};
