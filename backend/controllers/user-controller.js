import { registerSchema } from "../config/zod.js";
import TryCatch from "../middlewares/TryCatch.js";
import sanitize from "mongo-sanitize";
import { UserModel } from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import { redisClient } from "../config/redis.js";
import { getVerifyEmailHtml } from "../config/html.js";

export const registerUser = TryCatch(async (req, res) => {
    const senitizedBody = sanitize(req.body);
    const validatedData = registerSchema.safeParse(senitizedBody);

    if (!validatedData.success) {
        let zorError = validatedData.error;

        let firstErrorMessage = "validation error";
        let allErrors = [];

        if (zorError.issues && Array.isArray(zorError.issues)) {
            allErrors = zorError.issues.map((issue) => ({
                field: issue.path ? issue.path.join(".") : "unknown",
                message: issue.message || "Invalid value",
                code: issue.code || "invalid_type",
            }));

            firstErrorMessage = allErrors[0].message || firstErrorMessage;
        }

        return res.status(400).json({
            message: firstErrorMessage,
            errors: allErrors,
        });
    }

    const { name, email, password } = validatedData.data;

    // rate limit
    const rateLimitkey = `register-rate-limit:${req.ip}:${email}`;

    if (await redisClient.get(rateLimitkey)) {
        return res.status(429).json({
            message: "Too many registration attempts. Please try again later.",
        });
    }

    //  user exists check logic goes here
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        return res
            .status(409)
            .json({ message: "User with this email already exists" });
    }

    // Hashing the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // varified token for email verification logic goes here
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const verifyKey = `verify:${verificationToken}`;

    const dataToStore = JSON.stringify({
        name,
        email,
        password: hashedPassword,
    });

    await redisClient.set(verifyKey, dataToStore, { EX: 60 * 5 }); // 5 mins expiration

    // send verification email logic goes here
    const subject = "Verify your email address for account registration";
    const html = getVerifyEmailHtml({ email, token: verificationToken });

    await sendMail({ email, subject, html });

    await redisClient.set(rateLimitkey, "true", { EX: 60 }); // 1 min rate limit

    //   res.status(201).json({ message: "User registered successfully" });
    res.status(201).json({
        message:
            "Registration successful! Please check your email to verify your account.",
        email,
    });
});
