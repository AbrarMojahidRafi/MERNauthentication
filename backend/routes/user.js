import { Router } from "express";

const router = Router();

import {
    loginUser,
    registerUser,
    verifyEmail,
} from "../controllers/user-controller.js";

// router.route("/").get(userControllers.home)
router.route("/register").post(registerUser);
router.route("/verify/:token").post(verifyEmail);
router.route("/login").post(loginUser); // loginUser controller to be added later 

export default router;
