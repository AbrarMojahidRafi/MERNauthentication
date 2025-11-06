// config/redis.js
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisURL = process.env.REDIS_URL || "redis://localhost:6379";

if (!redisURL) {
    console.error("REDIS_URL is not defined in environment variables");
    process.exit(1);
}

export const redisClient = createClient({ url: redisURL });

redisClient.on("error", (err) => console.error("Redis Client Error", err));

await redisClient.connect();
console.log("✅ Connected to Redis successfully");

export default redisClient;
