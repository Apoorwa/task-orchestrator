"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisProvider = void 0;
const ioredis_1 = require("ioredis");
exports.RedisProvider = {
    provide: "REDIS_CLIENT",
    useFactory: () => {
        const url = process.env.REDIS_URL || "redis://localhost:6379";
        return new ioredis_1.default(url, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        });
    },
};
//# sourceMappingURL=redis.provider.js.map