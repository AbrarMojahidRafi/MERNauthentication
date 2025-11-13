import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis.js";
import { UserModel } from "../models/User.js";

export const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(403).json({
                message: "Please Login - no token",
            });
        }

        const deacodedData = jwt.verify(token, process.env.JWT_SECRET);
        if (!deacodedData) {
            return res.status(400).json({
                message: "Token expiried or invalid",
            });
        }

        const cashedUser = await redisClient.get(`user:${deacodedData.id}`);
        if (cashedUser) {
            req.user = JSON.parse(cashedUser);
            return next();
        }

        const user = await UserModel.findById(deacodedData.id).select(
            "-password"
        );
        if (!user) {
            return res.status(400).json({
                message: "No user with this id",
            });
        }

        // storing the user in the redisClient
        await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));

        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
