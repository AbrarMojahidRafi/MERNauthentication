import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisURL = process.env.REDIS_URL || "redis://localhost:6379";

if (!redisURL) {
    console.error("REDIS_URL is not defined in environment variables");
    process.exit(1);
}

export const redisClient = createClient({
    url: redisURL,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

export const connectRedis = async () => {
    await redisClient
        .connect()
        .then(() => {
            console.log("Connected to Redis successfully");
        })
        .catch((err) => {
            console.error("Redis connection error:", err);
            process.exit(1);
        });
};
