import jwt from "jsonwebtoken";
import { redisClient } from "./redis.js";

export const generateToken = async (id, res) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "1m",
    }); // Token valid for 1 minute

    const refreshToken = jwt.sign({ id }, process.env.REFRESH_SECRET, {
        expiresIn: "7d",
    }); // Refresh token valid for 7 days
    const refreshTokenKey = `refresh-token:${id}`;
    await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken); // Store refresh token in Redis for 7 days
    res.cookie("accessToken", accessToken, {
        httpOnly: true, // only readable by server
        // secure: true, // only sent over https
        sameSite: "strict", // prevent CSRF attacks
        maxAge: 60 * 1000, // 1 minute
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        // secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return { accessToken, refreshToken };
};
