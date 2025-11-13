import { loginSchema, registerSchema } from "../config/zod.js";
import TryCatch from "../middlewares/TryCatch.js";
import sanitize from "mongo-sanitize";
import { UserModel } from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import { redisClient } from "../config/redis.js";
import { getOtpHtml, getVerifyEmailHtml } from "../config/html.js";
import { generateToken } from "../config/generateToken.js";

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

export const verifyEmail = TryCatch(async (req, res) => {
    // GET token from req.params or url
    const { token } = req.params;
    if (!token) {
        res.status(400).json({ message: "Verification token is required" });
    }
    const verifyKey = `verify:${token}`;
    // Get user data from redis using the token
    const userDataJSON = await redisClient.get(verifyKey);
    // If no data found, invalid or expired token then
    if (!userDataJSON) {
        return res
            .status(400)
            .json({ message: "Invalid or expired verification token" });
    }
    // After getting data from redis, delete the token from redis
    await redisClient.del(verifyKey);
    // Making the JSON data to object
    const userData = JSON.parse(userDataJSON);
    // Checking if user already exists in DB or not
    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
        return res
            .status(409)
            .json({ message: "User with this email already exists" });
    }
    // Means user not exists, create new user in DB
    const newUser = new UserModel({
        name: userData.name,
        email: userData.email,
        password: userData.password,
    });
    await newUser.save();
    // Finally send response that email verified and user registered successfully
    res.status(201).json({
        message: "Email verified and user registered successfully",
        user: { id: newUser._id, email: newUser.email, name: newUser.name },
    });
});

// Now Lets login user
export const loginUser = TryCatch(async (req, res) => {
    // login logic will be here
    const senitizedBody = sanitize(req.body);
    const validatedData = loginSchema.safeParse(senitizedBody);

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

    const { email, password } = validatedData.data; // finally getting the email, and password

    // rate limit
    const rateLimitkey = `login-rate-limit:${req.ip}:${email}`;
    if (await redisClient.get(rateLimitkey)) {
        return res.status(429).json({
            message: "Too many registration attempts. Please try again later.",
        });
    }

    // Get user from DB by email.
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
        // if user not found
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        // if password not match
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // If all ok, then send an OTP to user's email for login verification
    // generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `login-otp:${email}`; // we are sending otp to this email
    await redisClient.set(otpKey, JSON.stringify(otp), { EX: 300 }); // OTP valid for 5 minutes

    // making the content of sending an OTP
    const subject = "Your OTP for login to Authentication App";
    const html = getOtpHtml({ email, otp });
    await sendMail({ email, subject, html });
    await redisClient.set(rateLimitkey, "true", { EX: 60 }); // 1 min rate limit

    res.status(200).json({
        message:
            "If your email is valid, an OTP has been send. It will be valid for 5 minutes.",
    });
});

export const verifyLoginOtp = TryCatch(async (req, res) => {
    // get email and otp from req.body
    // const senitizedBody = sanitize(req.body);
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
    }
    // adding redis otp key
    const otpKey = `login-otp:${email}`;
    // getting stored otp from redis
    const storedOtpString = await redisClient.get(otpKey);
    if (!storedOtpString) {
        return res.status(400).json({ message: "OTP has expired or invalid" });
    }
    const storedOtp = JSON.parse(storedOtpString);
    // comparing the otp
    if (otp !== storedOtp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }
    // deleting the otp from redis after successful verification
    await redisClient.del(otpKey);
    // finding user from DB using email
    const user = await UserModel.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    // now jwt token or session token will be pursed here for maintaining login session
    const tokenData = await generateToken(user._id, res);
    // finally sending success response
    res.status(200).json({
        message: `Login successful....\nWelcome ${user.name}`,
        user,
    });
});

// make an api, to get the current logged in user details
// making first authenticated request
export const myProfile = TryCatch(async (req, res) => {
    const user = req.user; // coming from isAuth middleware
    res.status(200).json({
        success: true,
        user,
    }); // ✅ CORRECT - sending proper response
});
