import { Router } from "express";

const router = Router();

import {
    loginUser,
    myProfile,
    registerUser,
    verifyEmail,
    verifyLoginOtp,
} from "../controllers/user-controller.js";
import { isAuth } from "../middlewares/isAuth.js";

// router.route("/").get(userControllers.home)
router.route("/register").post(registerUser);
router.route("/verify/:token").post(verifyEmail);
router.route("/login").post(loginUser); // loginUser controller to be added later
router.route("/verify-otp").post(verifyLoginOtp);
router.route("/me").get(isAuth, myProfile);

export default router;
