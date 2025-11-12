import { Router } from "express";

const router = Router();

import {
    loginUser,
    registerUser,
    verifyEmail,
    verifyLoginOtp,
} from "../controllers/user-controller.js";

// router.route("/").get(userControllers.home)
router.route("/register").post(registerUser);
router.route("/verify/:token").post(verifyEmail);
router.route("/login").post(loginUser); // loginUser controller to be added later
router.route("/verify-otp").post(verifyLoginOtp);

export default router;
